import React, { useRef, useState } from 'react'
import CategoryManager from './CategoryManager'
import ThemePicker from './ThemePicker'
import { importFromText, isNative, exportBackup, shareBackupFile } from '../lib/backup'

export default function Settings({
  records,
  categories,
  theme,
  onThemeChange,
  onCategoriesChange,
  onImport,
  onClear,
}) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [section, setSection] = useState('theme')
  const [saved, setSaved] = useState(null) // { path, uri, filename, shared }
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    if (records.length === 0) {
      setMsg('还没有数据可以导出')
      return
    }
    setBusy(true)
    setMsg('')
    try {
      const info = await exportBackup(records)
      setSaved(info)
      setMsg('')
    } catch (err) {
      setMsg(err.message || '导出失败')
    }
    setBusy(false)
  }

  const handleReshare = async () => {
    if (!saved || !saved.uri) return
    try {
      await shareBackupFile(saved.uri, saved.filename)
    } catch (e) {
      setMsg('已取消分享')
    }
  }

  const handlePick = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const list = importFromText(text)
      if (list.length === 0) {
        setMsg('这个文件里没有可用记录')
        return
      }
      onImport(list)
      setMsg(`已导入 ${list.length} 条记录`)
    } catch (err) {
      setMsg(err.message || '导入失败')
    }
    e.target.value = ''
  }

  const doClear = () => {
    onClear()
    setConfirming(false)
    setMsg('已清空全部记录')
    setSaved(null)
  }

  return (
    <div className="settings">
      <div className="view-switch">
        {[
          ['theme', '主题配色'],
          ['cats', '分类管理'],
          ['data', '数据备份'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`view-btn ${section === key ? 'on' : ''}`}
            onClick={() => setSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'data' && (
        <>
          <div className="panel">
            <div className="panel-title">当前共有</div>
            <div className="panel-strong">{records.length} 条记录</div>
          </div>

          <div className="panel">
            <div className="panel-title">数据放在哪里</div>
            <div className="panel-text">
              所有记录保存在这台设备的本地存储里，不会上传到任何服务器。清理应用数据或卸载会导致丢失，所以请定期导出备份。
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">月度预算</div>
            <div className="panel-text">
              回到「明细」页，在顶部的预算卡片上点「设置」就能填。超支时进度条会变红。
            </div>
          </div>

          <button className="primary-btn" onClick={handleExport} disabled={busy}>
            {busy ? '正在导出…' : '导出备份文件'}
          </button>

          {saved && (
            <div className="saved-box">
              <div className="saved-title">备份已保存</div>
              <div className="saved-path-label">文件位置</div>
              <div className="saved-path">{saved.path}</div>
              <div className="saved-name">文件名：{saved.filename}</div>
              {saved.location === 'download' && (
                <div className="saved-hint">
                  打开手机的「文件管理」→ 内部存储 → Download 文件夹，就能看到这个文件。
                </div>
              )}
              {saved.location === 'documents' && (
                <div className="saved-hint">
                  文件存在应用专属目录。点下面按钮可把文件另存到「下载」或发送到微信 / 电脑。
                </div>
              )}
              {isNative() && saved.uri && (
                <button className="mini-btn primary saved-share" onClick={handleReshare}>
                  另存到其他位置 / 发送出去
                </button>
              )}
            </div>
          )}

          <button className="ghost-btn" onClick={() => fileRef.current.click()}>
            从备份文件导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handlePick}
          />

          {!confirming && (
            <button className="danger-btn" onClick={() => setConfirming(true)}>
              清空全部记录
            </button>
          )}

          {confirming && (
            <div className="confirm-box">
              <div className="confirm-text">
                确定清空全部 {records.length} 条记录？此操作不可恢复，建议先导出备份。
              </div>
              <div className="confirm-row">
                <button className="confirm-no" onClick={() => setConfirming(false)}>
                  取消
                </button>
                <button className="confirm-yes" onClick={doClear}>
                  确认清空
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {section === 'cats' && (
        <CategoryManager categories={categories} onChange={onCategoriesChange} />
      )}

      {section === 'theme' && <ThemePicker theme={theme} onChange={onThemeChange} />}

      {section === 'data' && msg && <div className="panel-msg">{msg}</div>}
    </div>
  )
}
