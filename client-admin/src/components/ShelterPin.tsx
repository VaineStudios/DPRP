import { CircleMarker, Popup } from 'react-leaflet';
import type { Shelter } from '../api/client';
import { getPinColor } from '../utils/shelter';
import ShelterCard from './ShelterCard';

interface ShelterPinProps {
  shelter: Shelter;
}

const ShelterPin = ({ shelter }: ShelterPinProps) => {
  const color = getPinColor(shelter);

  return (
    <CircleMarker
      center={[shelter.lat, shelter.lng]}
      radius={6}
      pathOptions={{
        fillColor: color,
        fillOpacity: 0.9,
        color: '#fff',
        weight: 1,
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
