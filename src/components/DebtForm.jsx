import React, { useState } from 'react'
import { DEBT_TYPES } from '../lib/debts'
import DatePicker from './DatePicker'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

const MODES = [
  ['none', '不计息'],
  ['simple', '按天计息'],
  ['installment', '分期贷款'],
]

export default function DebtForm({ initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial?.name || '')
  const [type, setType] = useState(initial?.type || 'mortgage')
  const [principal, setPrincipal] = useState(initial?.principal ?? '')
  const [interestMode, setInterestMode] = useState(initial?.interestMode || 'installment')
  const [annualRate, setAnnualRate] = useState(initial?.annualRate ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate || todayStr())
  const [years, setYears] = useState(initial?.years ?? 30)
  const [method, setMethod] = useState(initial?.method || 'equalPayment')
  const [paidPrincipal, setPaidPrincipal] = useState(initial?.paidPrincipal ?? 0)
  const [paidInterest, setPaidInterest] = useState(initial?.paidInterest ?? 0)
  const [paidMonths, setPaidMonths] = useState(initial?.paidMonths ?? 0)
  const [note, setNote] = useState(initial?.note || '')
  const [error, setError] = useState('')

  const submit = () => {
    const p = Number(String(principal).toString().replace(/[，,\s]/g, ''))
    if (!name.trim()) {
      setError('请填名称，比如「招行房贷」')
      return
    }
    if (!Number.isFinite(p) || p <= 0) {
      setError('请输入大于 0 的欠款金额')
      return
    }
    setError('')
    onSubmit({
      id: initial?.id,
      name: name.trim(),
      type,
      principal: p,
      interestMode,
      annualRate: interestMode === 'none' ? 0 : Number(annualRate) || 0,
      startDate: interestMode === 'simple' ? startDate : '',
      years: interestMode === 'installment' ? Number(years) || 0 : 0,
      method: interestMode === 'installment' ? method : '',
      paidPrincipal: interestMode === 'installment' ? 0 : Number(paidPrincipal) || 0,
      paidInterest: interestMode === 'simple' ? Number(paidInterest) || 0 : 0,
      paidMonths: interestMode === 'installment' ? Number(paidMonths) || 0 : 0,
      note: note.trim(),
    })
  }

  return (
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span className="sheet-title">{initial ? '编辑负债' : '新增负债'}</span>
          <button className="sheet-close" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="field">
          <label className="field-label">名称</label>
          <input
            className="text-input"
            type="text"
            inputMode="text"
            placeholder="比如：招行房贷 / 欠表哥"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
          />
        </div>

        <div className="field">
          <label className="field-label">类型</label>
          <div className="cat-grid">
            {DEBT_TYPES.map((t) => (
              <button
                key={t.id}
                className="cat-chip"
                style={
                  type === t.id
                    ? { background: '#0f6e56', borderColor: '#0f6e56', color: '#fff' }
                    : null
                }
                onClick={() => setType(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">欠款金额（本金）</label>
          <input
            className="text-input"
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={principal}
            onChange={(e) => {
              setPrincipal(e.target.value)
              if (error) setError('')
            }}
          />
        </div>

        <div className="field">
          <label className="field-label">计息方式</label>
          <div className="type-switch">
            {MODES.map(([key, label]) => (
              <button
                key={key}
                className={`type-btn ${interestMode === key ? 'on-income' : ''}`}
                onClick={() => setInterestMode(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {interestMode !== 'none' && (
          <div className="field">
            <label className="field-label">年利率（%）</label>
            <input
              className="text-input"
              type="text"
              inputMode="decimal"
              placeholder="比如 4.2"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
            />
          </div>
        )}

        {interestMode === 'simple' && (
          <>
            <div className="field">
              <label className="field-label">起息日</label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div className="field">
              <label className="field-label">已还本金</label>
              <input
                className="text-input"
                type="text"
                inputMode="decimal"
                value={paidPrincipal}
                onChange={(e) => setPaidPrincipal(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">已付利息</label>
              <input
                className="text-input"
                type="text"
                inputMode="decimal"
                value={paidInterest}
                onChange={(e) => setPaidInterest(e.target.value)}
              />
            </div>
          </>
        )}

        {interestMode === 'installment' && (
          <>
            <div className="field">
              <label className="field-label">贷款年限</label>
              <input
                className="text-input"
                type="text"
                inputMode="numeric"
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">还款方式</label>
              <div className="type-switch">
                <button
                  className={`type-btn ${method === 'equalPayment' ? 'on-income' : ''}`}
                  onClick={() => setMethod('equalPayment')}
                >
                  等额本息
                </button>
                <button
                  className={`type-btn ${method === 'equalPrincipal' ? 'on-income' : ''}`}
                  onClick={() => setMethod('equalPrincipal')}
                >
                  等额本金
                </button>
              </div>
              <div className="field-hint">
                等额本息：每月还一样多；等额本金：每月递减，总利息更少
              </div>
            </div>
            <div className="field">
              <label className="field-label">已还期数（月）</label>
              <input
                className="text-input"
                type="text"
                inputMode="numeric"
                value={paidMonths}
                onChange={(e) => setPaidMonths(e.target.value)}
              />
            </div>
          </>
        )}

        {interestMode === 'none' && (
          <div className="field">
            <label className="field-label">已还金额</label>
            <input
              className="text-input"
              type="text"
              inputMode="decimal"
              value={paidPrincipal}
              onChange={(e) => setPaidPrincipal(e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <label className="field-label">备注（可选）</label>
          <input
            className="text-input"
            type="text"
            inputMode="text"
            placeholder="比如：每月 10 号扣款"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <div className="field-error" style={{ marginBottom: 10 }}>{error}</div>}

        <button className="primary-btn" onClick={submit}>
          保存
        </button>
      </div>
    </div>
  )
}
