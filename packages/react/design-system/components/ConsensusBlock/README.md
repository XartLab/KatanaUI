# ConsensusBlock

写命令提交前的必要条件块：当前意图、各必要条件的满足或阻止、结论与参数 hash；不是投票，任一方未过、未返回、超时、失效都不可提交，裁决永远在执行网关与账户服务。

## Provide

`*` marks a required prop.

### ConsensusBlock

各方的判定来自各自的权威，件只画不判，不合成第四种判断。一个表单只放一个。结构不皮肤化。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 整块的读屏名。 |
| `subject` | `ReactNode` | — | 要提交的是什么（下单 · 账户 A · 买 300750 × 2,000）；旧名 intent 留一个版本。 |
| `parties` | `readonly ConsensusParty[]` | — | 各方：key、label、state、message、detail?；detail 有就整格是按钮，点开才看。 |
| `verdict` | `'ok' \| 'warn' \| 'blocked'` | — | 结论，由调用方给；warn 可提交但确认框要列出警告。 |
| `verdictText` | `string` | — | 结论的字（可提交 / 不可提交）。 |
| `summary` | `ReactNode` | — | 结论行左边的计数句，用 countConsensus 的结果拼。 |
| `hash` | `string \| null` | — | 参数 hash；未就绪传 null，显示 —。 |
| `onHashClick` | `() => void` | — | 给了 hash 就是按钮（复制）。 |
| `stateLabels` | `Partial<Record<ConsensusState, string>>` | — | 各状态的字，缺省是英文。 |

### countConsensus(parties)

数各状态的个数，给计数句用：unknown、timeout、stale、pending 都归 open，不算通过。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `parties` | `readonly ConsensusParty[]` | — | 返回 { pass, warn, blocked, open }。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ConsensusBlock, countConsensus, type ConsensusParty } from '@katana-ui/react/blocks'

const stateText = {
  pass: '通过',
  warn: '接近',
  blocked: '未过',
  unknown: '未返回',
  timeout: '超时',
  stale: '需重检',
  pending: '评估中',
}

const orderParties: readonly ConsensusParty[] = [
  { id: 'gw', label: 'GATEWAY', state: 'pass', message: '可用 ✓ 整手 ✓' },
  {
    id: 'acct',
    label: 'ACCOUNT',
    state: 'warn',
    message: '集中度 58 / 60',
    detail: '单票集中度上限 60%，当前 58%；再买 2,000 股会到 61%（示例）。',
  },
  { id: 'rules', label: 'RULES', state: 'pass', message: '无规则命中' },
]

const promoteParties: readonly ConsensusParty[] = [
  { id: 'gates', label: 'GATES', state: 'blocked', message: '偏离门未过 19.4%', detail: '偏离门要求 ≤ 15%（示例）。' },
  { id: 'cap', label: 'CAPACITY', state: 'pass', message: '0.9 / 5 亿' },
  { id: 'acct', label: 'ACCOUNT', state: 'unknown', message: '未指定' },
]

const countText = (parties: readonly ConsensusParty[]) => {
  const n = countConsensus(parties)
  return `${n.pass} 通过 · ${n.warn} 接近 · ${n.blocked} 未过 · ${n.open} 未填`
}

export function ConsensusBlockUsage() {
  return (
    <>
      <div style={{ width: 340 }} data-testid="consensus-ok">
        <ConsensusBlock
          label="下单必要条件"
          subject="下单 · 账户 A · 买 300750 × 2,000"
          parties={orderParties}
          verdict="warn"
          verdictText="可提交"
          summary={countText(orderParties)}
          hash="7f3a"
          onHashClick={() => {}}
          stateLabels={stateText}
        />
      </div>

      <div style={{ width: 340 }} data-testid="consensus-blocked">
        <ConsensusBlock
          label="推进必要条件"
          subject="推进 · alice-rev → LIVE"
          parties={promoteParties}
          verdict="blocked"
          verdictText="不可推进"
          summary={countText(promoteParties)}
          hash={null}
          stateLabels={stateText}
        />
      </div>

      <div style={{ width: 340 }} data-testid="consensus-stale">
        <ConsensusBlock
          label="重检必要条件"
          parties={[
            { id: 'gw', label: 'GATEWAY', state: 'timeout', message: '超时' },
            { id: 'acct', label: 'ACCOUNT', state: 'stale', message: '需重检' },
            { id: 'rules', label: 'RULES', state: 'pending', message: '评估中' },
          ]}
          verdict="blocked"
          verdictText="不可提交"
          stateLabels={stateText}
        />
      </div>
    </>
  )
}
```

## States

- pass 满足；warn 接近（不阻止）；blocked 未过（红菱形，抖一次）。
- unknown 未返回（暗灯）；timeout 超时（琥珀灯闪一次）；stale 已失效（琥珀空心环，需重检）。
- pending 评估中（橙环，句子写评估中）。
- 每一格都有状态字与一句话：状态不只靠灯的颜色。

## Don't

- 不要把它当投票：多方同意不等于授权。
- 不要在前端合成第四种判断，verdict 由权威给。
- 研究类命令不要用它。
- 一个表单不要放两个。

## Composition

```
ConsensusBlock
  各方的格（点阵名、灯 + 状态字、一句话）
  详情（点开）
  结论行（计数、结论、hash）
```

## Keyboard

- `Tab`：在有详情的格与 hash 之间移动
- `Enter / Space`：展开或收起该方的详情；点 hash
