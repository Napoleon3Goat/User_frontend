import { useEffect, useState } from 'react'
import { getAvailability } from '../lib/api'
import { addDays, monthGrid, todayManila } from '../lib/dates'
import { isCamping } from '../lib/pricing'
import { friendlyError } from '../lib/errors'
import { Loading, ErrorState } from './StateView'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Decides the label for one date.
// Rock: checked in this order, stopping at the first match: Too soon → Full → Very busy → Busy → Open.
// Camping: Too soon → Closed → Taken → Free.
export function dateLabel(activity, date, availability) {
  const notice = activity.advance_notice_days ?? 2
  if (date < addDays(todayManila(), notice)) return 'too-soon'
  if (availability.closed.includes(date)) return isCamping(activity) ? 'closed' : 'full'

  if (isCamping(activity)) {
    return availability.taken.includes(date) ? 'taken' : 'free'
  }
  const cap = availability.caps[date] ?? activity.daily_capacity ?? 150
  const count = availability.counts[date] ?? 0
  if (count >= cap) return 'full'
  if (count >= 0.8 * cap) return 'very-busy'
  if (count >= (activity.capacity ?? 50)) return 'busy'
  return 'open'
}

const LABEL_TEXT = {
  'too-soon': 'Too soon',
  closed: 'Closed',
  taken: 'Booked',
  free: 'Available',
  full: 'Full',
  'very-busy': 'Very busy',
  busy: 'Busy',
  open: 'Open',
}
const BOOKABLE = ['free', 'open', 'busy', 'very-busy']

const LEGENDS = {
  camping: [
    ['free', 'Available'],
    ['taken', 'Booked'],
    ['closed', 'Closed'],
    ['too-soon', 'Too soon (book 2+ days ahead)'],
  ],
  rock: [
    ['open', 'Open: everyone can go at once'],
    ['busy', 'Busy: expect some waiting for gear'],
    ['very-busy', 'Very busy: long waits, arrive early'],
    ['full', 'Full or closed'],
    ['too-soon', 'Too soon (book 2+ days ahead)'],
  ],
}

// Month calendar. `selected` = chosen date; `range` = extra highlighted dates (camping nights).
// minDate/maxDate optionally limit which dates can be picked.
export default function Calendar({ activity, selected, onSelect, range = [], minDate, maxDate, onAvailability }) {
  const start = selected || minDate || todayManila()
  const [year, setYear] = useState(Number(start.slice(0, 4)))
  const [month, setMonth] = useState(Number(start.slice(5, 7)) - 1)
  const [availability, setAvailability] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  const cells = monthGrid(year, month)
  const first = cells.find(Boolean)
  const last = cells[cells.length - 1]

  useEffect(() => {
    let cancelled = false
    setAvailability(null)
    setError('')
    // Load a few extra days so a multi-night stay can run into next month.
    getAvailability(activity, first, addDays(last, 31))
      .then((data) => {
        if (cancelled) return
        setAvailability(data)
        onAvailability?.(data)
      })
      .catch((e) => !cancelled && setError(friendlyError(e)))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id, year, month, reload])

  function move(step) {
    const m = month + step
    setYear(year + Math.floor(m / 12))
    setMonth(((m % 12) + 12) % 12)
  }

  const thisMonth = todayManila().slice(0, 7)
  const shownMonth = `${year}-${String(month + 1).padStart(2, '0')}`

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" onClick={() => move(-1)} disabled={shownMonth <= thisMonth} aria-label="Previous month">‹</button>
        <strong>{MONTHS[month]} {year}</strong>
        <button type="button" onClick={() => move(1)} aria-label="Next month">›</button>
      </div>

      {error && <ErrorState message={error} onRetry={() => setReload(reload + 1)} />}
      {!error && !availability && <Loading text="Checking availability…" />}

      {availability && (
        <>
          <div className="calendar-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="weekday">{d}</span>
            ))}
            {cells.map((date, i) => {
              if (!date) return <span key={'blank' + i} />
              let label = dateLabel(activity, date, availability)
              const outside = (minDate && date < minDate) || (maxDate && date > maxDate)
              const bookable = BOOKABLE.includes(label) && !outside
              const classes = ['day', 'day-' + label]
              if (outside) classes.push('day-outside')
              if (date === selected) classes.push('day-selected')
              else if (range.includes(date)) classes.push('day-range')
              return (
                <button
                  type="button"
                  key={date}
                  className={classes.join(' ')}
                  disabled={!bookable}
                  onClick={() => onSelect(date, availability)}
                  title={LABEL_TEXT[label]}
                  aria-label={`${date}: ${LABEL_TEXT[label]}`}
                >
                  {Number(date.slice(8))}
                </button>
              )
            })}
          </div>

          <ul className="legend">
            {LEGENDS[isCamping(activity) ? 'camping' : 'rock'].map(([key, text]) => (
              <li key={key}><span className={'swatch day-' + key} /> {text}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
