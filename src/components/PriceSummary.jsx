import { peso } from '../lib/dates'

export default function PriceSummary({ price }) {
  return (
    <div className="summary">
      {price.lines.map((line) => (
        <div className="summary-row" key={line.label}>
          <span>{line.label}</span>
          <span>{line.amount < 0 ? '−' + peso(-line.amount) : peso(line.amount)}</span>
        </div>
      ))}
      <div className="summary-row total">
        <span>Total</span>
        <span>{peso(price.total)}</span>
      </div>
      <div className="summary-row due">
        <span>Down payment due now (50%)</span>
        <span>{peso(price.downPayment)}</span>
      </div>
      <p className="hint">The remaining 50% is paid when you arrive.</p>
    </div>
  )
}
