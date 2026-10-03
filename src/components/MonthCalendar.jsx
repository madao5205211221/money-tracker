import React from 'react'

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

function levelOf(value, max) {
  if (value <= 0) return 0
  const r = value / max
  if (r <= 0.25) return 1
  if (r <= 0.5) return 2
  if (r <= 0.75) return 3
  return 4
}

const LEVEL_BG = ['transparent', '#E1F5EE', '#9FE1CB', '#5DCAA5', '#1D9E75']
const LEVEL_FG = ['#5F5E5A', '#0F6E56', '#085041', '#085041', '#FFFFFF']

export default function MonthCalendar({ month, records, selected, onSelect }) {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const daysInMonth = new Date(y, m, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // 周一为一周起点

  const byDay = new Map()
  let monthTotal = 0
  for (const r of records) {
    if (r.type !== 'expense') continue
    const day = Number(String(r.date).slice(8, 10))
    const v = Number(r.amount) || 0
    byDay.set(day, (byDay.get(day) || 0) + v)
    monthTotal += v
  }
  const max = Math.max(...Array.from(byDay.values()), 1)

  const cells = []
  for (let i = 0; i < lead; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)

  const activeDays = byDay.size
  const avg = activeDays > 0 ? monthTotal / activeDays : 0

  return (
    <div className="calendar">
      <div className="cal-week">
        {WEEK.map((w) => (
          <div className="cal-week-cell" key={w}>
            {w}
          </div>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d, idx) => {
          if (d === null) return <div className="cal-cell empty-cell" key={`e${idx}`} />
          const v = byDay.get(d) || 0
          const lv = levelOf(v, max)
          const isSel = selected === d
          return (
            <div
              className={`cal-cell ${isSel ? 'sel' : ''}`}
              key={d}
              style={{ background: LEVEL_BG[lv], color: LEVEL_FG[lv] }}
              onClick={() => onSelect(isSel ? null : d)}
            >
              <div className="cal-day">{d}</div>
              <div className="cal-amount">{v > 0 ? Math.round(v) : ''}</div>
            </div>
          )
        })}
      </div>
      <div className="cal-summary">
        <span>
          本月共支出 <b>{monthTotal.toFixed(2)}</b> 元
        </span>
        <span>
          有支出的 {activeDays} 天，日均 {avg.toFixed(2)} 元
        </span>
      </div>
      <div className="cal-legend">
        <span>花得越多颜色越深</span>
        <span className="legend-box" style={{ background: '#E1F5EE' }} />
        <span className="legend-box" style={{ background: '#9FE1CB' }} />
        <span className="legend-box" style={{ background: '#5DCAA5' }} />
        <span className="legend-box" style={{ background: '#1D9E75' }} />
      </div>
    </div>
  )
}
