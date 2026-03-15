import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import type { Server } from 'socket.io';

export const createBroadcastRouter = (io: Server) => {
  const router = Router();

  router.use(authenticate, authorize('ADMIN'));

  // POST /api/broadcasts — create and emit a broadcast
  router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message, targetParishes, priority, disasterEventId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    if (message.length > 500) {
      res.status(400).json({ error: 'message must be 500 characters or fewer' });
      return;
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const broadcastPriority = validPriorities.includes(priority) ? priority : 'HIGH';
    const parishes: string[] = Array.isArray(targetParishes) ? targetParishes : [];

    // Verify the user still exists before creating the broadcast
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true },
    });
    if (!user) {
      res.status(401).json({ error: 'User not found — please sign out and sign back in' });
      return;
    }

    try {
      const broadcast = await prisma.broadcast.create({
        data: {
          message: message.trim(),
          targetParishes: parishes,
          priority: broadcastPriority,
          disasterEventId: disasterEventId ?? null,
          sentById: user.id,
        },
        include: {
          sentBy: { select: { name: true } },
        },
      });

      const payload = {
        id: broadcast.id,
        message: broadcast.message,
        priority: broadcast.priority,
        targetParishes: broadcast.targetParishes,
        sentBy: broadcast.sentBy.name,
        createdAt: broadcast.createdAt.toISOString(),
      };

      if (parishes.length === 0) {
        io.to('shelters').emit('broadcast:message', payload);
      } else {
        for (const parish of parishes) {
          io.to(`parish:${parish}`).emit('broadcast:message', payload);
        }
      }

      // Notify admins too
      io.to('admin').emit('broadcast:sent', payload);

      res.status(201).json({ broadcast: payload });
    } catch (err) {
      console.error('Broadcast create error:', err);
      res.status(500).json({ error: 'Failed to create broadcast' });
    }
  }));

  // GET /api/broadcasts — list recent broadcasts
  router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const broadcasts = await prisma.broadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sentBy: { select: { name: true } },
      },
    });

    res.json({
      broadcasts: broadcasts.map(b => ({
        id: b.id,
        message: b.message,
        priority: b.priority,
        targetParishes: b.targetParishes,
        sentBy: b.sentBy.name,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  }));

  return router;
};
