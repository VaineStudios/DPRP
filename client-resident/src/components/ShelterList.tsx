import type { Shelter } from '../App'
import { ShelterCard } from './ShelterCard'

interface ShelterListProps {
  shelters: Shelter[]
}

export function ShelterList({ shelters }: ShelterListProps) {
  return (
    <div>
      <div className="shelter-list-header">
        <h2>Nearest shelters</h2>
        <p>Based on your location &middot; {shelters.length} found</p>
      </div>
      {shelters.map((shelter, i) => (
        <ShelterCard key={shelter.id} shelter={shelter} rank={i + 1} />
      ))}
    </div>
  )
}
