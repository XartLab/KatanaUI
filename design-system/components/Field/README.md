# Field

标签加控件加说明加错误排成一组，并把它们的 ARIA 关联好：标签点一下聚焦控件，说明与错误进控件的 aria-describedby，出错时 aria-invalid、错误条 role=alert。

## Provide

### Field

其余属性透传给 div。控件调 useFieldControl() 拿 { id, aria-describedby, aria-invalid, disabled } 展开到自己身上。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | 标签在上，或标签与说明在左、控件在右。 |
| `invalid` | `boolean` | `false` | 标签变危险色、控件 aria-invalid、FieldError 才显示。 |
| `disabled` | `boolean` | `false` | 标签降到 45%，控件 disabled。 |

### FieldError

Field 的 invalid 为真才渲染；children 是调用方写的话。

### Label

其余属性透传给 Radix Label.Root。不在 Field 里单独用也行。

### FieldLabel / FieldDescription / FieldContent / FieldGroup / FieldSet / FieldLegend / FieldSeparator

## States

- 默认：标签、控件、说明。
- invalid：标签变危险色、控件 aria-invalid、FieldError 显示并进 aria-describedby。
- disabled：控件禁用，标签降到禁用样式。

## Don't

- 不要在 Field 外面调用 useFieldControl 还指望有关联。
- 不要只靠红色表示出错，要写错误文字。
- 不要把标签藏起来，要隐藏用 sr-only。

## Composition

```
FieldSet
  FieldLegend
  FieldGroup
    Field
      FieldLabel（或 FieldContent 里 FieldLabel + FieldDescription）
      控件（useFieldControl）
      FieldDescription
      FieldError
    FieldSeparator
```

## Keyboard

- `Tab`：控件按自己的方式走；点标签聚焦控件
