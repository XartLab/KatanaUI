// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, DeleteButton, HoldToConfirm } from '../../src/index'
import type { Pattern } from './types'

function Demo() {
  const [log, setLog] = useState('还没有操作')
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 560 }}>
      <p className="gal-note">演示：操作只写一行记录，不会真的下单。</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <DeleteButton
          label="删除工作区"
          labels={{ confirm: '确认删除', cancel: '取消' }}
          onConfirm={() => setLog('已删除工作区（演示）')}
        />
        <span style={{ flex: 1 }} />
        <Button onClick={() => setLog('已取消')}>取消</Button>
        <Button variant="primary" onClick={() => setLog('已保存')}>
          保存
        </Button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <HoldToConfirm
          labels={{ hint: '按住 2 秒，全部平仓', confirmed: '已平仓' }}
          onConfirm={() => setLog('已全部平仓（演示）')}
        >
          全部平仓
        </HoldToConfirm>
      </div>
      <output>{log}</output>
    </div>
  )
}

const pattern: Pattern = {
  id: 'button-bar',
  title: '按钮条',
  summary: '一排按钮怎么排：主操作在最右、次要操作在左，危险操作隔开并要二次确认。',
  Demo,
  use: [
    '对话框底部、表单底部、面板底部的一组「取消 / 保存」',
    '同一处出现破坏性操作（删除、平仓、撤单）要和普通操作分开',
  ],
  avoid: ['一屏里到处是主按钮：一个条里只能有一个 primary', '频繁的工具类操作：用工具栏（Toolbar）的图标按钮'],
  parts: [
    { page: 'button', role: 'primary 做主操作，默认样式做次要操作，ghost / link 做弱操作' },
    { page: 'delete-button', role: '可恢复性差的删除：点一下变成「确认 / 取消」' },
    { page: 'hold-to-confirm', role: '后果重、要快的操作（全部平仓）：按住 2 秒才触发' },
    { page: 'dialog', role: '对话框底部用 DialogFooter 放按钮条' },
  ],
  rules: [
    '主操作在最右，取消在它左边，间距 8px；一条里只有 1 个 primary',
    '按钮高 30px，文字写动词（「保存」「全部平仓」），不写「确定」',
    '危险操作放在最左，与主次操作之间留空隔开，至少 24px',
    '可撤销的删除用 DeleteButton 就地二次确认；不可撤销、涉及资金的用 HoldToConfirm 按住 2 秒',
    '不可用的按钮保持显示并置灰（45% 不透明），不要消失；原因写在旁边的提示里',
    '提交中的按钮禁用并把文字换成进行时（「保存中…」），防止重复提交',
  ],
  source: { label: 'Salt · Button bar', href: 'https://www.saltdesignsystem.com/salt/patterns/button-bar' },
}
export default pattern
