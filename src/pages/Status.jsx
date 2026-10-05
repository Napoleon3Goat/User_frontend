import { useState } from 'react'
import { lookupBooking } from '../lib/api'
import { formatDate, peso } from '../lib/dates'
import { friendlyError } from '../lib/errors'

// Plain-language names for the backend's status values.
const PAYMENT = {
  pending: ['Waiting for payment', 'badge-wait'],
  for_verification: ['Payment being checked', 'badge-wait'],
  down_payment: ['Confirmed (down payment received)', 'badge-ok'],
  paid: ['Fully paid', 'badge-ok'],
  expired: ['Expired (not paid in time)', 'badge-bad'],
  refunded: ['Refunded', 'badge-bad'],
}
const ATTENDANCE = {
  upcoming: ['Upcoming', 'badge-ok'],
  done: ['Completed', 'badge-ok'],
  failed_to_show: ['Did not show up', 'badge-bad'],
  cancelled: ['Cancelled', 'badge-bad'],
}

function Badge({ map, value }) {
  const [text, cls] = map[value] || [value, '']
  return <span className={'badge ' + cls}>{text}</span>
}

export default function Status() {
  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(undefined) // undefined = not searched, null = not found
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function search(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      setResult(await lookupBooking(reference, email))
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="narrow">
      <h1>Check my booking</h1>
      <p className="muted">Enter the reference number from your confirmation and the email you booked with.</p>

      <form className="card form" onSubmit={search}>
        <label>
          Reference number
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="GC-XXXXXXXX" required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn-primary block" disabled={loading}>{loading ? 'Searching…' : 'Find my booking'}</button>
      </form>

      {result === null && (
        <div className="card">
          <p className="error">No booking matches that reference number and email. Check both and try again.</p>
        </div>
      )}

      {result && (
        <div className="card">
          <p className="reference">{result.reference_number}</p>
          <dl className="facts">
            <dt>Payment</dt><dd><Badge map={PAYMENT} value={result.payment_status} /></dd>
            <dt>Booking</dt><dd><Badge map={ATTENDANCE} value={result.attendance_status} /></dd>
            <dt>Activity</dt><dd>{result.activity_code}</dd>
            <dt>Date</dt><dd>{formatDate(result.visit_date)}{result.nights ? ` · ${result.nights} night${result.nights > 1 ? 's' : ''}` : ''}</dd>
            <dt>Group</dt><dd>{result.group_size}</dd>
            <dt>Total</dt><dd>{peso(result.total_amount)}</dd>
          </dl>
        </div>
      )}
    </div>
  )
}
