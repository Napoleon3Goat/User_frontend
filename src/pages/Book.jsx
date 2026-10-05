import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getActivity, createBooking } from '../lib/api'
import { isCamping, previewPrice } from '../lib/pricing'
import { addDays, formatDate } from '../lib/dates'
import { friendlyError } from '../lib/errors'
import { Loading, ErrorState, Empty } from '../components/StateView'
import Calendar from '../components/Calendar'
import Counter from '../components/Counter'
import GuestForm, { EMPTY_FORM, validate } from '../components/GuestForm'
import PriceSummary from '../components/PriceSummary'
import PaymentStep from '../components/PaymentStep'
import Confirmation from '../components/Confirmation'

const STEPS = ['Date', 'Details', 'Review', 'Payment', 'Done']
const MAX_NIGHTS = 14

// The whole booking flow on one page, one step at a time:
// 0 pick date → 1 guest details → 2 review & confirm → 3 pay (15-min hold) → 4 confirmation
export default function Book() {
  const { code } = useParams()
  const { state } = useLocation() // set when coming from "Add a rock activity?" after camping
  const [activity, setActivity] = useState(undefined)
  const [loadError, setLoadError] = useState('')

  const [step, setStep] = useState(0)
  const [date, setDate] = useState(null)
  const [nights, setNights] = useState(1)
  const [availability, setAvailability] = useState(null)
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(state?.prefill ? { ...state.prefill, viewers: 0, ageConfirmed: false, children: 0 } : {}),
  }))
  const [errors, setErrors] = useState({})
  const [booking, setBooking] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function load() {
    setLoadError('')
    setActivity(undefined)
    getActivity(code).then(setActivity).catch((e) => setLoadError(friendlyError(e)))
  }
  useEffect(load, [code])

  if (loadError) return <ErrorState message={loadError} onRetry={load} />
  if (activity === undefined) return <Loading />
  if (activity === null) return <Empty text="This activity isn't available for booking." />

  const camping = isCamping(activity)
  const stayNights = camping && date ? Array.from({ length: nights }, (_, i) => addDays(date, i)) : []
  const blockedNight = camping && availability
    ? stayNights.find((d) => availability.taken.includes(d) || availability.closed.includes(d))
    : null
  const price = previewPrice(activity, { ...form, nights })

  function goToReview() {
    const found = validate(activity, form)
    setErrors(found)
    if (Object.keys(found).length === 0) setStep(2)
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function confirm() {
    setSaving(true)
    setSaveError('')
    try {
      const saved = await createBooking({
        activity_id: activity.id,
        activity_code: activity.code,
        visit_date: date,
        nights: camping ? nights : null,
        name: form.name.trim(),
        contact_number: form.contact.replace(/[\s-]/g, ''),
        email: form.email.trim(),
        companions: form.companions.trim(),
        group_size: form.groupSize,
        viewing_count: camping ? 0 : form.viewers,
        senior_count: form.seniors,
        pwd_count: form.pwd,
        child_count: camping ? form.children : 0,
        local_count: form.locals,
        privacy_consent: form.consent,
        // Preview amounts for the mock only. The real booking function computes these on the server.
        total_amount: price.total,
        amount_due: price.downPayment,
      })
      setBooking(saved)
      setStep(3)
    } catch (e) {
      setSaveError(friendlyError(e))
    } finally {
      setSaving(false)
    }
  }

  function startOver() {
    setBooking(null)
    setDate(null)
    setStep(0)
  }

  return (
    <div className="book">
      {step < 4 && <Link to={`/activity/${activity.code}`} className="back">← {camping ? `Area ${activity.code}` : activity.name}</Link>}
      <h1>{camping ? `Book camping area ${activity.code}` : `Book the ${activity.name}`}</h1>

      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'current' : i < step ? 'done' : ''}>{s}</li>
        ))}
      </ol>

      {step === 0 && (
        <div className="card">
          <h2>{camping ? 'Choose your check-in date' : 'Choose your date'}</h2>
          {!camping && <p className="muted">No time slots. Come any time that day; arrive early on busy days.</p>}
          <Calendar
            activity={activity}
            selected={date}
            range={stayNights}
            minDate={state?.minDate}
            maxDate={state?.maxDate}
            onSelect={(d, avail) => { setDate(d); setAvailability(avail) }}
            onAvailability={setAvailability}
          />

          {camping && (
            <Counter label="Number of nights" value={nights} onChange={setNights} min={1} max={MAX_NIGHTS} />
          )}

          {date && (
            <p className="selection">
              {camping
                ? <>Check-in <strong>{formatDate(date)}</strong>, check-out <strong>{formatDate(addDays(date, nights))}</strong></>
                : <>Date: <strong>{formatDate(date)}</strong></>}
            </p>
          )}
          {blockedNight && <p className="error">The area isn't free on {formatDate(blockedNight)}. Choose fewer nights or another date.</p>}

          <button className="btn-primary block" disabled={!date || !!blockedNight} onClick={() => setStep(1)}>
            Continue
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <GuestForm activity={activity} form={form} setForm={setForm} errors={errors} />
          <div className="actions">
            <button className="btn-secondary" onClick={() => setStep(0)}>Back</button>
            <button className="btn-primary" onClick={goToReview}>Review booking</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2>Review your booking</h2>
          <dl className="facts">
            <dt>{camping ? 'Check-in' : 'Date'}</dt><dd>{formatDate(date)}</dd>
            {camping && <><dt>Nights</dt><dd>{nights}</dd></>}
            <dt>Name</dt><dd>{form.name}</dd>
            <dt>Contact</dt><dd>{form.contact} · {form.email}</dd>
            <dt>Group</dt><dd>{form.groupSize}{!camping && form.viewers ? ` (${form.viewers} viewing only)` : ''}</dd>
          </dl>
          <PriceSummary price={price} />
          <p className="hint">After you confirm, the spot is held for 15 minutes while you pay by GCash.</p>
          {saveError && <p className="error" role="alert">{saveError}</p>}
          <div className="actions">
            <button className="btn-secondary" onClick={() => setStep(1)} disabled={saving}>Back</button>
            <button className="btn-primary" onClick={confirm} disabled={saving}>
              {saving ? 'Saving…' : 'Confirm and pay'}
            </button>
          </div>
          {saveError && <button className="link-button" onClick={() => setStep(0)}>Pick another date</button>}
        </div>
      )}

      {step === 3 && booking && (
        <PaymentStep booking={booking} onPaid={(b) => { setBooking(b); setStep(4) }} onStartOver={startOver} />
      )}

      {step === 4 && booking && <Confirmation booking={booking} activity={activity} form={form} />}
    </div>
  )
}
