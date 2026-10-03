import React, { useState } from 'react'
import { COLOR_CHOICES } from '../lib/storage'

export default function CategoryManager({ categories, onChange }) {
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('expense')
  const [newColor, setNewColor] = useState(COLOR_CHOICES[0])
  const [msg, setMsg] = useState('')

  const update = (type, id, patch) => {
    onChange({
      ...categories,
      [type]: categories[type].map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  const remove = (type, id) => {
    if (categories[type].length <= 1) {
      setMsg('至少要保留一个分类')
      return
    }
    onChange({
      ...categories,
      [type]: categories[type].filter((c) => c.id !== id),
    })
    setMsg('已删除，用了它的旧记录会显示为「其他」')
  }

  const add = () => {
    const name = newName.trim()
    if (!name) {
      setMsg('请先填分类名称')
      return
    }
    onChange({
      ...categories,
      [newType]: [
        ...categories[newType],
        { id: 'c' + Date.now().toString(36), name, color: newColor },
      ],
    })
    setNewName('')
    setMsg(`已添加「${name}」`)
  }

  const cycleColor = (type, c) => {
    const idx = COLOR_CHOICES.indexOf(c.color)
    const next = COLOR_CHOICES[(idx + 1) % COLOR_CHOICES.length]
    update(type, c.id, { color: next })
  }

  const renderGroup = (type, title) => (
    <div className="panel" style={{ marginBottom: 12 }}>
      <div className="panel-title">{title}</div>
      {categories[type].map((c) => (
        <div className="cat-edit-row" key={c.id}>
          <button
            className="cat-color"
            style={{ background: c.color }}
            onClick={() => cycleColor(type, c)}
            title="点击换颜色"
          />
          <input
            className="text-input"
            defaultValue={c.name}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v && v !== c.name) update(type, c.id, { name: v })
            }}
          />
          <button
            className="mini-btn danger"
            onClick={() => remove(type, c.id)}
            disabled={categories[type].length <= 1}
          >
            删
          </button>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {renderGroup('expense', '支出分类')}
      {renderGroup('income', '收入分类')}

      <div className="panel" style={{ marginBottom: 12 }}>
        <div className="panel-title">添加新分类</div>
        <div className="cat-add-row">
          <input
            className="text-input"
            placeholder="分类名称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <select
            className="filter-select"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>
        <div className="color-row">
          {COLOR_CHOICES.map((color) => (
            <button
              key={color}
              className={`color-dot ${newColor === color ? 'on' : ''}`}
              style={{ background: color }}
              onClick={() => setNewColor(color)}
            />
          ))}
        </div>
        <button className="primary-btn" onClick={add}>
          添加分类
        </button>
      </div>

      {msg && <div className="panel-msg">{msg}</div>}
    </div>
  )
}
