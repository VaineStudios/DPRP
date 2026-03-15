interface LoadingStateProps {
  status: 'locating' | 'loading'
}

export function LoadingState({ status }: LoadingStateProps) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p className="loading-text">
        {status === 'locating'
          ? 'Finding your location...'
          : 'Finding nearby shelters...'}
      </p>
    </div>
  )
}
