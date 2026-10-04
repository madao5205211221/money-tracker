import React, { useState } from 'react'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

export default function RecordForm({ categories, onClose, onSubmit }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(() => categories.expense[0].id)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())
  const [error, setError] = useState('')

  const cats = categories[type]

  const switchType = (next) => {
    setType(next)
    setCategory(categories[next][0].id)
  }

  const submit = () => {
    const raw = String(amount)
      .trim()
      .replace(/[，,\s]/g, '')
      .replace(/。/g, '.')
    const value = Number(raw)
    if (!raw) {
      setError('请先输入金额')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('金额需要是大于 0 的数字')
      return
    }
    if (!date) {
      setError('请选择日期')
      return
    }
    setError('')
    onSubmit({ type, amount: value, category, note, date })
    // 一笔一记：保存后直接关掉，不再停留在表单里
    onClose()
  }

  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sheet-title">记一笔</span>
          <button className="sheet-close" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="type-switch">
          <button
            className={`type-btn ${type === 'expense' ? 'on-expense' : ''}`}
            onClick={() => switchType('expense')}
          >
            支出
          </button>
          <button
            className={`type-btn ${type === 'income' ? 'on-income' : ''}`}
            onClick={() => switchType('income')}
          >
            收入
          </button>
        </div>

        <div className="field">
          <label className="field-label">金额</label>
          <input
            className="amount-input"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              if (error) setError('')
            }}
          />
          {error && <div className="field-error">{error}</div>}
        </div>

        <div className="field">
          <label className="field-label">分类</label>
          <div className="cat-grid">
            {cats.map((c) => (
              <button
                key={c.id}
                className="cat-chip"
                style={
                  category === c.id
                    ? { background: c.color, borderColor: c.color, color: '#fff' }
                    : null
                }
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">日期</label>
          <input
            className="text-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label">备注（可选）</label>
          <input
            className="text-input"
            type="text"
            placeholder="比如：午饭 牛肉面"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button className="primary-btn" onClick={submit}>
          保存
        </button>
      </div>
    </div>
  )
}
