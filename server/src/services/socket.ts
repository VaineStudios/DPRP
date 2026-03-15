import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';

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

    socket.on('join:shelter', ({ token, shelterId }: { token: string; shelterId: string }) => {
      try {
        verifyToken(token);
        socket.join(`shelter:${shelterId}`);
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
  data: { shelterId: string; update: object; shelter: object }
): void => {
  io.to('admin').emit('shelter:updated', data);
};
