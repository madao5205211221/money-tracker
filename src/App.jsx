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
  return `${y} 年 ${Number(m)} 月`
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
    return { income, expense, balance: income - expense }
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
      <header className="header">
        <div className="month-nav">
          <button className="month-btn" onClick={() => setMonth(shiftMonth(month, -1))}>
            ‹
          </button>
          <span className="month-label">{formatMonthLabel(month)}</span>
          <button className="month-btn" onClick={() => setMonth(shiftMonth(month, 1))}>
            ›
          </button>
        </div>
        <div className="summary-card">
          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">支出</span>
              <span className="summary-value expense">{money(summary.expense)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">收入</span>
              <span className="summary-value income">{money(summary.income)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">结余</span>
              <span className={`summary-value ${summary.balance >= 0 ? 'income' : 'expense'}`}>
                {money(summary.balance)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="content">
        {tab === 'list' && <RecordList records={monthRecords} onDelete={handleDelete} />}
        {tab === 'stats' && <Stats records={monthRecords} />}
        {tab === 'settings' && (
          <Settings records={records} onImport={handleImport} onClear={handleClear} />
        )}
      </main>

      {tab === 'list' && (
        <button className="fab" onClick={() => setFormOpen(true)}>
          ＋ 记一笔
        </button>
      )}

      <nav className="tabbar">
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
          明细
        </button>
        <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          统计
        </button>
        <button
          className={`tab ${tab === 'settings' ? 'active' : ''}`}
          onClick={() => setTab('settings')}
        >
          备份
        </button>
      </nav>

      {formOpen && <RecordForm onClose={() => setFormOpen(false)} onSubmit={handleAdd} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
