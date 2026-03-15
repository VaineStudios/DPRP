import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { analyzeNetwork, predictPreparedness } from '../services/ai.js';
import type { Priority } from '@prisma/client';

// In-memory cache for analyze responses
const analyzeCache = new Map<string, { data: unknown; expiresAt: number }>();

const CACHE_TTL_MS = (parseInt(process.env.AI_CACHE_TTL_MINUTES || '5', 10)) * 60_000;

const getCacheKey = (disasterEventId: string): string => {
  const bucket = Math.floor(Date.now() / CACHE_TTL_MS);
  return `analyze:${disasterEventId}:${bucket}`;
};

const priorityMap: Record<string, Priority> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

export const createAiRouter = (io: Server) => {
  const router = Router();

  // All AI routes require ADMIN role
  router.use(authenticate, authorize('ADMIN'));

  // POST /api/ai/analyze — analyze shelter network during active disaster
  router.post('/analyze', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { disasterEventId } = req.body;

    if (!disasterEventId) {
      res.status(400).json({ error: 'disasterEventId is required' });
      return;
    }

    // Check cache
    const cacheKey = getCacheKey(disasterEventId);
    const cached = analyzeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json({ recommendations: cached.data, cached: true });
      return;
    }

    // Fetch event
    const event = await prisma.disasterEvent.findUnique({
      where: { id: disasterEventId },
    });
    if (!event) {
      res.status(404).json({ error: 'Disaster event not found' });
      return;
    }

    // Fetch all shelters with their latest update
    const shelters = await prisma.shelter.findMany({
      include: {
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const shelterData = shelters.map(s => ({
      ...s,
      latestUpdate: s.updates[0] ?? null,
    }));

    try {
      const recommendations = await analyzeNetwork(event, shelterData);

      // Store each recommendation in DB — validate shelter IDs first
      const stored = await Promise.all(
        recommendations.map(async rec => {
          let validShelterId: string | null = null;
          if (rec.target_shelter_id) {
            const shelter = await prisma.shelter.findUnique({ where: { id: rec.target_shelter_id }, select: { id: true } });
            if (shelter) validShelterId = shelter.id;
          }
          return prisma.aiRecommendation.create({
            data: {
              disasterEventId,
              shelterId: validShelterId,
              type: 'RESPONSE',
              priority: priorityMap[rec.priority] || 'MEDIUM',
              recommendation: rec.recommendation,
              reasoning: rec.reasoning,
            },
            include: {
              shelter: { select: { id: true, name: true, parish: true, lat: true, lng: true } },
            },
          });
        })
      );

      // Cache result
      analyzeCache.set(cacheKey, {
        data: stored,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      // Emit socket event to admin room
      io.to('admin').emit('ai:recommendation', { recommendations: stored, disasterEventId });

      res.json({ recommendations: stored });
    } catch (err) {
      console.error('AI analyze error:', err);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'AI analysis failed',
      });
    }
  }));

  // POST /api/ai/predict — preparedness predictions for approaching event or ad-hoc scenario
  router.post('/predict', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { disasterEventId, scenario } = req.body;

    // Either disasterEventId OR scenario is required
    if (!disasterEventId && !scenario) {
      res.status(400).json({ error: 'disasterEventId or scenario is required' });
      return;
    }

    let eventForPrediction: {
      name: string;
      category: number | null;
      windSpeedMph: number | null;
      affectedParishes: string[];
      landfallDate: Date | null;
      startDate: Date;
      endDate: Date | null;
      status: string;
    };
    let storeEventId: string | null = null;

    if (disasterEventId) {
      const event = await prisma.disasterEvent.findUnique({
        where: { id: disasterEventId },
      });
      if (!event) {
        res.status(404).json({ error: 'Disaster event not found' });
        return;
      }
      eventForPrediction = event;
      storeEventId = disasterEventId;
    } else {
      // Ad-hoc scenario mode
      const { category, windSpeedMph, affectedParishes, name } = scenario;
      if (!affectedParishes?.length) {
        res.status(400).json({ error: 'scenario.affectedParishes is required' });
        return;
      }
      eventForPrediction = {
        name: name || `Scenario (Cat ${category || 'N/A'})`,
        category: category ?? null,
        windSpeedMph: windSpeedMph ?? null,
        affectedParishes,
        landfallDate: null,
        startDate: new Date(),
        endDate: null,
        status: 'PREPARING',
      };
    }

    // Fetch historical events (CLOSED) with their update timelines
    const historicalEvents = await prisma.disasterEvent.findMany({
      where: { status: 'CLOSED' },
      include: {
        updates: {
          include: {
            shelter: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    try {
      const predictions = await predictPreparedness(
        eventForPrediction as Parameters<typeof predictPreparedness>[0],
        historicalEvents,
      );

      // Store predictions as recommendations (only if linked to a real event)
      const stored = [];
      if (storeEventId) {
        for (const pred of predictions.predictions) {
          const rec = await prisma.aiRecommendation.create({
            data: {
              disasterEventId: storeEventId,
              type: 'PREPAREDNESS',
              priority: 'HIGH',
              recommendation: `${pred.shelterName} estimated to reach capacity at ${pred.estimatedCapacityReachTime}`,
              reasoning: `Confidence: ${pred.confidence}. Based on IRIS historical modeling from similar events.`,
            },
          });
          stored.push(rec);
        }

        for (const pos of predictions.prePositioning) {
          let validShelterId: string | null = null;
          if (pos.shelterId) {
            const shelter = await prisma.shelter.findUnique({ where: { id: pos.shelterId }, select: { id: true } });
            if (shelter) validShelterId = shelter.id;
          }

          const rec = await prisma.aiRecommendation.create({
            data: {
              disasterEventId: storeEventId,
              shelterId: validShelterId,
              type: 'PREPAREDNESS',
              priority: 'MEDIUM',
              recommendation: `Pre-position ${pos.quantity} ${pos.resource} supplies`,
              reasoning: pos.rationale,
            },
          });
          stored.push(rec);
        }
      }

      res.json({ predictions, stored });
    } catch (err) {
      console.error('IRIS predict error:', err);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'IRIS prediction failed',
      });
    }
  }));

  // GET /api/ai/recommendations — retrieve stored recommendations
  router.get('/recommendations', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { eventId, type } = req.query;

    if (!eventId) {
      res.status(400).json({ error: 'eventId query parameter is required' });
      return;
    }

    const where: Record<string, unknown> = { disasterEventId: eventId as string };
    if (type) {
      where.type = type as string;
    }

    const recommendations = await prisma.aiRecommendation.findMany({
      where,
      include: {
        shelter: { select: { id: true, name: true, parish: true, lat: true, lng: true } },
      },
      orderBy: [
        { priority: 'asc' }, // CRITICAL < HIGH < MEDIUM < LOW in enum order
        { createdAt: 'desc' },
      ],
    });

    // Re-sort so CRITICAL is first (Prisma enum order may differ)
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    recommendations.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 4;
      const pb = priorityOrder[b.priority] ?? 4;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ recommendations });
  }));

  return router;
};
