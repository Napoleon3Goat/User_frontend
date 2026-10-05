// The three states every data screen needs: loading, error (with retry) and empty.
export function Loading({ text = 'Loading…' }) {
  return <div className="state">{text}</div>
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state" role="alert">
      <p className="error">{message}</p>
      {onRetry && <button className="btn-secondary" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function Empty({ text }) {
  return <div className="state muted">{text}</div>
}
