import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import type { DisasterStatus } from '@prisma/client';

const router = Router();

// All disaster routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/disasters — list all disaster events
router.get('/', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const events = await prisma.disasterEvent.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ events });
}));

// POST /api/disasters — create new disaster event
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    category,
    windSpeedMph,
    affectedParishes,
    status,
    landfallDate,
    startDate,
    endDate,
    notes,
  } = req.body;

  if (!name || !startDate || !affectedParishes?.length) {
    res.status(400).json({ error: 'name, startDate, and affectedParishes are required' });
    return;
  }

  const event = await prisma.disasterEvent.create({
    data: {
      name,
      category: category ?? null,
      windSpeedMph: windSpeedMph ?? null,
      affectedParishes,
      status: status ?? 'PREPARING',
      landfallDate: landfallDate ? new Date(landfallDate) : null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes: notes ?? null,
    },
  });

  res.status(201).json({ event });
}));

// PATCH /api/disasters/:id — update disaster event
router.patch('/:id', asyncHandler(async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, name, category, windSpeedMph, affectedParishes, landfallDate, endDate, notes } =
    req.body;

  const existing = await prisma.disasterEvent.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Disaster event not found' });
    return;
  }

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status as DisasterStatus;
  if (name !== undefined) data.name = name;
  if (category !== undefined) data.category = category;
  if (windSpeedMph !== undefined) data.windSpeedMph = windSpeedMph;
  if (affectedParishes !== undefined) data.affectedParishes = affectedParishes;
  if (landfallDate !== undefined) data.landfallDate = landfallDate ? new Date(landfallDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (notes !== undefined) data.notes = notes;

  const event = await prisma.disasterEvent.update({
    where: { id },
    data,
  });

  res.json({ event });
}));

// GET /api/disasters/:id/stats — summary statistics for an event
router.get('/:id/stats', asyncHandler(async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  const event = await prisma.disasterEvent.findUnique({ where: { id } });
  if (!event) {
    res.status(404).json({ error: 'Disaster event not found' });
    return;
  }

  const updates = await prisma.shelterUpdate.findMany({
    where: { disasterEventId: id },
  });

  const shelterIds = new Set(updates.map(u => u.shelterId));
  const totalUpdates = updates.length;
  const sheltersReporting = shelterIds.size;

  let avgCapacity = 0;
  let avgWater = 0;
  let avgFood = 0;
  let avgMedical = 0;
  let criticalCapacity = 0;
  let criticalWater = 0;

  if (totalUpdates > 0) {
    // Get latest update per shelter
    const latestByShelterId = new Map<string, typeof updates[0]>();
    for (const u of updates) {
      const existing = latestByShelterId.get(u.shelterId);
      if (!existing || u.createdAt > existing.createdAt) {
        latestByShelterId.set(u.shelterId, u);
      }
    }

    const latest = Array.from(latestByShelterId.values());
    const count = latest.length;

    avgCapacity = latest.reduce((s, u) => s + u.capacityLevel, 0) / count;
    avgWater = latest.reduce((s, u) => s + u.waterLevel, 0) / count;
    avgFood = latest.reduce((s, u) => s + u.foodLevel, 0) / count;
    avgMedical = latest.reduce((s, u) => s + u.medicalLevel, 0) / count;

    criticalCapacity = latest.filter(u => u.capacityLevel >= 4).length;
    criticalWater = latest.filter(u => u.waterLevel <= 2).length;
  }

  res.json({
    stats: {
      totalUpdates,
      sheltersReporting,
      avgCapacity: Math.round(avgCapacity * 10) / 10,
      avgWater: Math.round(avgWater * 10) / 10,
      avgFood: Math.round(avgFood * 10) / 10,
      avgMedical: Math.round(avgMedical * 10) / 10,
      criticalCapacity,
      criticalWater,
    },
  });
}));

