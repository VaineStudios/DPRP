import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Shelter } from '../api/client';
import { getPinColor } from '../utils/shelter';
import ShelterPin from './ShelterPin';

export interface FlyTarget {
  lat: number;
  lng: number;
  zoom?: number;
}

interface MapProps {
  shelters: Shelter[];
  flyTarget?: FlyTarget | null;
  openPopupId?: string | null;
  newlyActivatedIds?: Set<string>;
  onActivationAnimationDone?: (shelterId: string) => void;
}

// Jamaica center coordinates
const JAMAICA_CENTER: [number, number] = [18.15, -77.3];
const JAMAICA_ZOOM = 10;
const JAMAICA_BOUNDS: L.LatLngBoundsExpression = [
  [17.4, -78.6],  // SW corner
  [18.7, -75.8],  // NE corner
];

const MapController = ({ flyTarget }: { flyTarget: FlyTarget | null }) => {
  const map = useMap();

  useEffect(() => {
    if (flyTarget) {
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom ?? 14, {
        duration: 1.2,
        easeLinearity: 0.5,
      });
    }
  }, [flyTarget, map]);

  return null;
};

const ActivationPing = ({
  shelter,
  onDone,
}: {
  shelter: Shelter;
  onDone: (id: string) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    const center: L.LatLngExpression = [shelter.lat, shelter.lng];
    const color = getPinColor(shelter);
    const circle = L.circle(center, {
      radius: 10,
      color,
      fillColor: color,
      fillOpacity: 0.3,
      weight: 2,
      interactive: false,
    }).addTo(map);

    const startTime = performance.now();
    const duration = 1500;
    const startRadius = 10;
    const endRadius = 500;
    let frameId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      circle.setRadius(startRadius + (endRadius - startRadius) * eased);
      circle.setStyle({
        fillOpacity: 0.3 * (1 - progress),
        opacity: 1 - progress,
      });

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        map.removeLayer(circle);
        onDone(shelter.id);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      if (map.hasLayer(circle)) {
        map.removeLayer(circle);
      }
    };
  }, [map, shelter.id, shelter.lat, shelter.lng, shelter, onDone]);

  return null;
};

const Map = ({
  shelters,
  flyTarget = null,
  openPopupId = null,
  newlyActivatedIds,
  onActivationAnimationDone,
}: MapProps) => {
  const handlePingDone = useCallback((id: string) => {
    onActivationAnimationDone?.(id);
  }, [onActivationAnimationDone]);

  return (
    <MapContainer
      center={JAMAICA_CENTER}
      zoom={JAMAICA_ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
      scrollWheelZoom={false}
      maxBounds={JAMAICA_BOUNDS}
      maxBoundsViscosity={0.8}
      minZoom={8}
      maxZoom={16}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController flyTarget={flyTarget} />
      {shelters.map(shelter => (
        <ShelterPin key={shelter.id} shelter={shelter} openPopupId={openPopupId} />
      ))}
      {newlyActivatedIds && onActivationAnimationDone && shelters
        .filter(s => newlyActivatedIds.has(s.id))
        .map(s => (
          <ActivationPing
            key={`ping-${s.id}`}
            shelter={s}
            onDone={handlePingDone}
          />
        ))
      }
    </MapContainer>
  );
};

export default Map;
