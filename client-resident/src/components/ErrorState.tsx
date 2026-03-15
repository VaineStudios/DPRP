import { ParishFallback } from './ParishFallback'

interface ErrorStateProps {
  errorType: 'gps_denied' | 'gps_timeout' | 'api_error' | 'no_shelters'
  onSelectParish: (lat: number, lng: number) => void
}

const ERROR_CONFIG: Record<
  ErrorStateProps['errorType'],
  { title: string; message: string }
> = {
  gps_denied: {
    title: 'Location access needed',
    message: 'Allow location access to find nearby shelters, or select your parish below.',
  },
  gps_timeout: {
    title: "Couldn't determine your location",
    message: 'GPS took too long to respond. Select your parish below instead.',
  },
  api_error: {
    title: 'Unable to reach shelter data',
    message: 'The server may be down. Try again shortly or select your parish below.',
  },
  no_shelters: {
    title: 'No shelters found nearby',
    message: 'No shelters are currently reporting near you. Try selecting a different parish.',
  },
}

export function ErrorState({ errorType, onSelectParish }: ErrorStateProps) {
  const config = ERROR_CONFIG[errorType]

  return (
    <div className="error-container">
      <div className="error-title">{config.title}</div>
      <div className="error-message">{config.message}</div>
      <ParishFallback onSelect={onSelectParish} />
    </div>
  )
}
