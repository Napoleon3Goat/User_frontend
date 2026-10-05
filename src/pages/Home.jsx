import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActivities } from '../lib/api'
import { isCamping } from '../lib/pricing'
import { peso } from '../lib/dates'
import { friendlyError } from '../lib/errors'
import { Loading, ErrorState, Empty } from '../components/StateView'

// Landing / browse page. Everything shown comes from the activities table, nothing is hardcoded.
export default function Home() {
  const [activities, setActivities] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setError('')
    setActivities(null)
    getActivities()
      .then(setActivities)
      .catch((e) => setError(friendlyError(e)))
  }
  useEffect(load, [])

  // Group camping areas by area_group (Lower Area, Upper Area, ...), keeping database order.
  const camping = (activities || []).filter(isCamping)
  const groups = {}
  for (const a of camping) {
    const key = a.area_group || 'Camping areas'
    ;(groups[key] ||= []).push(a)
  }
  const others = (activities || []).filter((a) => !isCamping(a))

  return (
    <>
      <section className="hero">
        <h1>Camp under the pines. Climb the cliffs.</h1>
        <p>Book a camping area or the Rock Activities Package online and get your reference number right away.</p>
        <div className="hero-actions">
          <a href="#camping" className="btn-primary">Camping areas</a>
          <a href="#rock" className="btn-light">Rock activities</a>
        </div>
      </section>

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !activities && <Loading text="Loading activities…" />}
      {activities && activities.length === 0 && <Empty text="No activities are open for booking right now." />}

      {others.length > 0 && (
        <section id="rock" className="section">
          <h2>Rock activities</h2>
          <div className="cards">
            {others.map((a) => (
              <Link to={`/activity/${a.code}`} key={a.id} className="card activity-card feature">
                <h3>{a.name}</h3>
                <p className="price">{peso(a.price)} <span>/ person</span></p>
                {a.viewing_price != null && <p className="muted">Viewing only: {peso(a.viewing_price)} / person</p>}
                {a.min_age && <p className="muted">Ages {a.min_age} and up</p>}
                <span className="link">View details →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {camping.length > 0 && (
        <section id="camping" className="section">
          <h2>Camping areas</h2>
          <p className="muted">Price is per area per night, plus {peso(camping[0].per_person_price)} per person per night.</p>
          {Object.entries(groups).map(([group, areas]) => (
            <div key={group} className="area-group">
              <h3>{group}</h3>
              <div className="cards small-cards">
                {areas.map((a) => (
                  <Link to={`/activity/${a.code}`} key={a.id} className="card activity-card">
                    <strong className="code">{a.code}</strong>
                    <p className="price">{peso(a.price)} <span>/ night</span></p>
                    {a.description && <p className="muted clamp">{a.description}</p>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
