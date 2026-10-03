import React from 'react'
import { getCategoryColor, getCategoryName } from '../lib/storage'

function groupByDate(records) {
  const map = new Map()
  for (const r of records) {
    const day = String(r.date).slice(0, 10)
    if (!map.has(day)) map.set(day, [])
    map.get(day).push(r)
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

function dayTotal(list) {
  let income = 0
  let expense = 0
  for (const r of list) {
    if (r.type === 'income') income += Number(r.amount) || 0
    else expense += Number(r.amount) || 0
  }
  return { income, expense }
}

function dayLabel(day) {
  const today = new Date()
  const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`
  if (day === t) return '今天'
  const yesterday = new Date(today.getTime() - 86400000)
  const y = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(
    yesterday.getDate()
  ).padStart(2, '0')}`
  if (day === y) return '昨天'
  const [, m, d] = day.split('-')
  return `${Number(m)}月${Number(d)}日`
}

export default function RecordList({ records, onDelete }) {
  if (records.length === 0) {
    return (
      <div className="empty">
        <div className="empty-title">这个月还没有记录</div>
        <div className="empty-hint">点右下角「记一笔」开始</div>
      </div>
    )
  }

  const groups = groupByDate(records)

  return (
    <div className="list">
      {groups.map(([day, list]) => {
        const t = dayTotal(list)
        return (
          <section className="day-group" key={day}>
            <div className="day-head">
              <span className="day-name">{dayLabel(day)}</span>
              <span className="day-sum">
                {t.income > 0 && <span className="income">收 {t.income.toFixed(2)}</span>}
                {t.expense > 0 && <span className="expense">支 {t.expense.toFixed(2)}</span>}
              </span>
            </div>
            {list.map((r) => (
              <div className="record-row" key={r.id}>
                <span className="dot" style={{ background: getCategoryColor(r.type, r.category) }} />
                <div className="record-main">
                  <div className="record-cat">{getCategoryName(r.type, r.category)}</div>
                  {r.note && <div className="record-note">{r.note}</div>}
                </div>
                <div className={`record-amount ${r.type}`}>
                  {r.type === 'income' ? '+' : '-'}
                  {(Number(r.amount) || 0).toFixed(2)}
                </div>
                <button className="del-btn" onClick={() => onDelete(r.id)}>
                  删除
                </button>
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
