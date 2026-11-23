# RootCauseTree

数据异常（缺 K、断流、对不上账）的排查：故障在最上一行，下面一层层假设，每行写门（任一 / 同时，父行才有）、状态（待查 / 在查 / 已排除 / 已确认）、标题与涉及的文件或数据源。已排除的行变淡、竖线变虚；已确认且没有子假设的是根因，从它到故障的一条线点亮。Enter 打开这一行的证据（结论、证据种类与原文、文件、检查时间），有 onAction 时根因下面有「修复」「从这里重跑」。只画缩进树，不画分叉图。状态是字加线型，不只靠颜色。功能参照 affectUI 的 Root Cause Tree（affectui.com/components/root-cause-tree，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### RootCauseTree

证据面板受控或不受控（openId / defaultOpenId）；不给 onAction 证据只读。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `failure` * | `CauseFailure` | — | The failure and its hypotheses. |
| `title` * | `ReactNode` | — | Heading. |
| `label` * | `string` | — | Accessible name of the tree. |
| `openId` | `string \| null` | — | Controlled open row id; null when no evidence is open. |
| `defaultOpenId` | `string \| null` | `null` | Row opened first when uncontrolled. |
| `onOpenChange` | `(id: string \| null) => void` | — | Called when the open row changes. |
| `onAction` | `(cause: Cause, action: RootCauseAction) => void` | — | Called with a root cause and the chosen action; omit to keep the evidence read-only. |
| `formatTime` | `(at: number) => string` | — | How a check time in milliseconds is written; omit to hide times. |
| `labels` * | `RootCauseTreeLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### flattenCauses

纯函数：前序展开成行，故障一行在最前。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `title` * | `string` | — | What failed. |
| `detail` | `string` | — | One short detail line, such as how many bars are missing. |
| `gate` | `CauseGate` | — | How the top hypotheses cause the failure; defaults to or. |
| `children` * | `readonly Cause[]` | — | Top hypotheses. |

### isRootCause

纯函数：已确认且没有子假设。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `title` * | `string` | — | Hypothesis in one line. |
| `status` | `CauseStatus` | — | Check state; defaults to open. |
| `gate` | `CauseGate` | — | How the children cause this one; defaults to or. |
| `verdict` | `string` | — | Verdict sentence once checked. |
| `evidence` | `CauseEvidence` | — | Proof once checked. |
| `files` | `readonly string[]` | — | Files or sources involved. |
| `at` | `number` | — | When it was checked, in milliseconds. |
| `children` | `readonly Cause[]` | — | Narrower hypotheses. |

### litPath

纯函数：每个根因与它到故障的祖先。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `title` * | `string` | — | What failed. |
| `detail` | `string` | — | One short detail line, such as how many bars are missing. |
| `gate` | `CauseGate` | — | How the top hypotheses cause the failure; defaults to or. |
| `children` * | `readonly Cause[]` | — | Top hypotheses. |

### moveCause

纯函数：树的键盘移动。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RootCauseTree, type CauseFailure } from '@katana-ui/react/blocks'

// 示例数据：一次 data-check 报日 K 缺口的排查；代码、日志与路径都是演示写的。
const FAILURE: CauseFailure = {
  id: 'gap',
  title: '000001.SZ 日 K 缺 3 根（示例）',
  detail: '2026-11-18 → 11-20',
  children: [
    {
      id: 'empty',
      title: '数据源当天返回空',
      status: 'ruledOut',
      verdict: '腾讯、新浪两个源都有这三天的数据。',
      evidence: { kind: '请求', content: 'GET /kline?code=sz000001&start=20261118\n→ 200 · 3 行' },
      files: ['tencent', 'sina'],
    },
    {
      id: 'calendar',
      title: '交易日历把这三天算成休市',
      status: 'ruledOut',
      verdict: '交易日历里这三天是交易日。',
      evidence: {
        kind: '查询',
        content: "SELECT * FROM calendar WHERE date BETWEEN '2026-11-18' AND '2026-11-20'\n→ 3 行 · is_open = 1",
      },
    },
    {
      id: 'backfill',
      title: '回补任务没有跑',
      status: 'confirmed',
      gate: 'and',
      verdict: '11-18 起回补任务每次都提前退出。',
      children: [
        {
          id: 'limited',
          title: '回补撞上新浪限流被跳过',
          status: 'confirmed',
          verdict: '回补与新闻轮询挤在 15:05，新浪返回 456，任务按「源不可用」跳过当天。',
          evidence: {
            kind: '日志',
            content:
              '15:05:02 backfill sina 000001.SZ → 456 Too Many Requests\n15:05:02 backfill skip day=2026-11-18 reason=source_unavailable',
          },
          files: ['backfill/schedule.ts', 'adapters/sina.ts'],
          at: Date.UTC(2026, 10, 21, 2, 14),
        },
        { id: 'retry', title: '重试次数用完后没有改走别的源', status: 'checking', files: ['backfill/fallback.ts'] },
      ],
    },
    { id: 'parse', title: '解析时把停牌日当成脏数据删掉', status: 'open' },
  ],
}

export function RootCauseTreeUsage() {
  const [last, setLast] = useState<string | null>(null)
  return (
    <div className="gal-wide" style={{ maxWidth: 880 }} data-gallery-rct="main">
      <RootCauseTree
        failure={FAILURE}
        title="数据缺口排查"
        label="示例：排查树"
        defaultOpenId="limited"
        onAction={(cause, action) => setLast(`${action === 'fix' ? '修复' : '重跑'}：${cause.title}`)}
        formatTime={(at) => `检查于 ${new Date(at).toISOString().slice(0, 16).replace('T', ' ')} UTC`}
        labels={{
          status: { open: '待查', checking: '在查', ruledOut: '已排除', confirmed: '已确认' },
          gate: { or: '任一', and: '同时' },
          rootCause: '根因',
          counts: (c) => `已排除 ${c.ruledOut} · 已确认 ${c.confirmed} · 在查 ${c.checking} · 待查 ${c.open}`,
          evidence: '证据',
          pick: '选一行看证据',
          noEvidence: '还没有证据',
          fix: '修复',
          retry: '从这里重跑',
        }}
      />
      {last !== null && <p className="gal-note">最后一次动作（示例，不真的执行）：{last}</p>}
    </div>
  )
}
```

## States

- 待查：灰字。在查：warn 色字。
- 已排除：整行变淡、删除线、竖线变虚线。
- 已确认：danger 色字；没有子假设的是根因，整行淡 danger 底，到故障的竖线点亮。
- 打开一行：行底变选中色，右侧（窄时下方）是证据；还没有证据写 noEvidence。

## Don't

- 不要拿它画谁调用了谁：用 TraceWaterfall。
- 不要在件里判定根因：状态由排查的人或 Agent 写回。
- 不要让「修复」直接改数据：onAction 交给调用方，走它自己的确认。

## Composition

```
RootCauseTree
  头（标题 · 计数）
  tree（每行 treeitem：门 · 状态 · 标题 · 文件）
  region（证据：结论 · 种类 · pre 原文 · 文件 · 时间 · Button × 2）
```

## Keyboard

- `Tab`：进树（一个停点），再到证据原文与按钮
- `↑ ↓`：上一行 / 下一行
- `← / →`：回父行 / 到第一个子
- `Home / End`：故障行 / 最后一行
- `Enter / Space`：打开或收起这一行的证据
- `Esc`：收起证据，焦点回到树上
