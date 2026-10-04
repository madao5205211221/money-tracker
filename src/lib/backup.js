// 备份导出/导入（跨平台）。
// 在安卓 App 里：把 JSON 写到手机的「下载」目录，并把完整路径返回给界面展示，
//   这样用户能在文件管理器里按路径直接找到备份文件。
// 在浏览器里：退回到普通下载（落到浏览器下载目录）。

import { Capacitor } from '@capacitor/core'

const APP = 'money-tracker'
const VERSION = 1

export function isNative() {
  return Capacitor.isNativePlatform()
}

export function buildPayload(records) {
  return {
    app: APP,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    records,
  }
}

export function backupFileName(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `阿英记账备份-${y}${m}${d}-${hh}${mm}.json`
}

/* ---------- 浏览器：普通下载 ---------- */

function browserDownload(text, filename) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ---------- 安卓：写入公共下载目录 ---------- */

async function nativeWrite(text, filename) {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')

  // 优先写到公共「下载」目录（External Storage），文件管理器里能直接看到
  try {
    const res = await Filesystem.writeFile({
      path: `Download/${filename}`,
      data: text,
      directory: Directory.ExternalStorage,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    return {
      uri: res.uri,
      path: `手机存储/Download/${filename}`,
      location: 'download',
    }
  } catch (e) {
    // 部分机型没授权外部存储，退回 App 私有 Documents 目录（仍然给出完整路径）
    const res = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    return {
      uri: res.uri,
      path: `App 文档目录/${filename}`,
      location: 'documents',
    }
  }
}

/**
 * 导出备份。
 * @returns {Promise<{path:string, uri:string, filename:string, location:string, shared:boolean}>}
 */
export async function exportBackup(records, { share = true } = {}) {
  const filename = backupFileName()
  const text = JSON.stringify(buildPayload(records), null, 2)

  if (!isNative()) {
    browserDownload(text, filename)
    return {
      path: `浏览器下载目录/${filename}`,
      uri: '',
      filename,
      location: 'browser',
      shared: false,
    }
  }

  const info = await nativeWrite(text, filename)

  let shared = false
  if (share) {
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({
        title: '阿英记账备份',
        text: `备份文件：${filename}`,
        url: info.uri,
        dialogTitle: '把备份保存或发送到…',
      })
      shared = true
    } catch (e) {
      // 用户取消分享，不影响已写入的文件
    }
  }

  return { ...info, filename, shared }
}

/**
 * 让用户在文件管理器里打开备份所在位置 / 把文件另存到别处。
 */
export async function shareBackupFile(uri, filename) {
  const { Share } = await import('@capacitor/share')
  await Share.share({
    title: '阿英记账备份',
    text: `备份文件：${filename}`,
    url: uri,
    dialogTitle: '把备份保存或发送到…',
  })
}

/* ---------- 导入 ---------- */

export function importFromText(text) {
  const parsed = JSON.parse(text)
  const list = Array.isArray(parsed) ? parsed : parsed.records
  if (!Array.isArray(list)) {
    throw new Error('文件格式不对，找不到记录列表')
  }
  return list
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
}
