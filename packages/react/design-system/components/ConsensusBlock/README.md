# ConsensusBlock

写命令提交前的必要条件块：当前意图、各必要条件的满足或阻止、结论与参数 hash；不是投票，任一方未过、未返回、超时、失效都不可提交，裁决永远在执行网关与账户服务。

## Provide

### ConsensusBlock

各方的判定来自各自的权威，件只画不判，不合成第四种判断。一个表单只放一个。结构不皮肤化。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 整块的读屏名。 |
| `intent` | `ReactNode` | — | 当前意图（下单 · 账户 A · 买 300750 × 2,000）。 |
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
