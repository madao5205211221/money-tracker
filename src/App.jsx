import React, { useMemo, useState } from 'react'
import RecordForm from './components/RecordForm'
import RecordList from './components/RecordList'
import Stats from './components/Stats'
import Settings from './components/Settings'
import {
  addRecord,
  deleteRecord,
  getCategoryName,
  loadBudget,
  loadCategories,
  loadRecords,
  saveBudget,
  saveCategories,
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
  const [categories, setCategories] = useState(() => loadCategories())
  const [budget, setBudget] = useState(() => loadBudget())
  const [month, setMonth] = useState(currentMonth())
  const [tab, setTab] = useState('list')
  const [formOpen, setFormOpen] = useState(false)
  const [toast, setToast] = useState('')

  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [budgetEditing, setBudgetEditing] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

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

  const searching = query.trim() !== '' || filterType !== 'all' || filterCat !== 'all'

  const listRecords = useMemo(() => {
    if (!searching) return monthRecords
    const kw = query.trim().toLowerCase()
    return records.filter((r) => {
      if (filterType !== 'all' && r.type !== filterType) return false
      if (filterCat !== 'all' && r.category !== filterCat) return false
      if (kw) {
        const catName = getCategoryName(categories, r.type, r.category)
        const hay = `${r.note || ''} ${catName} ${r.amount}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
  }, [searching, records, monthRecords, query, filterType, filterCat, categories])

  const clearFilters = () => {
    setQuery('')
    setFilterType('all')
    setFilterCat('all')
  }

  const handleAdd = (record) => {
    setRecords((prev) => addRecord(prev, record))
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

  const handleCategoriesChange = (next) => {
    saveCategories(next)
    setCategories(next)
    showToast('分类已保存')
  }

  const commitBudget = () => {
    const raw = String(budgetInput).trim().replace(/[，,\s]/g, '')
    const value = Number(raw)
    if (raw === '' || !Number.isFinite(value) || value < 0) {
      showToast('请输入正确的预算金额')
      return
    }
    saveBudget(value)
    setBudget(value)
    setBudgetEditing(false)
    showToast(value === 0 ? '已取消预算' : '预算已保存')
  }

  const money = (n) =>
    (Math.round(n * 100) / 100).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const used = summary.expense
  const pct = budget > 0 ? (used / budget) * 100 : 0
  const over = budget > 0 && used > budget
  const warn = budget > 0 && !over && pct >= 80
  const barColor = over ? '#E24B4A' : warn ? '#BA7517' : '#1D9E75'

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
        {tab === 'list' && (
          <>
            <div className="budget-card">
              <div className="budget-view">
                <div className="budget-top">
                  <span className="budget-title">{budget > 0 ? '本月预算' : '还没设预算'}</span>
                  {!budgetEditing && (
                    <button
                      className="budget-edit"
                      onClick={() => {
                        setBudgetInput(budget > 0 ? String(budget) : '')
                        setBudgetEditing(true)
                      }}
                    >
                      {budget > 0 ? '修改' : '设置'}
                    </button>
                  )}
                </div>
                {budgetEditing ? (
                  <>
                    <input
                      className="text-input"
                      type="text"
                      inputMode="decimal"
                      placeholder="输入金额，填 0 表示不设预算"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                    />
                    <div className="budget-actions">
                      <button className="mini-btn" onClick={() => setBudgetEditing(false)}>
                        取消
                      </button>
                      <button className="mini-btn primary" onClick={commitBudget}>
                        保存
                      </button>
                    </div>
                  </>
                ) : budget > 0 ? (
                  <>
                    <div className="budget-bar">
                      <div
                        className="budget-fill"
                        style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
                      />
                    </div>
                    <div className="budget-meta">
                      <span>
                        已用 {money(used)} / {money(budget)}
                      </span>
                      <span style={{ color: barColor, fontWeight: 500 }}>
                        {over ? `超支 ${money(used - budget)}` : `还剩 ${money(budget - used)}`}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="budget-meta">
                    <span>设一个月度上限，超支时进度条会变红</span>
                  </div>
                )}
              </div>
            </div>

            <div className="search-bar">
              <input
                className="text-input"
                type="text"
                placeholder="搜备注、分类或金额"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {searching && (
                <button className="mini-btn" onClick={clearFilters}>
                  清除
                </button>
              )}
            </div>

            <div className="filter-row">
              {[
                ['all', '全部'],
                ['expense', '支出'],
                ['income', '收入'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={`filter-chip ${filterType === key ? 'on' : ''}`}
                  onClick={() => setFilterType(key)}
                >
                  {label}
                </button>
              ))}
              <select
                className="filter-select"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
              >
                <option value="all">全部分类</option>
                {[...categories.expense, ...categories.income].map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {searching && (
              <div className="search-note">筛选结果 {listRecords.length} 笔（不限月份）</div>
            )}

            <RecordList
              records={listRecords}
              categories={categories}
              onDelete={handleDelete}
              searching={searching}
            />
          </>
        )}

        {tab === 'stats' && (
          <Stats monthRecords={monthRecords} allRecords={records} categories={categories} />
        )}

        {tab === 'settings' && (
          <Settings
            records={records}
            categories={categories}
            onCategoriesChange={handleCategoriesChange}
            onImport={handleImport}
            onClear={handleClear}
          />
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
          设置
        </button>
      </nav>

      {formOpen && (
        <RecordForm categories={categories} onClose={() => setFormOpen(false)} onSubmit={handleAdd} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
