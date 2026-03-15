export interface ParishCentroid {
  lat: number;
  lng: number;
}

export const PARISH_CENTROIDS: Record<string, ParishCentroid> = {
  'St. Thomas': { lat: 17.9714, lng: -76.2874 },
  'Portland': { lat: 18.1489, lng: -76.3980 },
  'St. Mary': { lat: 18.2469, lng: -76.7776 },
  'St. Ann': { lat: 18.3474, lng: -77.2036 },
  'Trelawny': { lat: 18.3500, lng: -77.6000 },
  'St. James': { lat: 18.4762, lng: -77.9190 },
  'Hanover': { lat: 18.4000, lng: -78.1300 },
  'Westmoreland': { lat: 18.2500, lng: -78.1500 },
  'St. Elizabeth': { lat: 18.0000, lng: -77.7500 },
  'Manchester': { lat: 18.0500, lng: -77.5000 },
  'Clarendon': { lat: 17.9500, lng: -77.2400 },
  'St. Catherine': { lat: 18.0300, lng: -76.9500 },
  'Kingston & St. Andrew': { lat: 18.0179, lng: -76.8099 },
  'Portmore': { lat: 17.9576, lng: -76.8777 },
};
