import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActivities } from '../lib/api'
import { addDays, formatDate, peso } from '../lib/dates'
import { isCamping } from '../lib/pricing'

export default function Confirmation({ booking, activity, form }) {
  const camping = isCamping(activity)
  const [rock, setRock] = useState(null)

  // After a camping booking, offer the rock package (a separate booking).
  useEffect(() => {
    if (!camping) return
    getActivities()
      .then((list) => setRock(list.find((a) => !isCamping(a)) || null))
      .catch(() => setRock(null)) // the offer is optional; hide it if loading fails
  }, [camping])

  // Any day of the stay, check-out day included, can be picked for the rock activity.
  const checkout = camping ? addDays(booking.visit_date, booking.nights) : null

  return (
    <div className="card center">
      <div className="check-mark">✓</div>
      <h1>Booking received</h1>
      <p className="muted">Save your reference number. You'll need it to check your booking.</p>
      <p className="reference">{booking.reference_number}</p>

      <dl className="facts left">
        <dt>Activity</dt><dd>{camping ? `Camping area ${activity.code}` : activity.name}</dd>
        <dt>{camping ? 'Check-in' : 'Date'}</dt><dd>{formatDate(booking.visit_date)}</dd>
        {camping && <><dt>Check-out</dt><dd>{formatDate(checkout)} ({booking.nights} night{booking.nights > 1 ? 's' : ''})</dd></>}
        <dt>Group</dt><dd>{booking.group_size} {booking.group_size > 1 ? 'people' : 'person'}{booking.viewing_count ? `, ${booking.viewing_count} viewing only` : ''}</dd>
        <dt>Total</dt><dd>{peso(booking.total_amount)}</dd>
        <dt>Down payment sent</dt><dd>{peso(booking.amount_due)}</dd>
        <dt>Status</dt><dd><span className="badge badge-wait">Payment for verification</span></dd>
      </dl>

      <p className="note">
        An admin will check your GCash payment and confirm your booking by email at <strong>{booking.email}</strong>.
        The remaining 50% is paid on arrival.
      </p>

      {camping && rock && (
        <div className="offer">
          <h3>Add a rock activity?</h3>
          <p className="muted">Climb or rappel during your stay. It's booked separately with its own reference number.</p>
          <Link
            to={`/book/${rock.code}`}
            className="btn-primary"
            state={{ prefill: form, minDate: booking.visit_date, maxDate: checkout }}
          >
            Add the Rock Activities Package
          </Link>
        </div>
      )}

      <Link to="/status" className="btn-secondary">Check my booking</Link>
    </div>
  )
}
