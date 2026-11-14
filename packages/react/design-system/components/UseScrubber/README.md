# UseScrubber

序列图共用的扫读钩子：指针在图上移动或键盘走，选中一格。←→ 一格，Shift+←→ 三格，Home / End 到头尾，Esc 清掉。可受控，几张图共用一个选中格。功能参照 Arc 的 Revenue explorer。

## Provide

### useScrubber(options)

返回 { index, set, pointer, keys, props }：props 是 pointer 与 keys 的合并，整个摊在图的容器上；几张图共用时把 pointer 摊在每张上、keys 摊在外层。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `count` | `number` | — | 一共几格。格数变少时越界的选中格当作没选中。 |
| `mode` | `'point' \| 'band'` | `'point'` | point：格是点（折线），指针落到最近的点；band：格是带（柱），落在哪条带里。 |
| `index` | `number \| null` | — | 受控的选中格；不给就钩子自己管。 |
| `onIndexChange` | `(index: number \| null) => void` | — | 选中格变了（含清掉，null）。 |

## States

- 没选中：index 为 null，图上不画十字线。
- 没选中时按 ←→：先落到最新一格（最后一格）。
- 指针离开或失焦：清掉。
- Esc：清掉；已经没选中时不拦截，Esc 照常往外冒（关对话框）。

## Don't

- 不要把 pointer 摊在比图大的元素上：横坐标按那个元素的宽换成格号。
- 不要用它做一段区间的刷选：那是 BrushChart。
- 组合键（Ctrl、Alt、Meta）不拦截，留给浏览器与应用快捷键。

## Composition

```
useScrubber
  scrubKey（键位表，纯函数）
  scrubIndexAt（横坐标到格号，纯函数）
```

## Keyboard

- `← →`：选中格前后一格；没选中时先落到最新一格
- `Shift + ← →`：一次三格（待定：没有出处）
- `Home / End`：第一格 / 最后一格
- `Esc`：清掉选中
