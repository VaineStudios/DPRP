export type AlertType =
  | 'capacity-critical'
  | 'capacity-high'
  | 'water-low'
  | 'food-low'
  | 'medical-low'
  | 'offline';

export interface CriticalAlert {
  id: string;            // dedup key: `${shelterId}:${alertType}`
  shelterId: string;
  shelterName: string;
  parish: string;
  type: AlertType;
  message: string;
  color: string;
  lat: number;
  lng: number;
  timestamp: number;
}
