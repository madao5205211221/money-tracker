import React, { useMemo } from 'react'
import { CATEGORIES, getCategoryColor, getCategoryName } from '../lib/storage'

export default function Stats({ records }) {
  const expenseStats = useMemo(() => {
    const map = new Map()
    let total = 0
    for (const r of records) {
      if (r.type !== 'expense') continue
      const v = Number(r.amount) || 0
      total += v
      map.set(r.category, (map.get(r.category) || 0) + v)
    }
    const rows = Array.from(map.entries())
      .map(([id, value]) => ({ id, value }))
      .sort((a, b) => b.value - a.value)
    return { rows, total }
  }, [records])

  if (expenseStats.total === 0) {
    return (
      <div className="empty">
        <div className="empty-title">这个月还没有支出记录</div>
        <div className="empty-hint">记几笔之后这里会显示消费结构</div>
      </div>
    )
  }

  return (
    <div className="stats">
      <div className="stats-head">
        <span className="stats-title">支出结构</span>
        <span className="stats-total">共 {expenseStats.total.toFixed(2)} 元</span>
      </div>
      {expenseStats.rows.map((row) => {
        const pct = (row.value / expenseStats.total) * 100
        const color = getCategoryColor('expense', row.id)
        return (
          <div className="stat-row" key={row.id}>
            <div className="stat-top">
              <span className="stat-name">{getCategoryName('expense', row.id)}</span>
              <span className="stat-value">{row.value.toFixed(2)}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div className="stat-pct">{pct.toFixed(1)}%</div>
          </div>
        )
      })}
      <div className="stats-note">
        分类共 {CATEGORIES.expense.length} 类，这里只显示本月有支出的分类。
      </div>
    </div>
  )
}
