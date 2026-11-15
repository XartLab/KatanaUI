# KeyStats

照 TradingView 品种页的 Key stats（2026-11-15 实测）：标题带「›」，三列网格，每项一个灰色小标签（带「›」，给了 onItem 就可点）、一个大号数值（带单位小字）、可选徽标（中性灰胶囊，不用 TV 的紫色）。数值与文字由调用方传。

## Provide

`*` marks a required prop.

### KeyStats

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | — | 标题。 |
| `items` | `KeyStatItem[]` | — | { key, label, value?, unit?, badge? }；没有值画「—」。 |
| `onTitle / onItem` | `callbacks` | — | 给了标题与标签就变成按钮，带「›」。 |
| `columns` | `number` | `3` | 列数。 |

## Usage

```tsx

```

## States

- 没给 onItem：标签是普通文字，没有「›」。
- 没有值：数值位写「—」。

## Don't

- 不要在件里格式化数值；由调用方传。
- 徽标不要用彩色。

## Composition

```
KeyStats section
  h3 标题（›）
  dl 网格
    div（dt 标签 › · dd 数值 · 单位 · 徽标）
```

## Keyboard

- `Tab / Enter`：给了回调时到标题、标签上、触发
