import { useEffect } from 'react';
import { connect, disconnect, getSocket } from '../api/socket';
import type { ShelterUpdate } from '../api/client';

export const useSocket = (
  token: string | null,
  onShelterUpdate: (shelterId: string, update: ShelterUpdate) => void
) => {
  useEffect(() => {
    if (!token) return;

    connect(token);

    return () => {
      disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = (data: { shelterId: string; update: ShelterUpdate }) => {
      onShelterUpdate(data.shelterId, data.update);
    };

    socket.on('shelter:updated', handleUpdate);
    return () => { socket.off('shelter:updated', handleUpdate); };
  }, [token, onShelterUpdate]);
};
