// EVERY call to the backend goes through this file.
// Functions marked REAL already talk to Supabase.
// Functions marked MOCK return fake data until the backend function exists.
// When the backend is ready, only this file changes; the pages stay the same.
import { supabase } from './supabase'
import { addDays } from './dates'

const FIFTEEN_MINUTES = 15 * 60 * 1000
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- REAL ----------

// All active activities (needs the public-read policy from backend file 12).
export async function getActivities() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('is_active', true)
    .order('code')
  if (error) throw error
  return data
}

export async function getActivity(code) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data // null if not found
}

// ---------- MOCK (replace when the backend functions exist) ----------

// Availability for one activity between two dates.
// Returns:
//   closed:   dates the activity is closed
//   taken:    camping only, nights already booked
//   counts:   rock only, people booked per date
//   caps:     rock only, a date's changed cap (otherwise activities.daily_capacity)
// TODO: replace with supabase.rpc('get_availability', { ... }) once it exists.
export async function getAvailability(activity, fromDate, toDate) {
  await wait(300)
  const closed = []
  const taken = []
  const counts = {}
  const caps = {}
  // Fake pattern so every label shows up in the demo.
  for (let d = fromDate; d <= toDate; d = addDays(d, 1)) {
    const day = Number(d.slice(8))
    if (day === 13) closed.push(d)
    if (activity.type === 'camping') {
      if (day % 7 === 0 || day % 7 === 1) taken.push(d)
    } else {
      if (day % 5 === 0) counts[d] = 60 // Busy
      if (day % 9 === 0) counts[d] = 125 // Very busy
      if (day === 20) counts[d] = 150 // Full
    }
  }
  return { closed, taken, counts, caps }
}

// Saves a booking and starts the 15-minute hold.
// TODO: replace with supabase.rpc('create_booking', { ... }). The server computes the real price.
export async function createBooking(booking) {
  await wait(600)
  const reference_number = 'GC-' + Math.random().toString(16).slice(2, 10).toUpperCase()
  const saved = {
    ...booking,
    reference_number,
    payment_status: 'pending',
    attendance_status: 'upcoming',
    hold_expires_at: new Date(Date.now() + FIFTEEN_MINUTES).toISOString(),
  }
  saveMock(saved)
  return saved
}

// Guest sends their GCash reference number -> booking becomes "for_verification".
// TODO: replace with supabase.rpc('submit_payment_reference', { ... }).
export async function submitPaymentReference(referenceNumber, gcashReference) {
  await wait(500)
  const booking = loadMock(referenceNumber)
  if (!booking) throw new Error('Booking not found')
  if (new Date(booking.hold_expires_at) < new Date()) {
    booking.payment_status = 'expired'
    saveMock(booking)
    throw new Error('HOLD_EXPIRED')
  }
  booking.payment_status = 'for_verification'
  booking.gcash_reference = gcashReference
  saveMock(booking)
  return booking
}

// Booking status page: reference number + email.
// TODO: replace with supabase.rpc('lookup_booking', { ... }).
export async function lookupBooking(referenceNumber, email) {
  await wait(400)
  const booking = loadMock(referenceNumber.trim().toUpperCase())
  if (!booking || booking.email.toLowerCase() !== email.trim().toLowerCase()) return null
  return booking
}

// The mock keeps bookings in this browser only, so the demo survives a page refresh.
function saveMock(booking) {
  try {
    localStorage.setItem('mock-booking-' + booking.reference_number, JSON.stringify(booking))
  } catch { /* storage blocked: fine for a mock */ }
}
function loadMock(ref) {
  try {
    return JSON.parse(localStorage.getItem('mock-booking-' + ref))
  } catch {
    return null
  }
}
