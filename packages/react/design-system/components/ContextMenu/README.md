# ContextMenu

在区域上右键打开，行与皮肤同下拉菜单；Esc 只关最里面一层。

## Provide

### ContextMenu / ContextMenuTrigger / ContextMenuContent

其余属性透传给 Radix ContextMenu 的同名部件。触发器常用 asChild 套在要响应右键的元素上。

### ContextMenuItem

其余属性透传给 Radix ContextMenu.Item。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'danger'` | `'default'` | danger 字色走危险色。 |
| `onSelect` | `(event: Event) => void` | — | 选中（一次点击只叫一次）。 |

### 其余部件

与 DropdownMenu 的同名部件一一对应，属性也相同。

## States

- 行：默认、悬停、禁用、危险。
- 勾选行左侧占一列放勾。

## Don't

- 菜单项不超过一屏，更长的换命令面板。
- 常用动作也要有按钮入口，不只放在右键里。

## Composition

```
ContextMenu
  ContextMenuTrigger
  ContextMenuContent
    ContextMenuLabel
    ContextMenuItem（含 ContextMenuShortcut）
    ContextMenuSeparator
    ContextMenuCheckboxItem
    ContextMenuSub
      ContextMenuSubTrigger
      ContextMenuSubContent
```

## Keyboard

- `右键`：在触发区域上打开
- `↑ ↓`：在项之间走
- `→ / ←`：开、关二级菜单
- `Esc`：只关最里面一层；再按关整个菜单
