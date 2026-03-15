import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Shelter } from '../api/client';
import ShelterPin from './ShelterPin';

export interface FlyTarget {
  lat: number;
  lng: number;
}

interface MapProps {
  shelters: Shelter[];
  flyTarget?: FlyTarget | null;
  openPopupId?: string | null;
}

// Jamaica center coordinates
const JAMAICA_CENTER: [number, number] = [18.15, -77.3];
const JAMAICA_ZOOM = 9;

const MapController = ({ flyTarget }: { flyTarget: FlyTarget | null }) => {
  const map = useMap();

  useEffect(() => {
    if (flyTarget) {
      map.flyTo([flyTarget.lat, flyTarget.lng], 14, { duration: 1 });
    }
  }, [flyTarget, map]);

  return null;
};

const Map = ({ shelters, flyTarget = null, openPopupId = null }: MapProps) => {
  return (
    <MapContainer
      center={JAMAICA_CENTER}
      zoom={JAMAICA_ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController flyTarget={flyTarget} />
      {shelters.map(shelter => (
        <ShelterPin key={shelter.id} shelter={shelter} openPopupId={openPopupId} />
      ))}
    </MapContainer>
  );
};

export default Map;
