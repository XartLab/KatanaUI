# PanelFrame

面板的外壳：编号、标题、对象、联动灯、点阵元信息位、局部工具条、右侧图标钮与底部来源行。聚焦时四角画橙色括号。面板不自己画边框与阴影。

## Provide

### PanelFrame

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `index` | `string` | — | 面板编号（01、02……），强调色点阵字。 |
| `title` | `string` | — | 标题，同时是外壳的读屏名。 |
| `object` | `string` | — | 当前对象，标题后的小字；前面的「·」由外壳画。 |
| `linkGroup / linkLabel / pinned` | `LinkGroup \| null / string / boolean` | — | 联动组色灯；pinned 画空心圈。 |
| `meta` | `string` | — | 点阵元信息位（刷新频率、周期之类）。 |
| `toolbar` | `ReactNode` | — | 局部工具条，放在标题与图标钮之间。 |
| `source` | `ReactNode` | — | 来源行位：底部一行点阵字，不给就没有。 |
| `focused / brackets` | `boolean` | — | 聚焦面板标题 ink-100；brackets 默认跟着 focused，画四角橙色括号。 |
| `maximized / onSettings / onMaximize / onClose` | `boolean / () => void` | — | 右侧图标钮；不传回调就不画那个钮。 |
| `labels` | `PanelFrameLabels` | — | 设置 / 最大化 / 还原 / 关闭的读屏名，由调用方传。 |

## States

- 普通：标题 ink-300。
- 聚焦：标题 ink-100，四角橙色括号。
- 空态：正文摆 EmptyState，不画假数据。

## Don't

- 不要在面板里再画边框与阴影。
- 不要把橙色用在数据上；它只给括号与状态灯。
- 标题栏图标钮不超过 3 个。

## Composition

```
PanelFrame（section）
  头：编号 | 联动灯 | 标题 | 对象 | 工具条 | 元信息 | 图标钮
  正文
  来源行
  角括号（装饰）
```
