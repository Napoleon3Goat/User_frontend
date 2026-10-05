import { useEffect, useState } from 'react'
import { submitPaymentReference } from '../lib/api'
import { peso } from '../lib/dates'
import { friendlyError } from '../lib/errors'

// TODO: replace with Goatcliff's real GCash account details.
const GCASH_NAME = 'GOATCLIFF ADVENTURE'
const GCASH_NUMBER = '09XX XXX XXXX'

// Shows the GCash instructions and a 15-minute countdown.
// Within 15 minutes the guest enters their GCash reference number;
// the booking then becomes "For verification" and no longer expires.
export default function PaymentStep({ booking, onPaid, onStartOver }) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(booking.hold_expires_at))
  const [gcashRef, setGcashRef] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(secondsUntil(booking.hold_expires_at)), 1000)
    return () => clearInterval(timer)
  }, [booking.hold_expires_at])

  async function submit(e) {
    e.preventDefault()
    const clean = gcashRef.replace(/\s/g, '')
    if (!/^\d{13}$/.test(clean)) {
      setError('A GCash reference number has 13 digits. You can find it on your GCash receipt.')
      return
    }
    setError('')
    setSending(true)
    try {
      onPaid(await submitPaymentReference(booking.reference_number, clean))
    } catch (err) {
      setError(err.message === 'HOLD_EXPIRED' ? 'Your 15-minute hold expired before we got your reference number.' : friendlyError(err))
      setSending(false)
    }
  }

  if (secondsLeft <= 0) {
    return (
      <div className="card center">
        <h2>Your hold has expired</h2>
        <p className="muted">The spot was released after 15 minutes without a payment reference. If you already paid, message us on Facebook with your GCash receipt and reference {booking.reference_number}.</p>
        <button className="btn-primary" onClick={onStartOver}>Start over</button>
      </div>
    )
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return (
    <form className="card" onSubmit={submit}>
      <div className={secondsLeft < 180 ? 'timer urgent' : 'timer'}>
        Spot held for <strong>{minutes}:{seconds}</strong>
      </div>

      <h2>Pay the down payment</h2>
      <p className="big-amount">{peso(booking.amount_due)}</p>

      <ol className="steps">
        <li>Open GCash and choose <strong>Send Money</strong>.</li>
        <li>Send exactly <strong>{peso(booking.amount_due)}</strong> to <strong>{GCASH_NUMBER}</strong> ({GCASH_NAME}).</li>
        <li>Copy the 13-digit reference number from your receipt and enter it below.</li>
      </ol>

      <label>
        GCash reference number
        <input value={gcashRef} onChange={(e) => setGcashRef(e.target.value)} inputMode="numeric" placeholder="1234 567 890123" />
      </label>
      {error && <p className="error" role="alert">{error}</p>}

      <button type="submit" className="btn-primary block" disabled={sending}>
        {sending ? 'Sending…' : 'I have paid'}
      </button>
      <p className="hint">Booking reference: {booking.reference_number}</p>
    </form>
  )
}

function secondsUntil(iso) {
  return Math.max(0, Math.floor((new Date(iso) - Date.now()) / 1000))
}
