import React, { useMemo, useState } from 'react'
import MonthCalendar from './MonthCalendar'
import { getCategoryColor, getCategoryName } from '../lib/storage'

function monthKey(offset) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Stats({ month, monthRecords, allRecords, categories }) {
  const [view, setView] = useState('struct')
  const [openCat, setOpenCat] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)

  const years = useMemo(() => {
    const set = new Set(allRecords.map((r) => String(r.date).slice(0, 4)))
    set.add(String(new Date().getFullYear()))
    return Array.from(set).sort().reverse()
  }, [allRecords])

  const [year, setYear] = useState(() => String(new Date().getFullYear()))

  const struct = useMemo(() => {
    const map = new Map()
    let total = 0
    for (const r of monthRecords) {
      if (r.type !== 'expense') continue
      const v = Number(r.amount) || 0
      total += v
      map.set(r.category, (map.get(r.category) || 0) + v)
    }
    const rows = Array.from(map.entries())
      .map(([id, value]) => ({ id, value }))
      .sort((a, b) => b.value - a.value)
    return { rows, total }
  }, [monthRecords])

  const trend = useMemo(() => {
    const keys = [5, 4, 3, 2, 1, 0].map(monthKey)
    const rows = keys.map((k) => {
      let expense = 0
      let income = 0
      for (const r of allRecords) {
        if (String(r.date).slice(0, 7) !== k) continue
        if (r.type === 'expense') expense += Number(r.amount) || 0
        else income += Number(r.amount) || 0
      }
      return { key: k, expense, income }
    })
    const max = Math.max(...rows.map((r) => r.expense), 1)
    return { rows, max }
  }, [allRecords])

  const annual = useMemo(() => {
    const list = allRecords.filter((r) => String(r.date).slice(0, 4) === year)
    let expense = 0
    let income = 0
    let biggest = null
    let catMap = new Map()
    const monthCount = new Set()
    for (const r of list) {
      const v = Number(r.amount) || 0
      monthCount.add(String(r.date).slice(0, 7))
      if (r.type === 'expense') {
        expense += v
        catMap.set(r.category, (catMap.get(r.category) || 0) + v)
        if (!biggest || v > biggest.amount) {
          biggest = { amount: v, category: r.category, date: r.date, note: r.note }
        }
      } else {
        income += v
      }
    }
    const topCat = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0]
    const months = Math.max(monthCount.size, 1)
    return {
      expense,
      income,
      balance: income - expense,
      monthlyAvg: expense / months,
      biggest,
      topCat: topCat
        ? {
            id: topCat[0],
            value: topCat[1],
            name: getCategoryName(categories, 'expense', topCat[0]),
          }
        : null,
      count: list.length,
    }
  }, [allRecords, year, categories])

  const money = (n) => (Math.round(n * 100) / 100).toFixed(2)

  const dayItems = useMemo(() => {
    if (selectedDay === null) return []
    return monthRecords.filter((r) => Number(String(r.date).slice(8, 10)) === selectedDay)
  }, [monthRecords, selectedDay])

  return (
    <div className="stats">
      <div className="view-switch">
        {[
          ['struct', '支出结构'],
          ['daily', '每日'],
          ['trend', '月度趋势'],
          ['annual', '年度总览'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`view-btn ${view === key ? 'on' : ''}`}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'struct' &&
        (struct.total === 0 ? (
          <div className="empty">
            <div className="empty-title">这个月还没有支出记录</div>
            <div className="empty-hint">记几笔之后这里会显示消费结构</div>
          </div>
        ) : (
          <>
            <div className="stats-head">
              <span className="stats-title">本月支出结构</span>
              <span className="stats-total">共 {money(struct.total)} 元</span>
            </div>
            {struct.rows.map((row) => {
              const pct = (row.value / struct.total) * 100
              const color = getCategoryColor(categories, 'expense', row.id)
              const open = openCat === row.id
              const items = monthRecords.filter(
                (r) => r.type === 'expense' && r.category === row.id
              )
              return (
                <div className="stat-block" key={row.id}>
                  <div
                    className="stat-row clickable"
                    onClick={() => setOpenCat(open ? null : row.id)}
                  >
                    <div className="stat-top">
                      <span className="stat-name">
                        {getCategoryName(categories, 'expense', row.id)}
                      </span>
                      <span className="stat-value">{money(row.value)}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="stat-pct">
                      {pct.toFixed(1)}% · {items.length} 笔
                      <span className="drill-hint">{open ? '收起' : '看构成'}</span>
                    </div>
                  </div>
                  {open && (
                    <div className="drill-list">
                      {items.length === 0 ? (
                        <div className="drill-empty">这个分类下没有单独记录</div>
                      ) : (
                        items.map((r) => (
                          <div className="drill-item" key={r.id}>
                            <span className="drill-date">{String(r.date).slice(5)}</span>
                            <span className="drill-note">
                              {r.note || getCategoryName(categories, 'expense', r.category)}
                            </span>
                            <span className="drill-amount">
                              {(Number(r.amount) || 0).toFixed(2)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ))}

      {view === 'daily' && (
        <>
          <MonthCalendar
            month={month}
            records={monthRecords}
            selected={selectedDay}
            onSelect={setSelectedDay}
          />
          {selectedDay !== null && (
            <div className="panel" style={{ marginTop: 12 }}>
              <div className="panel-title">
                {Number(month.slice(5))}月{selectedDay}日 · {dayItems.length} 笔
              </div>
              {dayItems.length === 0 ? (
                <div className="panel-text">这天没有记录</div>
              ) : (
                dayItems.map((r) => (
                  <div className="panel-row" key={r.id}>
                    <span>
                      {getCategoryName(categories, r.type, r.category)}
                      {r.note ? ` · ${r.note}` : ''}
                    </span>
                    <span className={r.type === 'income' ? 'income' : 'expense'}>
                      {r.type === 'income' ? '+' : '-'}
                      {(Number(r.amount) || 0).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {view === 'trend' && (
        <>
          <div className="stats-head">
            <span className="stats-title">近 6 个月支出</span>
            <span className="stats-total">柱高按金额比例</span>
          </div>
          <div className="chart">
            {trend.rows.map((r) => {
              const h = (r.expense / trend.max) * 100
              return (
                <div className="chart-col" key={r.key}>
                  <div className="chart-value">{r.expense > 0 ? Math.round(r.expense) : ''}</div>
                  <div className="chart-bar-wrap">
                    <div
                      className="chart-bar"
                      style={{ height: `${Math.max(h, r.expense > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                  <div className="chart-label">{Number(r.key.slice(5))}月</div>
                </div>
              )
            })}
          </div>
          <div className="panel" style={{ marginTop: 14 }}>
            <div className="panel-title">这半年的钱去哪了</div>
            <div className="panel-text">
              半年共支出{' '}
              {money(trend.rows.reduce((s, r) => s + r.expense, 0))} 元，收入{' '}
              {money(trend.rows.reduce((s, r) => s + r.income, 0))} 元。柱子最高的那个月，值得回去看看明细。
            </div>
          </div>
        </>
      )}

      {view === 'annual' && (
        <>
          <div className="stats-head">
            <span className="stats-title">{year} 年总览</span>
            <select className="year-select" value={year} onChange={(e) => setYear(e.target.value)}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y} 年
                </option>
              ))}
            </select>
          </div>

          <div className="panel">
            <div className="panel-row">
              <span>全年支出</span>
              <span className="expense">{money(annual.expense)}</span>
            </div>
            <div className="panel-row">
              <span>全年收入</span>
              <span className="income">{money(annual.income)}</span>
            </div>
            <div className="panel-row">
              <span>全年结余</span>
              <span className={annual.balance >= 0 ? 'income' : 'expense'}>
                {money(annual.balance)}
              </span>
            </div>
            <div className="panel-row">
              <span>月均支出</span>
              <span>{money(annual.monthlyAvg)}</span>
            </div>
            <div className="panel-row">
              <span>记录笔数</span>
              <span>{annual.count}</span>
            </div>
          </div>

          {annual.biggest && (
            <div className="panel">
              <div className="panel-title">最大一笔支出</div>
              <div className="panel-row">
                <span>
                  {getCategoryName(categories, 'expense', annual.biggest.category)}
                  {annual.biggest.note ? ` · ${annual.biggest.note}` : ''}
                </span>
                <span className="expense">{money(annual.biggest.amount)}</span>
              </div>
              <div className="panel-text">{annual.biggest.date}</div>
            </div>
          )}

          {annual.topCat && (
            <div className="panel">
              <div className="panel-title">最烧钱的分类</div>
              <div className="panel-row">
                <span>{annual.topCat.name}</span>
                <span className="expense">{money(annual.topCat.value)}</span>
              </div>
              <div className="panel-text">
                占全年支出{' '}
                {annual.expense > 0
                  ? ((annual.topCat.value / annual.expense) * 100).toFixed(1)
                  : '0'}
                %
              </div>
            </div>
          )}

          {annual.count === 0 && (
            <div className="empty">
              <div className="empty-title">{year} 年还没有记录</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
