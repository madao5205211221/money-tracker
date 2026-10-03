// 主题：把主色和正向色写成 CSS 变量，换色时不用改样式表。
// 关键点是「主色上的文字颜色」要根据明暗自动切换，否则浅色主题会看不清。

const THEME_KEY = 'money-tracker-theme-v1'

export const PALETTE = [
  '#82d8cf',
  '#66d3c0',
  '#ffcf14',
  '#c6e2ff',
  '#95cbff',
  '#cce8cf',
  '#6671c0',
  '#ffc7c0',
  '#20ae66',
]

export const DEFAULT_THEME = {
  primary: '#0f6e56',
  positive: '#0f6e56',
}

function toRgb(hex) {
  let h = String(hex || '').replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function toHex(r, g, b) {
  const c = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

export function isValidHex(hex) {
  return !!toRgb(hex)
}

export function luminance(hex) {
  const rgb = toRgb(hex)
  if (!rgb) return 0
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
}

export function isLight(hex) {
  return luminance(hex) > 0.62
}

// 主色上的文字：浅底用深色字，深底用白字
export function onColor(hex) {
  return isLight(hex) ? '#22332e' : '#ffffff'
}

// 与白色混合，得到同色系的浅色版（用于卡片底色、选中态）
export function mixWhite(hex, ratio = 0.82) {
  const rgb = toRgb(hex)
  if (!rgb) return '#f1f1f1'
  return toHex(
    rgb.r + (255 - rgb.r) * ratio,
    rgb.g + (255 - rgb.g) * ratio,
    rgb.b + (255 - rgb.b) * ratio
  )
}

// 主色上的半透明按钮底色（月份切换箭头）
export function shadeColor(hex) {
  return isLight(hex) ? 'rgba(0, 0, 0, 0.10)' : 'rgba(255, 255, 255, 0.18)'
}

export function loadTheme() {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (!raw) return DEFAULT_THEME
    const p = JSON.parse(raw)
    return {
      primary: isValidHex(p.primary) ? p.primary : DEFAULT_THEME.primary,
      positive: isValidHex(p.positive) ? p.positive : DEFAULT_THEME.positive,
    }
  } catch (e) {
    return DEFAULT_THEME
  }
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme))
}

export function applyTheme(theme) {
  const root = document.documentElement
  const { primary, positive } = theme
  root.style.setProperty('--theme', primary)
  root.style.setProperty('--theme-on', onColor(primary))
  root.style.setProperty('--theme-soft', mixWhite(primary, 0.82))
  root.style.setProperty('--theme-shade', shadeColor(primary))
  root.style.setProperty('--positive', positive)
  root.style.setProperty('--positive-soft', mixWhite(positive, 0.85))
  // 顶栏里的支出/收入数字也要跟着换，浅色主色下必须转成深色才看得见
  if (isLight(primary)) {
    root.style.setProperty('--theme-expense-on', '#a32d2d')
    root.style.setProperty('--theme-income-on', '#0f6e56')
  } else {
    root.style.setProperty('--theme-expense-on', '#ffcfcb')
    root.style.setProperty('--theme-income-on', '#b9f0d8')
  }
}
