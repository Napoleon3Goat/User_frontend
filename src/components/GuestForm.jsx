import Counter from './Counter'
import { isCamping, discountedCount } from '../lib/pricing'

export const EMPTY_FORM = {
  name: '',
  contact: '',
  email: '',
  companions: '',
  groupSize: 1,
  seniors: 0,
  pwd: 0,
  children: 0, // camping only: 7 and below
  locals: 0, // Atok locals
  viewers: 0, // rock only
  ageConfirmed: false, // rock only
  consent: false,
}

// Checks the form before anything is sent, so the database never has to reject it.
// Returns { fieldName: 'message' }; an empty object means everything is fine.
export function validate(activity, form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Please enter your name.'
  if (!/^09\d{9}$/.test(form.contact.replace(/[\s-]/g, ''))) errors.contact = 'Enter an 11-digit mobile number starting with 09.'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email. Your reference number is sent here.'
  if (form.groupSize < 1) errors.groupSize = 'At least 1 person.'
  if (discountedCount(form) > form.groupSize) {
    errors.discounts = 'Each person can have only one discount, so the discount counts can\'t add up to more than the group size.'
  }
  if (!isCamping(activity)) {
    if (form.viewers > form.groupSize) errors.viewers = 'Viewers can\'t be more than the group size.'
    if (form.groupSize - form.viewers > 0 && !form.ageConfirmed) {
      errors.ageConfirmed = 'Please confirm everyone doing the package is old enough.'
    }
  }
  if (!form.consent) errors.consent = 'Please agree so we can process your booking.'
  return errors
}

export default function GuestForm({ activity, form, setForm, errors }) {
  const camping = isCamping(activity)
  const set = (field) => (value) => setForm({ ...form, [field]: value })
  const setText = (field) => (e) => set(field)(e.target.value)
  const minAge = activity.min_age ?? 10

  return (
    <div className="form">
      <h2>Your details</h2>

      <label>
        Full name
        <input value={form.name} onChange={setText('name')} autoComplete="name" />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>

      <label>
        Mobile number
        <input value={form.contact} onChange={setText('contact')} inputMode="tel" placeholder="09XX XXX XXXX" autoComplete="tel" />
        {errors.contact && <span className="field-error">{errors.contact}</span>}
      </label>

      <label>
        Email
        <input type="email" value={form.email} onChange={setText('email')} autoComplete="email" />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>

      <label>
        Companions' names <span className="hint">(optional, one per line)</span>
        <textarea rows={3} value={form.companions} onChange={setText('companions')} />
      </label>

      <h2>Your group</h2>
      <Counter label="Group size" hint="Everyone, including you" value={form.groupSize} onChange={set('groupSize')} min={1} />

      {!camping && (
        <>
          <Counter label="Viewing only" hint="Going up to watch, not doing the activities" value={form.viewers} onChange={set('viewers')} />
          {errors.viewers && <span className="field-error">{errors.viewers}</span>}
        </>
      )}

      <p className="hint block-hint">Discounts: each person can get only one.</p>
      <Counter label="Senior citizens" value={form.seniors} onChange={set('seniors')} />
      <Counter label="PWDs" value={form.pwd} onChange={set('pwd')} />
      {camping && <Counter label="Children 7 and below" value={form.children} onChange={set('children')} />}
      <Counter label="Atok locals" value={form.locals} onChange={set('locals')} />
      {errors.discounts && <span className="field-error">{errors.discounts}</span>}

      {!camping && form.groupSize - form.viewers > 0 && (
        <label className="check">
          <input type="checkbox" checked={form.ageConfirmed} onChange={(e) => set('ageConfirmed')(e.target.checked)} />
          <span>Everyone doing the package is {minAge} or older. Younger children are counted as viewers.</span>
        </label>
      )}
      {errors.ageConfirmed && <span className="field-error">{errors.ageConfirmed}</span>}

      <label className="check">
        <input type="checkbox" checked={form.consent} onChange={(e) => set('consent')(e.target.checked)} />
        <span>
          I agree that Goatcliff collects my details only to process this booking and improve its services,
          in line with the Data Privacy Act of 2012.
        </span>
      </label>
      {errors.consent && <span className="field-error">{errors.consent}</span>}
    </div>
  )
}
