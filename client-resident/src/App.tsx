import { useState, useEffect, useCallback } from 'react'
import { LoadingState } from './components/LoadingState'
import { ShelterList } from './components/ShelterList'
import { ErrorState } from './components/ErrorState'

export interface Shelter {
  id: string
  name: string
  parish: string
  location: string | null
  facilityType: string | null
  lat: number | null
  lng: number | null
  distanceKm: number
  capacityLevel: number
  waterLevel: number
  foodLevel: number
  medicalLevel: number
}

type AppState =
  | { status: 'locating' }
  | { status: 'loading'; coords: { lat: number; lng: number } }
  | { status: 'results'; coords: { lat: number; lng: number }; shelters: Shelter[]; cachedAt?: string }
  | { status: 'error'; errorType: 'gps_denied' | 'gps_timeout' | 'api_error' | 'no_shelters'; fallbackShelters?: Shelter[] }

const CACHE_KEY = 'dprp_shelter_cache'

function getCachedResults(): { shelters: Shelter[]; cachedAt: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function cacheResults(shelters: Shelter[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      shelters,
      cachedAt: new Date().toISOString(),
    }))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export default function App() {
  const [state, setState] = useState<AppState>({ status: 'locating' })
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  const fetchShelters = useCallback(async (lat: number, lng: number) => {
    setState({ status: 'loading', coords: { lat, lng } })
    try {
      const res = await fetch(`/api/recommend?lat=${lat}&lng=${lng}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const shelters: Shelter[] = data.shelters ?? []
      if (shelters.length === 0) {
        setState({ status: 'error', errorType: 'no_shelters' })
        return
      }
      cacheResults(shelters)
      setState({ status: 'results', coords: { lat, lng }, shelters })
    } catch {
      const cached = getCachedResults()
      if (cached) {
        setState({
          status: 'results',
          coords: { lat, lng },
          shelters: cached.shelters,
          cachedAt: cached.cachedAt,
        })
      } else {
        setState({ status: 'error', errorType: 'api_error' })
      }
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', errorType: 'gps_denied' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchShelters(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ status: 'error', errorType: 'gps_denied' })
        } else {
          setState({ status: 'error', errorType: 'gps_timeout' })
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }, [fetchShelters])

  const showOfflineBanner = isOffline && state.status === 'results'

  return (
    <>
      {showOfflineBanner && (
        <div className="offline-banner">
          Showing last known shelter data — you may be offline
        </div>
      )}
      <div className="app-container">
        <header className="app-header">
          <h1>DPRP</h1>
          <p>Find Shelter</p>
        </header>

        {(state.status === 'locating' || state.status === 'loading') && (
          <LoadingState status={state.status} />
        )}

        {state.status === 'results' && (
          <>
            {state.cachedAt && (
              <div className="cached-banner">
                Showing cached results from{' '}
                {formatCachedTime(state.cachedAt)}
              </div>
            )}
            <ShelterList shelters={state.shelters} />
          </>
        )}

        {state.status === 'error' && (
          <ErrorState
            errorType={state.errorType}
            onSelectParish={fetchShelters}
          />
        )}

        <footer className="app-footer">
          DPRP — Disaster Preparedness & Response Platform
        </footer>
      </div>
    </>
  )
}

function formatCachedTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins === 1) return '1 minute ago'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.round(mins / 60)
  if (hours === 1) return '1 hour ago'
  return `${hours} hours ago`
}
