// 负债数据层：本地存储 + 三种计息模式的计算。
// 所有数字只在本地算，不联网。

const DEBT_KEY = 'money-tracker-debts-v1'

export const DEBT_TYPES = [
  { id: 'mortgage', name: '房贷' },
  { id: 'car', name: '车贷' },
  { id: 'online', name: '网贷' },
  { id: 'friend', name: '亲友借款' },
  { id: 'other', name: '其他' },
]

export function getDebtTypeName(id) {
  const hit = DEBT_TYPES.find((t) => t.id === id)
  return hit ? hit.name : '其他'
}

/* ---------- 存储 ---------- */

export function loadDebts() {
  try {
    const raw = localStorage.getItem(DEBT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('读取负债失败', e)
    return []
  }
}

export function saveDebts(debts) {
  localStorage.setItem(DEBT_KEY, JSON.stringify(debts))
}

/* ---------- 计算 ---------- */

const DAY_MS = 86400000

// 把数值限制在 [min, max]，顺带挡住浮点误差和 NaN
function clamp(v, min, max) {
  if (!Number.isFinite(v)) return min
  return Math.min(Math.max(v, min), max)
}

function daysBetween(fromStr, today) {
  if (!fromStr) return 0
  const from = new Date(`${fromStr}T00:00:00`)
  if (Number.isNaN(from.getTime())) return 0
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(Math.floor((to - from) / DAY_MS), 0)
}

/**
 * 计算一条负债的当前状态。
 * 返回的字段会因计息模式不同而有所缺省，UI 按需取用。
 */
export function calcDebt(debt, today = new Date()) {
  const principal = Number(debt.principal) || 0
  const rate = Number(debt.annualRate) || 0
  const paidPrincipal = Number(debt.paidPrincipal) || 0
  const paidInterest = Number(debt.paidInterest) || 0
  const mode = debt.interestMode || 'none'

  // 1. 不计息：纯台账
  if (mode === 'none') {
    const remainPrincipal = Math.max(principal - paidPrincipal, 0)
    return {
      mode,
      principal,
      paidPrincipal,
      remainPrincipal,
      remainInterest: 0,
      remainTotal: remainPrincipal,
      accruedInterest: 0,
      progress: principal > 0 ? clamp(paidPrincipal / principal, 0, 1) : 0,
    }
  }

  // 2. 单利：按天累计。利息 = 本金 × 年利率 × 天数 / 365
  if (mode === 'simple') {
    const days = daysBetween(debt.startDate, today)
    const accrued = (principal * (rate / 100) * days) / 365
    const remainInterest = Math.max(accrued - paidInterest, 0)
    const remainPrincipal = Math.max(principal - paidPrincipal, 0)
    return {
      mode,
      principal,
      paidPrincipal,
      days,
      accruedInterest: accrued,
      paidInterest,
      remainPrincipal,
      remainInterest,
      remainTotal: remainPrincipal + remainInterest,
      dailyInterest: (principal * (rate / 100)) / 365,
      progress: principal > 0 ? clamp(paidPrincipal / principal, 0, 1) : 0,
    }
  }

  // 3. 等额本息 / 等额本金
  const years = Number(debt.years) || 0
  const n = Math.round(years * 12)
  const paidMonths = Math.min(Number(debt.paidMonths) || 0, n)
  const method = debt.method || 'equalPayment'

  if (n <= 0) {
    const remainPrincipal = Math.max(principal - paidPrincipal, 0)
    return {
      mode,
      method,
      principal,
      paidPrincipal,
      remainPrincipal,
      remainTotal: remainPrincipal,
      months: 0,
      progress: principal > 0 ? clamp(paidPrincipal / principal, 0, 1) : 0,
    }
  }

  const i = rate / 100 / 12

  if (method === 'equalPrincipal') {
    // 等额本金：每月还固定本金 + 剩余本金产生的利息
    const monthlyPrincipal = principal / n
    const firstPayment = monthlyPrincipal + principal * i
    const lastPayment = monthlyPrincipal + monthlyPrincipal * i
    const totalInterest = (principal * i * (n + 1)) / 2
    const remainPrincipal = clamp(principal - monthlyPrincipal * paidMonths, 0, principal)
    const remainMonths = n - paidMonths
    // 剩余利息 = 未来每一期利息之和（剩余本金逐期递减）
    // i × Σ_{t=k}^{n-1} (P - P/n·t)，k = 已还期数
    const remainInterest =
      i * (principal * remainMonths - (monthlyPrincipal * (n - 1 + paidMonths) * remainMonths) / 2)
    return {
      mode,
      method,
      principal,
      paidPrincipal,
      months: n,
      paidMonths,
      remainMonths,
      monthly: firstPayment, // 首月最多，逐月递减
      firstPayment,
      lastPayment,
      monthlyPrincipal,
      totalInterest,
      remainPrincipal,
      remainInterest: Math.max(remainInterest, 0),
      remainTotal: remainPrincipal + Math.max(remainInterest, 0),
      progress: clamp(monthlyPrincipal * paidMonths / principal, 0, 1),
    }
  }

  // 等额本息：每月还款额固定
  let monthly = 0
  let totalInterest = 0
  let remainPrincipal = 0
  if (i === 0) {
    monthly = principal / n
    totalInterest = 0
    remainPrincipal = clamp(principal - monthly * paidMonths, 0, principal)
  } else {
    const pow = Math.pow(1 + i, n)
    monthly = (principal * i * pow) / (pow - 1)
    totalInterest = monthly * n - principal
    const powPaid = Math.pow(1 + i, paidMonths)
    remainPrincipal = clamp((principal * (pow - powPaid)) / (pow - 1), 0, principal)
  }
  const remainMonths = n - paidMonths
  // 未来还要掏出去的钱 = 月供 × 剩余期数，减去其中剩余本金即为剩余利息
  const remainTotal = remainMonths > 0 ? monthly * remainMonths : 0
  return {
    mode,
    method,
    principal,
    paidPrincipal,
    months: n,
    paidMonths,
    remainMonths,
    monthly,
    totalInterest,
    totalRepayment: principal + totalInterest,
    remainPrincipal,
    remainInterest: Math.max(remainTotal - remainPrincipal, 0),
    remainTotal,
    progress: clamp((principal - remainPrincipal) / principal, 0, 1),
  }
}

/* ---------- 汇总 ---------- */

export function summarizeDebts(debts, today = new Date()) {
  const rows = debts.map((d) => ({ debt: d, calc: calcDebt(d, today) }))
  const remainPrincipal = rows.reduce((s, r) => s + r.calc.remainPrincipal, 0)
  const remainTotal = rows.reduce((s, r) => s + (r.calc.remainTotal || 0), 0)
  const monthly = rows.reduce((s, r) => s + (r.calc.monthly || 0), 0)
  const principal = rows.reduce((s, r) => s + r.calc.principal, 0)
  const remainInterest = rows.reduce((s, r) => s + (r.calc.remainInterest || 0), 0)
  return { rows, remainPrincipal, remainTotal, monthly, principal, remainInterest }
}
