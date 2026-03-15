import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';
import prisma from '../lib/prisma.js';

export const initializeSocket = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join:admin', ({ token }: { token: string }) => {
      try {
        verifyToken(token);
        socket.join('admin');
        console.log(`Admin joined (socket ${socket.id})`);
      } catch {
        console.log(`Invalid token on join:admin (socket ${socket.id})`);
        socket.disconnect();
      }
    });

    socket.on('join:shelter', async ({ token, shelterId }: { token: string; shelterId: string }) => {
      try {
        verifyToken(token);
        socket.join(`shelter:${shelterId}`);
        socket.join('shelters');

        // Look up parish for parish-targeted broadcasts
        const shelter = await prisma.shelter.findUnique({
          where: { id: shelterId },
          select: { parish: true },
        });
        if (shelter) {
          socket.join(`parish:${shelter.parish}`);
        }

        console.log(`Shelter manager joined for shelter ${shelterId} (socket ${socket.id})`);
      } catch {
        console.log(`Invalid token on join:shelter (socket ${socket.id})`);
        socket.disconnect();
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const emitShelterUpdate = (
  io: Server,
  data: {
    shelterId: string;
    update: object;
    shelter: object;
    disasterEventId: string | null;
  }
): void => {
  io.to('admin').emit('shelter:updated', data);
};
