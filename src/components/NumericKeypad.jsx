import React from 'react'

/**
 * 应用内的数字键盘。
 * 用它替代系统数字输入法：金额栏不再唤起系统键盘，
 * 输入法就不会在「数字模式」和「文本模式」之间来回切，
 * 备注栏打拼音时也就不再出现 MNO / GHI 这种按键字母。
 */
export default function NumericKeypad({ onKey }) {
  return (
    <div className="kpad">
      {['1', '2', '3'].map((d) => (
        <button key={d} className="kpad-key" onClick={() => onKey(d)}>
          {d}
        </button>
      ))}
      <button className="kpad-key kpad-fn" onClick={() => onKey('del')} aria-label="退格">
        ⌫
      </button>

      {['4', '5', '6'].map((d) => (
        <button key={d} className="kpad-key" onClick={() => onKey(d)}>
          {d}
        </button>
      ))}
      <button className="kpad-key kpad-fn" onClick={() => onKey('dot')}>
        .
      </button>

      {['7', '8', '9'].map((d) => (
        <button key={d} className="kpad-key" onClick={() => onKey(d)}>
          {d}
        </button>
      ))}
      <button className="kpad-key kpad-done" onClick={() => onKey('done')}>
        完成
      </button>

      <button className="kpad-key kpad-zero" onClick={() => onKey('0')}>
        0
      </button>
    </div>
  )
}
