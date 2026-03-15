import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/shelters — list shelters, optionally filtered by parish
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const parish = req.query.parish as string | undefined;

  // Lightweight response for shelter picker (filtered by parish)
  if (parish) {
    const shelters = await prisma.shelter.findMany({
      where: { parish },
      select: {
        id: true,
        name: true,
        parish: true,
        facilityType: true,
        location: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ shelters });
    return;
  }

  // Full response for admin dashboard (all shelters with latest update)
  const shelters = await prisma.shelter.findMany({
    include: {
      updates: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          capacityLevel: true,
          waterLevel: true,
          foodLevel: true,
          medicalLevel: true,
          createdAt: true,
        },
      },
    },
  });

  const result = shelters.map((s) => ({
    id: s.id,
    name: s.name,
    parish: s.parish,
    location: s.location,
    facilityType: s.facilityType,
    lat: s.lat,
    lng: s.lng,
    maxCapacity: s.maxCapacity,
    status: s.status,
    latestUpdate: s.updates[0] ?? null,
  }));

  res.json({ shelters: result });
});

// GET /api/shelters/:id — single shelter with update history
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const shelter = await prisma.shelter.findUnique({
    where: { id: req.params.id },
    include: {
      updates: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!shelter) {
    res.status(404).json({ error: 'Shelter not found' });
    return;
  }

  res.json({ shelter });
});

export default router;
