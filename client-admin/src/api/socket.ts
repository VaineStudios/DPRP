import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || '';

let socket: Socket | null = null;

export const connect = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(API_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
  });

  socket.connect();

  socket.on('connect', () => {
    socket?.emit('join:admin', { token });
  });

  return socket;
};

export const disconnect = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
