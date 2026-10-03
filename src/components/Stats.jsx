import React, { useMemo } from 'react'
import { getCategoryColor, getCategoryName } from '../lib/storage'

export default function Stats({ records }) {
  const { rows, total } = useMemo(() => {
    const map = new Map()
    let sum = 0
    for (const r of records) {
      if (r.type !== 'expense') continue
      const v = Number(r.amount) || 0
      sum += v
      map.set(r.category, (map.get(r.category) || 0) + v)
    }
    const list = Array.from(map.entries())
      .map(([id, value]) => ({ id, value }))
      .sort((a, b) => b.value - a.value)
    return { rows: list, total: sum }
  }, [records])

  if (total === 0) {
    return (
      <div className="empty">
        <div className="empty-title">这个月还没有支出</div>
        <div className="empty-hint">记几笔之后这里会显示消费结构</div>
      </div>
    )
  }

  return (
    <div>
      <div className="group-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>支出结构</span>
        <span className="num">共 {total.toFixed(2)} 元</span>
      </div>
      <div className="group">
        {rows.map((row) => {
          const pct = (row.value / total) * 100
          const color = getCategoryColor('expense', row.id)
          return (
            <div
              className="row"
              key={row.id}
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="cat-icon"
                    style={{ background: color, width: 22, height: 22, fontSize: 11 }}
                  >
                    {getCategoryName('expense', row.id).slice(0, 1)}
                  </span>
                  <span>{getCategoryName('expense', row.id)}</span>
                </span>
                <span className="num" style={{ fontWeight: 600 }}>
                  {row.value.toFixed(2)}
                </span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <div className="stat-cap num">{pct.toFixed(1)}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
