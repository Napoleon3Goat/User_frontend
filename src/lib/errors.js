// Turns raw database errors into messages a guest understands.
// The codes come from the backend (see "Errors to handle" in the handoff doc).
const MESSAGES = [
  ['no_double_booking_camping', 'Sorry, this area was just booked for those dates. Please pick other dates or another area.'],
  ['DAY_FULL', 'The rock is fully booked that day. Please try another date.'],
  ['DATE_CLOSED', 'Goatcliff is closed on one of those dates.'],
  ['check constraint', 'Some of the numbers in your form don\'t add up. Please check the group size and discount counts.'],
]

export function friendlyError(error) {
  const text = error?.message || String(error || '')
  const match = MESSAGES.find(([code]) => text.includes(code))
  if (match) return match[1]
  if (text.toLowerCase().includes('fetch')) return 'Can\'t reach the server. Check your internet connection and try again.'
  return 'Something went wrong. Please try again.'
}
