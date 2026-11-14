# MatrixOrb

一盘方点排成圆：待命慢呼吸，聆听同心波跟音量走，思考几个热点绕着转。点阵签名件的动态版，用来表达 Agent 在做什么。学自 rare-ui。

## Provide

### MatrixOrb

画在 canvas 上，role=img；状态用文字另外读出。颜色取元素的 color，跟主题走。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `state` | `'idle' \| 'listening' \| 'thinking'` | `'idle'` | 状态；换状态时三种的权重插值过去，不跳。 |
| `level` | `number` | — | 聆听态的音量 0 到 1；不给用模拟包络。 |
| `cells` | `number` | `16` | 一边几个点；点距 6px，所以 16 是 96px 见方。 |
| `color` | `string` | `'var(--signal-orange)'` | 点的颜色，CSS 颜色或 var(--token)。 |
| `label` | `string` | — | 读屏名（必填）。 |

## States

- 待命：慢呼吸。
- 聆听：同心波跟 level 音量走。
- 思考：几个热点绕着转。

## Don't

- 只表达 Agent 真实在做的事，不当装饰。
- label 要传（读屏名字）。

## Composition

```
MatrixOrb
  canvas（requestAnimationFrame 循环）
```
