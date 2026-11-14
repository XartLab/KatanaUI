# JsonViewer

只读的 JSON 树：对象与数组可折叠，叶子按类型上色，上面一个查找框，命中的键名与值高亮、祖先自动展开。原始消息、Agent 调用结果、连接调试用它。功能参照 Arc，实现原创。

## Provide

### JsonViewer

底座是 react-aria-components 的 Tree（角色 treegrid）。value 换了，展开状态重来。不是 JSON 的值（undefined、日期、bigint、循环引用）不抛错：画成看得见的字。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `unknown` | — | 要看的值，通常是 JSON.parse 的结果。 |
| `label` | `string` | — | 整棵树的读屏名。 |
| `labels` | `JsonViewerLabels` | — | 文字：search（查找框的读屏名与占位）、matches(n)（命中数）、more(n)（被截掉的子项）；包里不带语言。 |
| `defaultExpandDepth` | `number` | `1` | 一开始展开几层：1 只开根，2 连根的子容器。 |
| `maxChildren` | `number` | `200` | 一个容器最多画多少个子项，多出的折成一行「还有 N 项」。200 没有出处，是让一次展开最多出几百行的估计，待定。 |

## States

- 折叠的容器写概要：对象 {3}，数组 [5]；展开的箭头转 90 度。
- 叶子按类型上色：字符串琥珀、数字蓝、布尔与 null 橙。
- 查找：键名或叶子的字含查询词（不分大小写）就高亮，命中的祖先自动展开且查找期间收不掉；清空后回到你自己展开的样子。
- 超出 maxChildren：末尾一行「还有 N 项」。

## Don't

- 不要用它编辑或复制：它只读；要复制用 CodeBlock。
- 不要喂几十万行的值：它不做虚拟滚动，超大的先在数据层裁一刀，或调小 maxChildren。
- 不要拿它显示业务表格：规整的行列用 DataGrid。

## Composition

```
JsonViewer
  label > input[type=search] + span[role=status]
  Tree（react-aria）
    TreeItem × n（递归）：箭头、键名、概要或值
```

## Keyboard

- `↑ ↓`：上下走一行
- `→ / ←`：展开 / 收起，或进子级 / 回父级
- `Home / End`：第一行 / 最后一行
- `打字`：在树里：跳到以它开头的键名；在查找框里：查找
