import React, { useMemo, useState } from 'react'
import DebtForm from './DebtForm'
import { calcDebt, getDebtTypeName, summarizeDebts } from '../lib/debts'

function fmt(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmt0(n) {
  return Math.round(Number(n) || 0).toLocaleString('zh-CN')
}

export default function Debts({ debts, onSave, onToast }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [payTarget, setPayTarget] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMonths, setPayMonths] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  const summary = useMemo(() => summarizeDebts(debts), [debts])

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (debt) => {
    setEditing(debt)
    setFormOpen(true)
  }

  const handleSubmit = (data) => {
    if (data.id) {
      onSave(debts.map((d) => (d.id === data.id ? { ...d, ...data } : d)))
    } else {
      onSave([
        ...debts,
        {
          ...data,
          id: 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          createdAt: Date.now(),
        },
      ])
    }
    setFormOpen(false)
    setEditing(null)
    onToast('已保存')
  }

  const remove = (id) => {
    onSave(debts.filter((d) => d.id !== id))
    setConfirmId(null)
    onToast('已删除')
  }

  const openPay = (row) => {
    setPayTarget(row)
    setPayAmount('')
    setPayMonths(String(row.debt.paidMonths || 0))
  }

  const doPay = () => {
    const d = payTarget.debt
    const c = payTarget.calc
    let next
    if (c.mode === 'installment') {
      const m = Number(payMonths)
      if (!Number.isFinite(m) || m < 0) {
        onToast('请输入正确的期数')
        return
      }
      next = debts.map((x) =>
        x.id === d.id ? { ...x, paidMonths: Math.min(Math.round(m), c.months) } : x
      )
    } else {
      const amt = Number(String(payAmount).replace(/[，,\s]/g, ''))
      if (!Number.isFinite(amt) || amt <= 0) {
        onToast('请输入大于 0 的还款金额')
        return
      }
      if (c.mode === 'simple') {
        // 先抵扣已产生的利息，剩下的才算还本金
        const payInt = Math.min(amt, c.remainInterest)
        next = debts.map((x) =>
          x.id === d.id
            ? {
                ...x,
                paidInterest: (Number(x.paidInterest) || 0) + payInt,
                paidPrincipal: (Number(x.paidPrincipal) || 0) + (amt - payInt),
              }
            : x
        )
      } else {
        next = debts.map((x) =>
          x.id === d.id ? { ...x, paidPrincipal: (Number(x.paidPrincipal) || 0) + amt } : x
        )
      }
    }
    onSave(next)
    setPayTarget(null)
    onToast('已记录还款')
  }

  return (
    <div className="debts">
      <div className="debt-summary">
        <div className="debt-sum-row">
          <div className="debt-sum-cell">
            <div className="debt-sum-cap">还要还</div>
            <div className="debt-sum-num expense">{fmt(summary.remainTotal)}</div>
          </div>
          <div className="debt-sum-cell">
            <div className="debt-sum-cap">剩余本金</div>
            <div className="debt-sum-num">{fmt(summary.remainPrincipal)}</div>
          </div>
        </div>
        <div className="debt-sum-row">
          <div className="debt-sum-cell">
            <div className="debt-sum-cap">每月还款</div>
            <div className="debt-sum-num">{fmt(summary.monthly)}</div>
          </div>
          <div className="debt-sum-cell">
            <div className="debt-sum-cap">待付利息</div>
            <div className="debt-sum-num">{fmt(summary.remainInterest)}</div>
          </div>
        </div>
      </div>

      {debts.length === 0 ? (
        <div className="empty">
          <div className="empty-title">还没有记录负债</div>
          <div className="empty-hint">点右下角「＋ 添加负债」开始</div>
        </div>
      ) : (
        summary.rows.map(({ debt, calc }) => (
          <div className="debt-card" key={debt.id}>
            <div className="debt-head">
              <span className="debt-name">{debt.name}</span>
              <span className="debt-type">{getDebtTypeName(debt.type)}</span>
            </div>

            <div className="debt-remain">
              {calc.mode === 'installment' ? '剩余本金 ' : '还剩 '}
              <span className="expense">{fmt(calc.remainPrincipal)}</span>
            </div>

            <div className="budget-bar">
              <div
                className="budget-fill"
                style={{
                  width: `${Math.min(calc.progress * 100, 100)}%`,
                  background: 'var(--theme, #0f6e56)',
                }}
              />
            </div>
            <div className="debt-progress-text">
              已还 {(calc.progress * 100).toFixed(1)}%
            </div>

            {calc.mode === 'none' && (
              <div className="debt-lines">
                <div className="panel-row">
                  <span>本金</span>
                  <span>{fmt(calc.principal)}</span>
                </div>
                <div className="panel-row">
                  <span>已还</span>
                  <span>{fmt(calc.paidPrincipal)}</span>
                </div>
              </div>
            )}

            {calc.mode === 'simple' && (
              <div className="debt-lines">
                <div className="panel-row">
                  <span>本金 / 年利率</span>
                  <span>
                    {fmt(calc.principal)} · {debt.annualRate}%
                  </span>
                </div>
                <div className="panel-row">
                  <span>已计息 {calc.days} 天</span>
                  <span>日均利息 {calc.dailyInterest.toFixed(2)}</span>
                </div>
                <div className="panel-row">
                  <span>已产生利息</span>
                  <span>{fmt(calc.accruedInterest)}</span>
                </div>
                <div className="panel-row">
                  <span>未付利息</span>
                  <span className="expense">{fmt(calc.remainInterest)}</span>
                </div>
                <div className="panel-row">
                  <span>连本带利还剩</span>
                  <span className="expense">{fmt(calc.remainTotal)}</span>
                </div>
              </div>
            )}

            {calc.mode === 'installment' && (
              <div className="debt-lines">
                <div className="panel-row">
                  <span>本金 / 年利率</span>
                  <span>
                    {fmt(calc.principal)} · {debt.annualRate}%
                  </span>
                </div>
                <div className="panel-row">
                  <span>{calc.method === 'equalPrincipal' ? '首月 / 末月' : '每月月供'}</span>
                  <span>
                    {calc.method === 'equalPrincipal'
                      ? `${fmt(calc.firstPayment)} → ${fmt(calc.lastPayment)}`
                      : fmt(calc.monthly)}
                  </span>
                </div>
                <div className="panel-row">
                  <span>已还期数</span>
                  <span>
                    {calc.paidMonths} / {calc.months} 期
                  </span>
                </div>
                <div className="panel-row">
                  <span>总利息</span>
                  <span>{fmt(calc.totalInterest)}</span>
                </div>
                <div className="panel-row">
                  <span>剩余利息</span>
                  <span className="expense">{fmt(calc.remainInterest)}</span>
                </div>
              </div>
            )}

            {debt.note && <div className="debt-note">{debt.note}</div>}

            <div className="debt-actions">
              <button className="mini-btn primary" onClick={() => openPay({ debt, calc })}>
                还款
              </button>
              <button className="mini-btn" onClick={() => openEdit(debt)}>
                编辑
              </button>
              {confirmId === debt.id ? (
                <>
                  <button className="mini-btn" onClick={() => setConfirmId(null)}>
                    取消
                  </button>
                  <button className="mini-btn danger" onClick={() => remove(debt.id)}>
                    确认
                  </button>
                </>
              ) : (
                <button className="mini-btn danger" onClick={() => setConfirmId(debt.id)}>
                  删除
                </button>
              )}
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={openAdd}>
        ＋ 添加负债
      </button>

      {formOpen && (
        <DebtForm
          initial={editing}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSubmit={handleSubmit}
        />
      )}

      {payTarget && (
        <div className="sheet-mask" onClick={() => setPayTarget(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <span className="sheet-title">记录还款 · {payTarget.debt.name}</span>
              <button className="sheet-close" onClick={() => setPayTarget(null)}>
                关闭
              </button>
            </div>

            {payTarget.calc.mode === 'installment' ? (
              <>
                <div className="field">
                  <label className="field-label">已还期数（总共 {payTarget.calc.months} 期）</label>
                  <input
                    className="text-input"
                    type="text"
                    inputMode="numeric"
                    value={payMonths}
                    onChange={(e) => setPayMonths(e.target.value)}
                  />
                  <div className="field-hint">每还一个月就 +1，剩余本金会自动重算</div>
                </div>
                <button
                  className="ghost-btn"
                  onClick={() => setPayMonths(String((Number(payMonths) || 0) + 1))}
                >
                  ＋ 还了一期
                </button>
              </>
            ) : (
              <>
                <div className="field">
                  <label className="field-label">本次还款金额</label>
                  <input
                    className="text-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  {payTarget.calc.mode === 'simple' && (
                    <div className="field-hint">
                      还款会先抵扣已产生的利息（当前未付 {fmt(payTarget.calc.remainInterest)}），
                      剩下的才算还本金
                    </div>
                  )}
                </div>
                <button
                  className="ghost-btn"
                  onClick={() => setPayAmount(String(Math.round(payTarget.calc.remainTotal)))}
                >
                  一次性还清（{fmt0(payTarget.calc.remainTotal)}）
                </button>
              </>
            )}

            <button className="primary-btn" onClick={doPay}>
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
