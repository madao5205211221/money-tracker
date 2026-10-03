import React, { useRef, useState } from 'react'
import { exportToFile, importFromFile } from '../lib/storage'

export default function Settings({ records, onImport, onClear }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [confirming, setConfirming] = useState(false)

  const handleExport = () => {
    if (records.length === 0) {
      setMsg('还没有数据可以导出')
      return
    }
    exportToFile(records)
    setMsg(`已导出 ${records.length} 条记录，文件在下载目录`)
  }

  const handlePick = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      const list = await importFromFile(file)
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
  }

  return (
    <div className="settings">
      <div className="panel">
        <div className="panel-title">数据放在哪里</div>
        <div className="panel-text">
          所有记录保存在这台设备的浏览器/应用本地存储里，不会上传到任何服务器。
          清理应用数据或卸载会导致丢失，所以请定期导出备份。
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">当前共有</div>
        <div className="panel-strong">{records.length} 条记录</div>
      </div>

      <button className="primary-btn" onClick={handleExport}>
        导出备份文件
      </button>

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

      {msg && <div className="panel-msg">{msg}</div>}
    </div>
  )
}
