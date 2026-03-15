const PARISH_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Clarendon': { lat: 17.95, lng: -77.24 },
  'Hanover': { lat: 18.40, lng: -78.13 },
  'Kingston & St. Andrew': { lat: 18.0179, lng: -76.8099 },
  'Manchester': { lat: 18.05, lng: -77.50 },
  'Portland': { lat: 18.1489, lng: -76.398 },
  'Portmore': { lat: 17.9576, lng: -76.8777 },
  'St. Ann': { lat: 18.3474, lng: -77.2036 },
  'St. Catherine': { lat: 18.03, lng: -76.95 },
  'St. Elizabeth': { lat: 18.00, lng: -77.75 },
  'St. James': { lat: 18.4762, lng: -77.919 },
  'St. Mary': { lat: 18.2469, lng: -76.7776 },
  'St. Thomas': { lat: 17.9714, lng: -76.2874 },
  'Trelawny': { lat: 18.35, lng: -77.60 },
  'Westmoreland': { lat: 18.25, lng: -78.15 },
}

const PARISHES = Object.keys(PARISH_CENTROIDS).sort()

interface ParishFallbackProps {
  onSelect: (lat: number, lng: number) => void
}

export function ParishFallback({ onSelect }: ParishFallbackProps) {
  return (
    <div className="parish-fallback">
      <label htmlFor="parish-select">Or select your parish:</label>
      <select
        id="parish-select"
        className="parish-select"
        defaultValue=""
        onChange={(e) => {
          const parish = e.target.value
          if (parish && PARISH_CENTROIDS[parish]) {
            const { lat, lng } = PARISH_CENTROIDS[parish]
            onSelect(lat, lng)
          }
        }}
      >
        <option value="" disabled>
          Select your parish
        </option>
        {PARISHES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  )
}
