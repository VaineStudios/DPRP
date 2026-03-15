import type { Shelter } from '../App'

interface ShelterCardProps {
  shelter: Shelter
  rank: number
}

function getCapacityInfo(level: number): { label: string; className: string } {
  if (level <= 2) return { label: 'Space available', className: 'capacity-green' }
  if (level === 3) return { label: 'Filling up', className: 'capacity-amber' }
  if (level <= 5) return { label: 'Nearly full', className: 'capacity-red' }
  return { label: 'Status unknown', className: 'capacity-gray' }
}

function resourceLabel(level: number): string {
  if (level <= 1) return 'Low'
  if (level <= 3) return 'OK'
  return 'Good'
}

export function ShelterCard({ shelter, rank }: ShelterCardProps) {
  const capacity = getCapacityInfo(shelter.capacityLevel)
  const directionsUrl =
    shelter.lat != null && shelter.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}`
      : null

  return (
    <div className="shelter-card">
      <div className="shelter-card-rank">#{rank}</div>
      <div className="shelter-card-name">{shelter.name}</div>
      <div className="shelter-card-parish">
        {shelter.parish}
        {shelter.facilityType && ` \u00B7 ${shelter.facilityType}`}
      </div>
      <div className="shelter-card-distance">
        {shelter.distanceKm.toFixed(1)} km away
      </div>
      <div className="shelter-card-capacity">
        <span className={`capacity-dot ${capacity.className}`} />
        {capacity.label}
      </div>
      <div className="shelter-card-resources">
        <span>Water: {resourceLabel(shelter.waterLevel)}</span>
        <span>Food: {resourceLabel(shelter.foodLevel)}</span>
        <span>Medical: {resourceLabel(shelter.medicalLevel)}</span>
      </div>
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shelter-card-directions"
        >
          Get directions
        </a>
      )}
    </div>
  )
}
