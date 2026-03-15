import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
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
    async (req: Request, res: Response): Promise<void> => {
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

      // Create update
      const update = await prisma.shelterUpdate.create({
        data: {
          shelterId,
          capacityLevel,
          waterLevel,
          foodLevel,
          medicalLevel,
          notes: notes ?? null,
          reportedById: req.user!.userId,
        },
      });

      // Emit to admin room
      emitShelterUpdate(io, { shelterId, update, shelter });

      res.status(201).json({ update });
    }
  );

  // GET /api/updates/:shelterId — update history
  router.get(
    '/:shelterId',
    authenticate,
    async (req: Request<{ shelterId: string }>, res: Response): Promise<void> => {
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
    }
  );

  return router;
};
