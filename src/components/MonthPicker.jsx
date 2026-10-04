import React, { useEffect, useMemo, useRef, useState } from 'react'

const SWIPE_MIN = 40 // 触发翻年的最小横向位移（px）

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
  const [y] = month.split('-').map(Number)
  const [viewYear, setViewYear] = useState(y)
  const [yearPanel, setYearPanel] = useState(false) // 年份列表是否展开

  // 手势滑动切换年份
  const touchX = useRef(null)
  const yearGridRef = useRef(null)

  // 年份可翻范围：往前至少 20 年、往后至少 10 年，
  // 若记录里有更早/更晚的年份则自动扩到那里。两个方向都不设「今年」这种硬上限。
  const { minYear, maxYear } = useMemo(() => {
    const thisYear = new Date().getFullYear()
    const years = records
      .map((r) => Number(String(r.date).slice(0, 4)))
      .filter((n) => Number.isFinite(n) && n > 1900)
    const earliest = years.length ? Math.min(...years) : thisYear
    const latest = years.length ? Math.max(...years) : thisYear
    return {
      minYear: Math.min(earliest, thisYear - 20),
      maxYear: Math.max(latest, thisYear + 10),
    }
  }, [records])

  const allYears = useMemo(() => {
    const list = []
    for (let yr = minYear; yr <= maxYear; yr += 1) list.push(yr)
    return list
  }, [minYear, maxYear])

  const clamp = (yr) => Math.min(maxYear, Math.max(minYear, yr))
  const goYear = (delta) => setViewYear((prev) => clamp(prev + delta))

  // 展开年份列表时，把当前年份滚到中间
  useEffect(() => {
    const box = yearGridRef.current
    if (!yearPanel || !box) return
    const active = box.querySelector('.year-cell.on')
    if (active) {
      box.scrollTop = active.offsetTop - box.clientHeight / 2 + active.clientHeight / 2
    }
  }, [yearPanel])

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

  const onTouchStart = (e) => {
    if (yearPanel) return
    touchX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) < SWIPE_MIN) return
    // 年份从早到晚从左往右排，所以右滑看更早的年份
    goYear(dx > 0 ? -1 : 1)
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

        {/* 整块区域都能左右滑动切换年份 */}
        <div className="picker-body" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="year-bar">
            <button
              className="year-step"
              disabled={viewYear <= minYear}
              onClick={() => goYear(-1)}
            >
              ‹
            </button>
            <button
              className="year-current year-current-btn"
              onClick={() => setYearPanel((p) => !p)}
            >
              <span className="year-num">{viewYear}</span>
              <span className="year-unit">年</span>
              <span className="year-caret">{yearPanel ? '▴' : '▾'}</span>
            </button>
            <button
              className="year-step"
              disabled={viewYear >= maxYear}
              onClick={() => goYear(1)}
            >
              ›
            </button>
          </div>

          {yearPanel ? (
            <div className="year-grid" ref={yearGridRef}>
              {allYears.map((yr) => (
                <button
                  key={yr}
                  className={`year-cell ${yr === viewYear ? 'on' : ''}`}
                  onClick={() => {
                    setViewYear(yr)
                    setYearPanel(false)
                  }}
                >
                  {yr}
                </button>
              ))}
            </div>
          ) : (
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
          )}
        </div>

        <div className="picker-hint">
          {yearPanel
            ? '点一个年份直接跳过去'
            : '左右滑动换年份 · 点上方年份可挑选 · 点月份跳过去'}
        </div>
      </div>
    </div>
  )
}
