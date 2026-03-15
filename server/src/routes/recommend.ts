import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { rankShelters } from '../services/geolocation.js';

const router = Router();

// GET /api/recommend?lat=&lng= — public, no auth
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const latStr = req.query.lat as string | undefined;
  const lngStr = req.query.lng as string | undefined;

  if (!latStr || !lngStr) {
    res.status(400).json({ error: 'lat and lng query parameters are required' });
    return;
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'lat and lng must be valid numbers' });
    return;
  }

  // Jamaica bounds check
  if (lat < 17.5 || lat > 18.6 || lng < -78.5 || lng > -76.0) {
    res.status(400).json({ error: 'Coordinates are outside Jamaica bounds' });
    return;
  }

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
        },
      },
    },
  });

  const ranked = rankShelters(shelters, lat, lng);

  res.json({ shelters: ranked });
}));

export default router;
