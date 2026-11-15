# JsonViewer

只读的 JSON 树：对象与数组可折叠，叶子按类型上色，上面一个查找框，命中的键名与值高亮、祖先自动展开。原始消息、Agent 调用结果、连接调试用它。功能参照 Arc，实现原创。

## Provide

`*` marks a required prop.

### JsonViewer

底座是 react-aria-components 的 Tree（角色 treegrid）。value 换了，展开状态重来。不是 JSON 的值（undefined、日期、bigint、循环引用）不抛错：画成看得见的字。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `unknown` | — | 要看的值，通常是 JSON.parse 的结果。 |
| `label` | `string` | — | 整棵树的读屏名。 |
| `labels` | `JsonViewerLabels` | — | 文字：search（查找框的读屏名与占位）、matches(n)（命中数）、more(n)（被截掉的子项）；包里不带语言。 |
| `defaultExpandDepth` | `number` | `1` | 一开始展开几层：1 只开根，2 连根的子容器。 |
| `maxChildren` | `number` | `200` | 一个容器最多画多少个子项，多出的折成一行「还有 N 项」。200 没有出处，是让一次展开最多出几百行的估计，待定。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { JsonViewer, type JsonViewerLabels } from '@katana-ui/react'

const JSON_LABELS: JsonViewerLabels = {
  search: '在 JSON 里查找',
  matches: (count) => (count === 0 ? '没有命中' : `${count} 处命中`),
  more: (count) => `还有 ${count} 项`,
}

// 演示用的消息：照 EventTimeline 卡的场景（300750、账户 A）编的，不是真实的行情或订单。

const JSON_SAMPLE = {
  type: 'order.update',
  symbol: '300750',
  filled: true,
  price: 201.35,
  tags: ['账户 A', '盘中'],
  orders: [
    { id: 'FILL-0231', side: 'buy', price: 201.3, qty: 200 },
    { id: 'FILL-0240', side: 'sell', price: 203.1, qty: 400 },
  ],
  error: null,
  history: Array.from({ length: 5 }, (_, i) => i * 10),
}

export function JsonViewerUsage() {
  return (
    <>
      <div className="gal-json" style={{ width: 360 }}>
        <JsonViewer label="消息" value={JSON_SAMPLE} labels={JSON_LABELS} />
      </div>

      <div className="gal-json" style={{ width: 360 }}>
        <JsonViewer
          label="长数组"
          value={{ rows: Array.from({ length: 12 }, (_, i) => ({ n: i })) }}
          labels={JSON_LABELS}
          defaultExpandDepth={2}
          maxChildren={4}
        />
      </div>
    </>
  )
}

// 演示事件：照卡里的场景（A 股 300750、账户 A / B、run 2e52），时刻与内容都是编的演示数据，不是真实的公告、告警或成交。
// 显示时区 Asia/Shanghai；A 股交易时段 09:30–11:30、13:00–15:00（午休压成短带）。
```

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
