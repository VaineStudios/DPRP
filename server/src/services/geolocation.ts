export const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface ShelterWithUpdate {
  id: string;
  name: string;
  parish: string;
  location: string | null;
  facilityType: string | null;
  lat: number | null;
  lng: number | null;
  updates: {
    capacityLevel: number;
    waterLevel: number;
    foodLevel: number;
    medicalLevel: number;
  }[];
}

interface RankedShelter {
  id: string;
  name: string;
  parish: string;
  location: string | null;
  facilityType: string | null;
  lat: number | null;
  lng: number | null;
  distanceKm: number;
  capacityLevel: number;
  waterLevel: number;
  foodLevel: number;
  medicalLevel: number;
}

export const rankShelters = (
  shelters: ShelterWithUpdate[],
  lat: number,
  lng: number,
  limit = 5
): RankedShelter[] => {
  const scored = shelters
    .filter((s) => s.lat !== null && s.lng !== null)
    .map((s) => {
      const distanceKm = haversineDistance(lat, lng, s.lat!, s.lng!);
      const latestUpdate = s.updates[0];
      const capacityLevel = latestUpdate?.capacityLevel ?? 3;
      const waterLevel = latestUpdate?.waterLevel ?? 3;
      const foodLevel = latestUpdate?.foodLevel ?? 3;
      const medicalLevel = latestUpdate?.medicalLevel ?? 3;
      const score = distanceKm * 0.7 + capacityLevel * 2 * 0.3;

      return {
        id: s.id,
        name: s.name,
        parish: s.parish,
        location: s.location,
        facilityType: s.facilityType,
        lat: s.lat,
        lng: s.lng,
        distanceKm: Math.round(distanceKm * 10) / 10,
        capacityLevel,
        waterLevel,
        foodLevel,
        medicalLevel,
        score,
      };
    })
    .sort((a, b) => a.score - b.score);

  return scored.slice(0, limit).map(({ score: _, ...rest }) => rest);
};
