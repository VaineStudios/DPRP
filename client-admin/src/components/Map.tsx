import { MapContainer, TileLayer } from 'react-leaflet';
import type { Shelter } from '../api/client';
import ShelterPin from './ShelterPin';

interface MapProps {
  shelters: Shelter[];
}

// Jamaica center coordinates
const JAMAICA_CENTER: [number, number] = [18.15, -77.3];
const JAMAICA_ZOOM = 9;

const Map = ({ shelters }: MapProps) => {
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
      {shelters.map(shelter => (
        <ShelterPin key={shelter.id} shelter={shelter} />
      ))}
    </MapContainer>
  );
};

export default Map;
