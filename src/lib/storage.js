// 数据存储层：所有记账数据存在手机/浏览器本地，不联网。
// 对外提供：记录增删改查、导出导入、分类配置、预算配置。

const STORAGE_KEY = 'money-tracker-records-v1'
const CAT_KEY = 'money-tracker-categories-v1'
const BUDGET_KEY = 'money-tracker-budget-v1'

export const DEFAULT_CATEGORIES = {
  expense: [
    { id: 'food', name: '餐饮', color: '#D85A30' },
    { id: 'transport', name: '交通', color: '#378ADD' },
    { id: 'shopping', name: '购物', color: '#D4537E' },
    { id: 'housing', name: '居住', color: '#BA7517' },
    { id: 'fun', name: '娱乐', color: '#7F77DD' },
    { id: 'medical', name: '医疗', color: '#1D9E75' },
    { id: 'other_exp', name: '其他', color: '#888780' },
  ],
  income: [
    { id: 'salary', name: '工资', color: '#1D9E75' },
    { id: 'parttime', name: '兼职', color: '#639922' },
    { id: 'invest', name: '理财', color: '#378ADD' },
    { id: 'other_inc', name: '其他', color: '#888780' },
  ],
}

export const COLOR_CHOICES = [
  '#D85A30',
  '#378ADD',
  '#D4537E',
  '#BA7517',
  '#7F77DD',
  '#1D9E75',
  '#639922',
  '#888780',
]

export function getCategoryName(cats, type, id) {
  const list = (cats && cats[type]) || DEFAULT_CATEGORIES[type] || []
  const hit = list.find((c) => c.id === id)
  return hit ? hit.name : '其他'
}

export function getCategoryColor(cats, type, id) {
  const list = (cats && cats[type]) || DEFAULT_CATEGORIES[type] || []
  const hit = list.find((c) => c.id === id)
  return hit ? hit.color : '#888780'
}

/* ---------- 分类配置 ---------- */

export function loadCategories() {
  try {
    const raw = localStorage.getItem(CAT_KEY)
    if (!raw) return DEFAULT_CATEGORIES
    const parsed = JSON.parse(raw)
    return {
      expense: Array.isArray(parsed.expense) && parsed.expense.length
        ? parsed.expense
        : DEFAULT_CATEGORIES.expense,
      income: Array.isArray(parsed.income) && parsed.income.length
        ? parsed.income
        : DEFAULT_CATEGORIES.income,
    }
  } catch (e) {
    console.error('读取分类失败，回退默认', e)
    return DEFAULT_CATEGORIES
  }
}

export function saveCategories(cats) {
  localStorage.setItem(CAT_KEY, JSON.stringify(cats))
}

/* ---------- 预算 ---------- */

export function loadBudget() {
  try {
    const raw = localStorage.getItem(BUDGET_KEY)
    if (raw === null) return 0
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch (e) {
    return 0
  }
}

export function saveBudget(value) {
  localStorage.setItem(BUDGET_KEY, String(value))
}

/* ---------- 记录 ---------- */

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('读取本地数据失败', e)
    return []
  }
}

export function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function addRecord(records, record) {
  const next = [
    {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      type: record.type,
      amount: Number(record.amount),
      category: record.category,
      note: record.note || '',
      date: record.date,
      createdAt: Date.now(),
    },
    ...records,
  ]
  saveRecords(next)
  return next
}

export function deleteRecord(records, id) {
  const next = records.filter((r) => r.id !== id)
  saveRecords(next)
  return next
}

export function exportToFile(records) {
  const payload = {
    app: 'money-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `记账备份-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const list = Array.isArray(parsed) ? parsed : parsed.records
        if (!Array.isArray(list)) {
          reject(new Error('文件格式不对，找不到记录列表'))
          return
        }
        const clean = list
          .filter((r) => r && r.amount && r.date)
          .map((r) => ({
            id: r.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            type: r.type === 'income' ? 'income' : 'expense',
            amount: Number(r.amount) || 0,
            category: r.category || 'other_exp',
            note: r.note || '',
            date: String(r.date).slice(0, 10),
            createdAt: r.createdAt || Date.now(),
          }))
        resolve(clean)
      } catch (e) {
        reject(new Error('解析失败，文件可能不是有效的备份'))
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file)
  })
}
