import React, { useState } from 'react'
import DatePicker from './DatePicker'
import NumericKeypad from './NumericKeypad'

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
  const [keypadOpen, setKeypadOpen] = useState(true) // 一进来就先把数字键盘摆好

  const cats = categories[type]

  const switchType = (next) => {
    setType(next)
    setCategory(categories[next][0].id)
  }

  // 应用内数字键盘：金额不再走系统输入法，
  // 输入法就不会在「数字模式 / 文本模式」之间来回切，备注栏打拼音也就正常了
  const handleKey = (k) => {
    if (k === 'done') {
      setKeypadOpen(false)
      return
    }
    if (error) setError('')
    setAmount((prev) => {
      if (k === 'del') return prev.slice(0, -1)
      if (k === 'dot') {
        if (prev.includes('.')) return prev
        return prev === '' ? '0.' : `${prev}.`
      }
      // 数字键
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev // 小数最多两位
      if (prev.replace('.', '').length >= 9) return prev // 位数上限，防止溢出
      if (prev === '0') return k // 避免出现 05
      return prev + k
    })
  }

  const submit = () => {
    const raw = String(amount).trim().replace(/[，,\s]/g, '')
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
      <div className="sheet sheet--pad" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sheet-title">记一笔</span>
          <button className="sheet-close" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="sheet-body">
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
              className={`amount-input ${keypadOpen ? 'picking' : ''}`}
              type="text"
              inputMode="none"
              readOnly
              placeholder="0.00"
              value={amount}
              onClick={() => setKeypadOpen(true)}
              onFocus={() => setKeypadOpen(true)}
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

          {/* 点日期区时收起数字键盘，给月历腾地方 */}
          <div className="field" onClickCapture={() => setKeypadOpen(false)}>
            <label className="field-label">日期</label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="field">
            <label className="field-label">备注（可选）</label>
            <input
              className="text-input"
              type="text"
              inputMode="text"
              placeholder="比如：午饭 牛肉面"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onFocus={() => setKeypadOpen(false)}
            />
          </div>
        </div>

        {/* 保存按钮固定在键盘上方，不用滚动就能点到 */}
        <div className="sheet-foot">
          <button className="primary-btn" onClick={submit}>
            保存
          </button>
        </div>

        {keypadOpen && <NumericKeypad onKey={handleKey} />}
      </div>
    </div>
  )
}
