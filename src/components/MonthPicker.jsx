import React, { useMemo, useRef, useState } from 'react'

// 极简月历：只画日期点，用来在「12 个月缩略图」里表示哪些天有记账
function MiniMonth({ year, month, markedDays, isCurrent, onPick }) {
  const days = new Date(year, month, 0).getDate()
  const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7 // 周一为起点
  const cells = []
  for (let i = 0; i < lead; i += 1) cells.push(null)
  for (let d = 1; d <= days; d += 1) cells.push(d)

  return (
    <button
      className={`mini-month ${isCurrent ? 'current' : ''}`}
      onClick={() => onPick(year, month)}
    >
      <div className="mini-month-title">{month} 月</div>
      <div className="mini-grid">
        {cells.map((d, i) => (
          <span
            key={`${month}-${i}`}
            className={`mini-day ${d === null ? 'void' : ''} ${
              d !== null && markedDays.has(d) ? 'has' : ''
            }`}
          />
        ))}
      </div>
    </button>
  )
}

export default function MonthPicker({ month, records, onPick, onClose }) {
  const [y, m] = month.split('-').map(Number)
  const [viewYear, setViewYear] = useState(y)

  // 手势滑动切换年份
  const touchRef = useRef(null)

  // 有记录的年份列表（加上当前查看的年份）
  const yearList = useMemo(() => {
    const set = new Set(records.map((r) => Number(String(r.date).slice(0, 4))))
    set.add(viewYear)
    set.add(new Date().getFullYear())
    return Array.from(set).filter((n) => Number.isFinite(n)).sort()
  }, [records, viewYear])

  const yearIndex = yearList.indexOf(viewYear)

  // 每年每月：哪些天有记录
  const marksByMonth = useMemo(() => {
    const map = new Map()
    for (const r of records) {
      const s = String(r.date)
      if (Number(s.slice(0, 4)) !== viewYear) continue
      const mm = Number(s.slice(5, 7))
      const dd = Number(s.slice(8, 10))
      if (!map.has(mm)) map.set(mm, new Set())
      map.get(mm).add(dd)
    }
    return map
  }, [records, viewYear])

  const goYear = (delta) => {
    const next = yearList[yearIndex + delta]
    if (next !== undefined) setViewYear(next)
  }

  const onTouchStart = (e) => {
    touchRef.current = e.touches[0].clientX
  }
  const onTouchEnd = (e) => {
    if (touchRef.current === null) return
    const dx = e.changedTouches[0].clientX - touchRef.current
    touchRef.current = null
    if (Math.abs(dx) < 45) return
    goYear(dx < 0 ? 1 : -1) // 左滑看更早/更晚，按年份序列顺序
  }

  const thisMonth = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`

  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sheet-title">选择月份</span>
          <button className="sheet-close" onClick={onClose}>
            关闭
          </button>
        </div>

        <div
          className="year-bar"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            className="year-step"
            disabled={yearIndex >= yearList.length - 1}
            onClick={() => goYear(-1)}
          >
            ‹
          </button>
          <div className="year-current">
            <span className="year-num">{viewYear}</span>
            <span className="year-unit">年</span>
          </div>
          <button className="year-step" disabled={yearIndex <= 0} onClick={() => goYear(1)}>
            ›
          </button>
        </div>

        {yearList.length > 1 && (
          <div className="year-chips">
            {yearList
              .slice()
              .reverse()
              .map((yr) => (
                <button
                  key={yr}
                  className={`year-chip ${yr === viewYear ? 'on' : ''}`}
                  onClick={() => setViewYear(yr)}
                >
                  {yr}
                </button>
              ))}
          </div>
        )}

        <div className="mini-wrap">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((mm) => (
            <MiniMonth
              key={mm}
              year={viewYear}
              month={mm}
              markedDays={marksByMonth.get(mm) || new Set()}
              isCurrent={`${viewYear}-${mm}` === thisMonth}
              onPick={onPick}
            />
          ))}
        </div>

        <div className="picker-hint">左右滑动切换年份 · 点某个月直接跳过去</div>
      </div>
    </div>
  )
}
