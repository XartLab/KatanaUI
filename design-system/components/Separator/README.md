# Separator

1px 的线，取 line 色（跟菜单里的分隔线一条白线）；默认只是装饰，读屏不报。

## Provide

### Separator

其余属性透传给 Radix Separator.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 横或竖。 |
| `decorative` | `boolean` | `true` | 真：只是画一道线；假：role=separator 与 aria-orientation，读屏知道这里分了区域。 |

## States

- 横：1px 高；竖：1px 宽，取 line 色。
- decorative 默认真，读屏不报；decorative=false 才是 separator。

## Don't

- 不要用它占位留白，用间距。
- 不要在读屏需要知道分组的地方用装饰分隔，改 decorative=false 或用分组标题。

## Composition

```
Separator
```
