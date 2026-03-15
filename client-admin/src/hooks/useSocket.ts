import { useEffect } from 'react';
import { connect, disconnect, getSocket } from '../api/socket';
import type { ShelterUpdateEvent } from '../api/client';

export const useSocket = (
  token: string | null,
  onShelterUpdate: (event: ShelterUpdateEvent) => void
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

    const handleUpdate = (data: ShelterUpdateEvent) => {
      onShelterUpdate(data);
    };

    socket.on('shelter:updated', handleUpdate);
    return () => { socket.off('shelter:updated', handleUpdate); };
  }, [token, onShelterUpdate]);
};
