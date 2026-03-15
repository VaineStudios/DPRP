import { useRef, useState, useEffect } from 'react';
import { CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Shelter } from '../api/client';
import { getPinColor, isOffline } from '../utils/shelter';
import ShelterCard from './ShelterCard';

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
  const populated = !!shelter.latestUpdate && !isOffline(shelter);

  return (
    <>
      {/* Ambient pulse ring for populated (non-offline) shelters */}
      {populated && !pulsing && (
        <PulseRing lat={shelter.lat} lng={shelter.lng} color={color} />
      )}
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
    </>
  );
};

/** Continuously pulsing ring behind populated shelter pins via requestAnimationFrame. */
const PulseRing = ({ lat, lng, color }: { lat: number; lng: number; color: string }) => {
  const map = useMap();

  useEffect(() => {
    const center: L.LatLngExpression = [lat, lng];
    const circle = L.circleMarker(center, {
      radius: 6,
      color,
      fillColor: color,
      fillOpacity: 0,
      weight: 1.5,
      opacity: 0.6,
      interactive: false,
    }).addTo(map);

    const duration = 2000;
    let frameId: number;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) % duration;
      const progress = elapsed / duration;
      const eased = 1 - Math.pow(1 - progress, 2);

      circle.setRadius(6 + 8 * eased);
      circle.setStyle({
        opacity: 0.6 * (1 - eased),
        weight: 1.5 * (1 - eased * 0.5),
      });

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      if (map.hasLayer(circle)) map.removeLayer(circle);
    };
  }, [map, lat, lng, color]);

  return null;
};

export default ShelterPin;
