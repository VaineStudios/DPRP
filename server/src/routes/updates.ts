import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { emitShelterUpdate } from '../services/socket.js';
import type { ShelterUpdateRequest } from '../types/index.js';
import type { Server } from 'socket.io';

export const createUpdateRouter = (io: Server) => {
  const router = Router();

  // POST /api/updates — submit shelter update
  router.post(
    '/',
    authenticate,
    authorize('SHELTER_MANAGER'),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { shelterId, capacityLevel, waterLevel, foodLevel, medicalLevel, notes } =
        req.body as ShelterUpdateRequest;

      // Validate levels are integers 1-5
      const levels = { capacityLevel, waterLevel, foodLevel, medicalLevel };
      for (const [name, value] of Object.entries(levels)) {
        if (!Number.isInteger(value) || value < 1 || value > 5) {
          res.status(400).json({ error: `${name} must be an integer between 1 and 5` });
          return;
        }
      }

      // Validate shelter exists
      const shelter = await prisma.shelter.findUnique({ where: { id: shelterId } });
      if (!shelter) {
        res.status(404).json({ error: 'Shelter not found' });
        return;
      }

      // Validate user exists (JWT may reference a deleted/stale user)
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (!user) {
        res.status(401).json({ error: 'User account not found — please log in again' });
        return;
      }

      // Find active disaster event to link this update
      const activeEvent = await prisma.disasterEvent.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      // Create update
      let update;
      try {
        update = await prisma.shelterUpdate.create({
          data: {
            shelterId,
            capacityLevel,
            waterLevel,
            foodLevel,
            medicalLevel,
            notes: notes ?? null,
            reportedById: user.id,
            disasterEventId: activeEvent?.id ?? null,
          },
        });
      } catch (err) {
        console.error('Failed to create shelter update:', err);
        res.status(500).json({ error: 'Failed to save update' });
        return;
      }

      // Emit to admin room
      emitShelterUpdate(io, {
        shelterId,
        update,
        shelter,
        disasterEventId: activeEvent?.id ?? null,
      });

      res.status(201).json({ update });
    })
  );

  // GET /api/updates/:shelterId — update history
  router.get(
    '/:shelterId',
    authenticate,
    asyncHandler(async (req: Request<{ shelterId: string }>, res: Response): Promise<void> => {
      const { shelterId } = req.params;

      const shelter = await prisma.shelter.findUnique({ where: { id: shelterId } });
      if (!shelter) {
        res.status(404).json({ error: 'Shelter not found' });
        return;
      }

      const updates = await prisma.shelterUpdate.findMany({
        where: { shelterId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json({ updates });
    })
  );

  return router;
};
