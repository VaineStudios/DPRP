import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { Shelter } from '../api/client';
import { getPinColor } from '../utils/shelter';
import ShelterCard from './ShelterCard';

interface MapProps {
  shelters: Shelter[];
}

// Jamaica center coordinates
const JAMAICA_CENTER: [number, number] = [18.11, -77.30];
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {shelters.map(shelter => (
        <ShelterPin key={shelter.id} shelter={shelter} />
      ))}
    </MapContainer>
  );
};

const ShelterPin = ({ shelter }: { shelter: Shelter }) => {
  const color = getPinColor(shelter);

  return (
    <CircleMarker
      center={[shelter.lat, shelter.lng]}
      radius={7}
      pathOptions={{
        fillColor: color,
        fillOpacity: 0.9,
        color: '#fff',
        weight: 2,
        opacity: 1,
      }}
    >
      <Popup>
        <ShelterCard shelter={shelter} />
      </Popup>
    </CircleMarker>
  );
};

export default Map;
