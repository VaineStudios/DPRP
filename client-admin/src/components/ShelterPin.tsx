import { useRef, useState, useEffect } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import type { Shelter } from '../api/client';
import { getPinColor } from '../utils/shelter';
import ShelterCard from './ShelterCard';
import type L from 'leaflet';

interface ShelterPinProps {
  shelter: Shelter;
  openPopupId: string | null;
}

const ShelterPin = ({ shelter, openPopupId }: ShelterPinProps) => {
  const markerRef = useRef<L.CircleMarker>(null);
  const [pulsing, setPulsing] = useState(false);
  const prevCreatedAt = useRef(shelter.latestUpdate?.createdAt);

  // Detect new updates and trigger pulse
  useEffect(() => {
    const curr = shelter.latestUpdate?.createdAt;
    if (curr && curr !== prevCreatedAt.current) {
      prevCreatedAt.current = curr;
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [shelter.latestUpdate?.createdAt]);

  // Open popup when requested (from toast click)
  useEffect(() => {
    if (openPopupId === shelter.id && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [openPopupId, shelter.id]);

  const color = getPinColor(shelter);

  return (
    <CircleMarker
      ref={markerRef}
      center={[shelter.lat, shelter.lng]}
      radius={pulsing ? 12 : 6}
      pathOptions={{
        fillColor: color,
        fillOpacity: pulsing ? 1 : 0.9,
        color: pulsing ? color : '#fff',
        weight: pulsing ? 3 : 1,
        opacity: 1,
      }}
    >
      <Popup>
        <ShelterCard shelter={shelter} />
      </Popup>
    </CircleMarker>
  );
};

export default ShelterPin;
