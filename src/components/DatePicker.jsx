import React, { useMemo, useState } from 'react'

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

function pad(n) {
  return String(n).padStart(2, '0')
}

function toStr(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`
}

function todayStr() {
  const d = new Date()
  return toStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function addDays(str, delta) {
  const [y, m, d] = str.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  return toStr(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}

function shiftMonth(str, delta) {
  const [y, m] = str.split('-').map(Number)
  const dt = new Date(y, m - 1 + delta, 1)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`
}

/**
 * 日期选择：快捷按钮（今天/昨天/前天）+ 展开式月历，可任意选过去或未来的日期。
 * 不用系统原生日期控件（在手机上往前翻很不方便，用户反馈补记昨天的账选不了）。
 */
export default function DatePicker({ value, onChange }) {
  const today = todayStr()
  const yesterday = addDays(today, -1)
  const beforeYesterday = addDays(today, -2)

  const [open, setOpen] = useState(false)
  // 月历当前展示的月份，初始跟随已选日期
  const [viewMonth, setViewMonth] = useState(() => value.slice(0, 7))

  const [vy, vm] = viewMonth.split('-').map(Number)
  const daysInMonth = new Date(vy, vm, 0).getDate()
  const lead = (new Date(vy, vm - 1, 1).getDay() + 6) % 7

  const cells = useMemo(() => {
    const list = []
    for (let i = 0; i < lead; i += 1) list.push(null)
    for (let d = 1; d <= daysInMonth; d += 1) list.push(d)
    return list
  }, [lead, daysInMonth])

  const quick = [
    { key: 'today', label: '今天', date: today },
    { key: 'yesterday', label: '昨天', date: yesterday },
    { key: 'before', label: '前天', date: beforeYesterday },
  ]

  const pick = (day) => {
    onChange(toStr(vy, vm, day))
    setOpen(false)
  }

  const open_ = () => {
    setViewMonth(value.slice(0, 7)) // 每次打开都对齐到已选日期的月份
    setOpen(true)
  }

  const label =
    value === today ? '今天' : value === yesterday ? '昨天' : value === beforeYesterday ? '前天' : ''

  return (
    <div className="dp">
      <div className="dp-quick">
        {quick.map((q) => (
          <button
            key={q.key}
            className={`dp-quick-btn ${value === q.date ? 'on' : ''}`}
            onClick={() => {
              onChange(q.date)
              setOpen(false)
            }}
          >
            {q.label}
          </button>
        ))}
        <button className={`dp-date-btn ${open ? 'on' : ''}`} onClick={() => (open ? setOpen(false) : open_())}>
          <span className="dp-date-text">{value.slice(5)}</span>
          <span className="dp-date-caret">{open ? '▴' : '▾'}</span>
        </button>
      </div>

      {label && <div className="dp-note">将记到{label}（{value.slice(5)}）</div>}

      {open && (
        <div className="dp-panel">
          <div className="dp-month-bar">
            <button className="dp-nav" onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}>
              ‹
            </button>
            <span className="dp-month-label">
              {vy} 年 {vm} 月
            </span>
            <button className="dp-nav" onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}>
              ›
            </button>
          </div>
          <div className="dp-week">
            {WEEK.map((w) => (
              <span key={w} className="dp-week-cell">
                {w}
              </span>
            ))}
          </div>
          <div className="dp-grid">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} className="dp-cell void" />
              const str = toStr(vy, vm, d)
              const cls = [
                'dp-cell',
                str === value ? 'sel' : '',
                str === today ? 'today' : '',
                str > today ? 'future' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button key={str} className={cls} onClick={() => pick(d)}>
                  {d}
                </button>
              )
            })}
          </div>
          <div className="dp-foot">
            <span className="dp-hint">可往前翻补记旧账</span>
            <span className="dp-today-link" onClick={() => pick(Number(today.slice(8)))}>
              回今天
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