// GET /api/disasters/:id/timeline — hourly update timeline for historical analysis
router.get('/:id/timeline', asyncHandler(async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  const event = await prisma.disasterEvent.findUnique({ where: { id } });
  if (!event) {
    res.status(404).json({ error: 'Disaster event not found' });
    return;
  }

  const updates = await prisma.shelterUpdate.findMany({
    where: { disasterEventId: id },
    include: { shelter: { select: { id: true, name: true, parish: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (updates.length === 0) {
    res.json({
      timeline: [],
      summary: { totalUpdates: 0, sheltersReporting: 0, peakAvgCapacity: 0, criticalCount: 0, criticalResourceCount: 0, timeToFiftyPercent: null, timeToEightyPercent: null, mostAffectedParish: null },
    });
    return;
  }

  const startTime = event.startDate.getTime();

  // Group updates by hour
  const hourlyBuckets = new Map<number, typeof updates>();
  for (const u of updates) {
    const hour = Math.floor((u.createdAt.getTime() - startTime) / 3600_000);
    const bucket = hourlyBuckets.get(hour) || [];
    bucket.push(u);
    hourlyBuckets.set(hour, bucket);
  }

  const timeline = Array.from(hourlyBuckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, hourUpdates]) => {
      const count = hourUpdates.length;
      const avgCapacity = hourUpdates.reduce((s, u) => s + u.capacityLevel, 0) / count;
      const avgWater = hourUpdates.reduce((s, u) => s + u.waterLevel, 0) / count;
      const avgFood = hourUpdates.reduce((s, u) => s + u.foodLevel, 0) / count;
      const avgMedical = hourUpdates.reduce((s, u) => s + u.medicalLevel, 0) / count;
      const criticalShelters = hourUpdates.filter(u => u.capacityLevel >= 4).length;
      const criticalResources = hourUpdates.filter(u => u.waterLevel <= 2 || u.foodLevel <= 2 || u.medicalLevel <= 2).length;
      return {
        hour,
        updateCount: count,
        shelterCount: [...new Set(hourUpdates.map(u => u.shelterId))].length,
        avgCapacity: Math.round(avgCapacity * 10) / 10,
        avgWater: Math.round(avgWater * 10) / 10,
        avgFood: Math.round(avgFood * 10) / 10,
        avgMedical: Math.round(avgMedical * 10) / 10,
        criticalShelters,
        criticalResources,
      };
    });

  // Summary stats
  const allShelterIds = new Set(updates.map(u => u.shelterId));
  const latestByShelterId = new Map<string, typeof updates[0]>();
  for (const u of updates) {
    const existing = latestByShelterId.get(u.shelterId);
    if (!existing || u.createdAt > existing.createdAt) {
      latestByShelterId.set(u.shelterId, u);
    }
  }
  const latestUpdates = Array.from(latestByShelterId.values());
  const peakAvgCapacity = timeline.length > 0 ? Math.max(...timeline.map(t => t.avgCapacity)) : 0;
  const criticalCount = latestUpdates.filter(u => u.capacityLevel >= 4).length;
  const criticalResourceCount = latestUpdates.filter(u => u.waterLevel <= 2 || u.foodLevel <= 2 || u.medicalLevel <= 2).length;
  const timeToFiftyPercent = timeline.find(t => t.avgCapacity >= 2.5)?.hour ?? null;
  const timeToEightyPercent = timeline.find(t => t.avgCapacity >= 4)?.hour ?? null;

  const parishCounts = new Map<string, number>();
  for (const u of updates) {
    const parish = u.shelter.parish;
    parishCounts.set(parish, (parishCounts.get(parish) || 0) + 1);
  }
  const mostAffectedParish = [...parishCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  res.json({
    timeline,
    summary: {
      totalUpdates: updates.length,
      sheltersReporting: allShelterIds.size,
      peakAvgCapacity: Math.round(peakAvgCapacity * 10) / 10,
      criticalCount,
      criticalResourceCount,
      timeToFiftyPercent,
      timeToEightyPercent,
      mostAffectedParish,
    },
  });
}));

export default router;
