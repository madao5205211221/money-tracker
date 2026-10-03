import React, { useState } from 'react'
import { CATEGORIES } from '../lib/storage'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

export default function RecordForm({ onClose, onSubmit }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())
  const [error, setError] = useState('')

  const cats = CATEGORIES[type]

  const switchType = (next) => {
    setType(next)
    setCategory(CATEGORIES[next][0].id)
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
  }

  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />

        <div className="sheet-nav">
          <button className="sheet-nav-btn" onClick={onClose}>
            取消
          </button>
          <span className="sheet-nav-title">记一笔</span>
          <button className="sheet-nav-btn right" onClick={submit}>
            保存
          </button>
        </div>

        <div className="sheet-body">
          <div className="amount-block">
            <span className="currency">¥</span>
            <input
              className="amount-input num"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                if (error) setError('')
              }}
            />
          </div>

          {error && <div className="field-error">{error}</div>}

          <div className="segment">
            <button
              className={`segment-btn ${type === 'expense' ? 'on exp' : ''}`}
              onClick={() => switchType('expense')}
            >
              支出
            </button>
            <button
              className={`segment-btn ${type === 'income' ? 'on inc' : ''}`}
              onClick={() => switchType('income')}
            >
              收入
            </button>
          </div>

          <div className="group">
            <div className="cat-grid">
              {cats.map((c) => (
                <button
                  key={c.id}
                  className={`cat-item ${category === c.id ? 'on' : ''}`}
                  onClick={() => setCategory(c.id)}
                >
                  <span
                    className="cat-circle"
                    style={{ background: c.color }}
                  >
                    {c.name.slice(0, 1)}
                  </span>
                  <span className="cat-name">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="group">
            <div className="row">
              <span className="row-label">日期</span>
              <input
                className="text-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ flex: 1, textAlign: 'right', color: '#8E8E93' }}
              />
            </div>
            <div className="row">
              <span className="row-label" style={{ flex: 'none', width: 60 }}>
                备注
              </span>
              <input
                className="text-input"
                type="text"
                placeholder="选填，比如 午饭 牛肉面"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
