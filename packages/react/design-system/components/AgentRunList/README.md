# AgentRunList

AgentRunDetail 的列表侧：分组的运行清单，一行一个运行：左上名字、左下副标题、右上状态字（灯加词，着状态色）、右下相对时间、行尾箭头；点一行回调 id，选中的行 aria-current。相对时间的文字（「6 分钟前开始」「昨天」）由调用方写好传进来，件不读钟。现有的 RunningNow 是标题栏胶囊加弹层、AgentFleet 是带状态环与子树的主卡，都不是平列表，所以补这一件。信息结构借自 Jamie Merrill 的 Agent tracker（x.com/jamiemerrill，2026-11-24 看截图）。演示数据是示例。

## Provide

`*` marks a required prop.

### AgentRunList

分组与行都由调用方给；title 与 actions（如「新建」钮）可选；selectedId 受调用方管，onOpen 收到点的那一行的 id。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `ReactNode` | — | Heading of the list. |
| `actions` | `ReactNode` | — | Right side of the heading, usually a button such as "New agent". |
| `groups` * | `readonly RunListGroup[]` | — | Groups of runs. |
| `selectedId` | `string \| null` | `null` | The run whose detail is open. |
| `onOpen` | `(id: string) => void` | — | Called with the id of the run to open. |
| `labels` * | `AgentRunListLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { AgentRunList, type RunListGroup } from '@katana-ui/react/blocks'
import { Button } from '@katana-ui/react'

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
```

## States

- 行：名字与副标题在左，状态字与相对时间在右，行尾一个箭头；名字与副标题过长截断成省略号。
- 状态字着状态色（在跑强调色、阻塞 warn、完成 ok、失败 danger、暂停中性），前面一盏灯，不单靠颜色。
- 悬停：行底变浅；选中（selectedId）：选中底色加 aria-current；键盘焦点：焦点环。

## Don't

- 不要拿它看一个运行的步骤与进度：用 AgentRunDetail。
- 不要拿它放标题栏里的小胶囊：用 RunningNow。
- 不要让件自己算相对时间：由调用方写好文字。

## Composition

```
AgentRunList（section）
  头（标题 h3 · 动作槽）
  分组 × N（group · 小标题 h4 · ul）
    li > button 行（名字 · 状态灯与词 · 副标题 · 相对时间 · 箭头）
```

## Keyboard

- `Tab`：一行一个停点
- `Enter / Space`：打开这一行的运行
