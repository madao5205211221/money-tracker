import React, { useMemo, useState } from 'react'
import RecordForm from './components/RecordForm'
import RecordList from './components/RecordList'
import Stats from './components/Stats'
import Settings from './components/Settings'
import {
  addRecord,
  deleteRecord,
  loadRecords,
  saveRecords,
} from './lib/storage'

const ICONS = {
  list: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  ),
  stats: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 20V11M12 20V5M19 20v-6" />
    </svg>
  ),
  settings: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16v3H4z" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 14h4" />
    </svg>
  ),
}

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(month) {
  const [y, m] = month.split('-')
  return `${y}年${Number(m)}月`
}

export default function App() {
  const [records, setRecords] = useState(() => loadRecords())
  const [month, setMonth] = useState(currentMonth())
  const [tab, setTab] = useState('list')
  const [formOpen, setFormOpen] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (text) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 1800)
  }

  const monthRecords = useMemo(
    () => records.filter((r) => String(r.date).slice(0, 7) === month),
    [records, month]
  )

  const summary = useMemo(() => {
    let income = 0
    let expense = 0
    for (const r of monthRecords) {
      if (r.type === 'income') income += Number(r.amount) || 0
      else expense += Number(r.amount) || 0
    }
    return { income, expense, balance: income - expense, count: monthRecords.length }
  }, [monthRecords])

  const handleAdd = (record) => {
    setRecords((prev) => addRecord(prev, record))
    setFormOpen(false)
    showToast(`已记一笔 ${record.type === 'income' ? '收入' : '支出'} ${record.amount}`)
  }

  const handleDelete = (id) => {
    setRecords((prev) => deleteRecord(prev, id))
    showToast('已删除')
  }

  const handleImport = (incoming) => {
    const merged = [...incoming, ...records]
    saveRecords(merged)
    setRecords(merged)
    showToast(`已导入 ${incoming.length} 条`)
  }

  const handleClear = () => {
    saveRecords([])
    setRecords([])
    showToast('已清空')
  }

  const money = (n) =>
    (Math.round(n * 100) / 100).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-inner">
          <div className="nav-month">
            <button className="month-arrow" onClick={() => setMonth(shiftMonth(month, -1))}>
              ‹
            </button>
            <span className="month-text">{formatMonthLabel(month)}</span>
            <button className="month-arrow" onClick={() => setMonth(shiftMonth(month, 1))}>
              ›
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="page-title">本月结余</div>
        <div className="hero">
          <div className="hero-amount num">
            <span className={summary.balance >= 0 ? 'amount-in' : 'amount-out'}>
              ¥ {money(summary.balance)}
            </span>
          </div>
        </div>

        <div className="group summary">
          <div className="summary-cell">
            <div className="summary-cap">支出</div>
            <div className="summary-num num amount-out">{money(summary.expense)}</div>
          </div>
          <div className="summary-cell">
            <div className="summary-cap">收入</div>
            <div className="summary-num num amount-in">{money(summary.income)}</div>
          </div>
          <div className="summary-cell">
            <div className="summary-cap">笔数</div>
            <div className="summary-num num">{summary.count}</div>
          </div>
        </div>

        {tab === 'list' && (
          <RecordList records={monthRecords} onDelete={handleDelete} />
        )}
        {tab === 'stats' && <Stats records={monthRecords} />}
        {tab === 'settings' && (
          <Settings records={records} onImport={handleImport} onClear={handleClear} />
        )}
      </main>

      {tab === 'list' && (
        <button className="fab" onClick={() => setFormOpen(true)} aria-label="记一笔">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}

      <nav className="tabbar">
        {[
          ['list', '明细'],
          ['stats', '统计'],
          ['settings', '备份'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab ${tab === key ? 'active' : ''}`}
            onClick={() => setTab(key)}
          >
            {ICONS[key]}
            <span className="tab-text">{label}</span>
          </button>
        ))}
      </nav>

      {formOpen && <RecordForm onClose={() => setFormOpen(false)} onSubmit={handleAdd} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
