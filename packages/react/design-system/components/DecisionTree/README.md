# DecisionTree

Agent 走到岔口要人拍板（清洗规则、回补范围、调仓幅度）：左边问题、背景、Agent 名与风险标（高 / 中）；中间两到四个分支挂在一道轨上（编号 1–4，Agent 倾向的那支标出来、轨线强调色）；每个分支右边是它的后果，一行一条，有风险的打标，聚焦或悬停（或按 F 依次跳过去）看注释与出处。最后一支是「其他…」：写一句指示，Enter 发出、Shift+Enter 换行，onChoose 返回的回话写在下面。选了分支这个决定就离开清单，接着看下一个；←→（或 K / J）在待定的决定之间走。件只回调人的选择，Agent 不会因为倾向某支就自动执行。功能参照 affectUI 的 Decision Tree（affectui.com/components/decision-tree，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）；没有命令式句柄。演示数据是示例。

## Provide

`*` marks a required prop.

### DecisionTree

onChoose 收到分支或指示；对指示可返回（Promise 的）回话字符串。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `decisions` * | `readonly Decision[]` | — | Pending decisions; new ones go at the end. |
| `onChoose` | `(decision: Decision, choice: DecisionChoice) => unknown` | — | Called with a branch pick or a written instruction; for an instruction it may return (a promise of) the agent's short reply. |
| `allowOther` | `boolean` | `true` | Shows the Other branch. |
| `title` * | `ReactNode` | — | Heading. |
| `labels` * | `DecisionTreeLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DecisionTree, type Decision } from '@katana-ui/react'

// 示例数据：数据员 Agent 走到两个岔口，问题与后果是手写的演示值。
const DECISIONS: readonly Decision[] = [
  {
    id: 'gap',
    question: '600519 日 K 缺了 3 天，怎么补？',
    context: '2026-11-18 到 11-20，主源返回空',
    agent: '数据员',
    model: 'model-a',
    risk: 'medium',
    options: [
      {
        id: 'refetch',
        label: '从备源重抓',
        pick: true,
        effects: [
          '约 2 分钟',
          { text: '备源复权口径不同', note: '要用复权因子对一次，否则跳空', source: '回落链日志' },
        ],
      },
      { id: 'suspend', label: '标成停牌', effects: ['回测里这三天没有成交', '指标窗口会跳过这三天'] },
      { id: 'leave', label: '先不管', effects: [{ text: '依赖它的因子会算错', note: '动量 20 日窗口受影响' }] },
    ],
  },
  {
    id: 'clean',
    question: '分钟线里有 12 根成交量为 0，要删吗？',
    agent: '数据员',
    options: [
      { id: 'drop', label: '删掉', effects: ['K 线会断开'] },
      { id: 'keep', label: '保留', pick: true, effects: ['成交量均线会被拉低一点'] },
    ],
  },
]

export function DecisionTreeUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 900 }} data-gallery-dt="main">
      <DecisionTree
        title="待定（示例）"
        decisions={DECISIONS}
        onChoose={(_, choice) => ('other' in choice ? `收到，按「${choice.other}」处理` : undefined)}
        labels={{
          agentPick: 'Agent 倾向',
          risk: { high: '高风险', medium: '中风险' },
          other: '其他…',
          otherField: '写一句指示给 Agent',
          send: '发出',
          position: (index, count) => `${index} / ${count}`,
          previous: '上一个',
          next: '下一个',
          chose: (question, choice) => `${question} 选了 ${choice}`,
          sent: (question) => `${question}：指示已发出`,
          empty: '没有待定的决定',
        }}
      />
    </div>
  )
}
```

## States

- Agent 倾向：那支按钮是 primary，下面写 agentPick，轨线强调色。
- 风险：高 danger、中 warn 的小标在 Agent 名后。
- 有风险的后果：前面一个 warn 色「!」、虚下划线，聚焦或悬停出注释。
- 其他…展开：标了名的输入框与发出钮；回话写在下面。
- 没有待定的：写 empty。

## Don't

- 不要拿它问只有是 / 否的问题：用 DecisionQueue 或 AiApproval。
- 不要拿它审做完的活：用 AgentRecap。
- 不要超过四个分支：拆成两个决定。

## Composition

```
DecisionTree
  头（标题 · 上一个 · 位置 · 下一个）
  问题（问题 · 背景 · Agent 名与模型 · 风险标）
  ol 分支（Button 编号与名字 · 倾向小标 · 后果 ul：打标的带 tooltip）· 其他…（textarea · Button 发出 · 回话）
  播报
```

## Keyboard

- `1–4`：选这个分支；分支数加一打开「其他…」
- `Enter`：在「其他…」里发出；Shift+Enter 换行
- `← → / K J`：上一个 / 下一个决定
- `F`：跳到下一条有风险的后果，看它的注释
- `Esc`：关上「其他…」或注释
