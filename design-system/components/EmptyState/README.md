# EmptyState

面板的「空」态：点阵小标签、一行标题、说明与动作。没有连接、没选品种、没有数据时摆它，不画假数据。

## Provide

### EmptyState

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `tag` | `string` | — | 点阵小标签；点阵字体没打包时回退到等宽字体。 |
| `title` | `string` | — | 标题。 |
| `children` | `ReactNode` | — | 标题下的说明。 |
| `actions` | `ReactNode` | — | 动作区（按钮）。 |
| `classNames` | `Partial<Record<root \| tag \| title \| text \| actions, string>>` | — | 各部分额外类名。 |

## States

- 有操作：标题、说明下面带操作区。
- 无操作：只有标题与说明。

## Don't

- 不要拿空态当加载中；加载用 Loading。
- 不要写没有下一步的空态说明。

## Composition

```
EmptyState（role=status）
  标签
  标题（h3）
  说明
  动作
```
