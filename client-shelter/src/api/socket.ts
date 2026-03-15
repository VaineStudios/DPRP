import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || '';

let socket: Socket | null = null;

export const connect = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(API_URL, {
    auth: { token },
    autoConnect: false,
    transports: ['websocket', 'polling'],
  });

  socket.connect();

  return socket;
};

export const joinShelter = (shelterId: string): void => {
  const token = localStorage.getItem('dprp_token');
  if (socket && token) {
    socket.emit('join:shelter', { token, shelterId });
  }
};

export const disconnect = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;
