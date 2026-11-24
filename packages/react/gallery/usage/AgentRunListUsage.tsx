// SPDX-License-Identifier: MIT
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { AgentRunList, type RunListGroup } from '../../src/blocks'
import { Button } from '../../src/index'

// 示例数据：几次 Agent 运行，数与时间文字是手写的演示值。相对时间（「6 分钟前开始」）由调用方写好传进来，件不读钟。
const GROUPS: readonly RunListGroup[] = [
  {
    id: 'active',
    title: '进行中',
    items: [
      {
        id: 'backfill',
        name: '回补沪深日线',
        subtitle: '5,120 只 · 沪深 A 股',
        status: 'running',
        when: '6 分钟前开始',
      },
      { id: 'source-b', name: '接入新数据源', subtitle: '示例源 B · 日线', status: 'blocked', when: '1 小时前阻塞' },
    ],
  },
  {
    id: 'week',
    title: '本周',
    items: [
      { id: 'review', name: '复核回补结果', subtitle: '9 个板块', status: 'done', when: '昨天' },
      { id: 'factors', name: '重算动量因子', subtitle: '3 组参数 · 近 5 年', status: 'done', when: '昨天' },
      { id: 'news', name: '抓取快讯', subtitle: '示例源 C', status: 'failed', when: '3 天前' },
    ],
  },
]

export function AgentRunListUsage() {
  const [openId, setOpenId] = useState<string | null>('source-b')
  const opened = GROUPS.flatMap((group) => group.items).find((item) => item.id === openId)
  return (
    <div style={{ width: 440, maxWidth: '100%' }} data-gallery-arl="main">
      <AgentRunList
        title="运行"
        actions={
          <Button size="sm">
            <PlusIcon aria-hidden="true" />
            新建
          </Button>
        }
        groups={GROUPS}
        selectedId={openId}
        onOpen={setOpenId}
        labels={{ status: { running: '在跑', blocked: '要你确认', done: '完成', paused: '已暂停', failed: '失败' } }}
      />
      <p data-gallery-arl="opened">{opened === undefined ? '没有打开的运行' : `已打开：${opened.name}`}</p>
    </div>
  )
}
