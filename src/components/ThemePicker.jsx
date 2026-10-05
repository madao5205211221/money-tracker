import React, { useState } from 'react'
import { DEFAULT_THEME, PALETTE, isValidHex, onColor } from '../lib/theme'

export default function ThemePicker({ theme, onChange }) {
  const [customPrimary, setCustomPrimary] = useState('')
  const [customPositive, setCustomPositive] = useState('')
  const [msg, setMsg] = useState('')

  const pick = (key, color) => {
    onChange({ ...theme, [key]: color })
    setMsg('')
  }

  const applyCustom = (key, raw, reset) => {
    const hex = String(raw || '').trim()
    if (!hex.startsWith('#')) {
      setMsg('色值要以 # 开头，比如 #20ae66')
      return
    }
    if (!isValidHex(hex)) {
      setMsg('这个色值看不懂，格式应像 #20ae66')
      return
    }
    pick(key, hex.toLowerCase())
    reset('')
    setMsg('已应用')
  }

  const renderRow = (key, title, hint, custom, setCustom) => (
    <div className="panel" style={{ marginBottom: 12 }}>
      <div className="panel-title">{title}</div>
      <div className="color-row">
        {PALETTE.map((c) => (
          <button
            key={c}
            className={`color-dot ${theme[key] === c ? 'on' : ''}`}
            style={{ background: c }}
            onClick={() => pick(key, c)}
          />
        ))}
      </div>
      <div className="cat-add-row">
        <input
          className="text-input"
          type="text"
          inputMode="text"
          placeholder="自定义色值，如 #20ae66"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button className="mini-btn primary" onClick={() => applyCustom(key, custom, setCustom)}>
          应用
        </button>
      </div>
      <div className="panel-text">
        {hint}　当前：{theme[key]}
      </div>
    </div>
  )

  return (
    <div>
      <div
        className="theme-preview"
        style={{ background: theme.primary, color: onColor(theme.primary) }}
      >
        <span className="theme-preview-title">顶栏效果预览</span>
        <span className="theme-preview-nums">
          <span style={{ color: 'var(--theme-expense-on)' }}>支出 1,234</span>
          <span style={{ color: 'var(--theme-income-on)' }}>收入 8,000</span>
        </span>
      </div>

      {renderRow(
        'primary',
        '主色（顶栏、按钮、标签栏）',
        '影响最大的一个颜色',
        customPrimary,
        setCustomPrimary
      )}

      {renderRow(
        'positive',
        '正向色（收入金额、进度条）',
        '建议和主色同色系或相近',
        customPositive,
        setCustomPositive
      )}

      <button className="ghost-btn" onClick={() => onChange(DEFAULT_THEME)}>
        恢复默认配色
      </button>

      {msg && <div className="panel-msg">{msg}</div>}
    </div>
  )
}
