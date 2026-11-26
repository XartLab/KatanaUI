# Omnibox

品种、命令、页面、插件、问 AI 的统一入口，IDE 式工作台的主入口：分类页签带计数；空查询列「最近」（可清除）与各类前几条，占位轮播示例查询；选中对象（品种、策略）不直接打开、变成输入框里的标签，结果换成对它的操作，空输入退格删标签回全局；输入像问句时结果收起、右侧提示换成「问 ↵」；高亮行行尾显示回车动作，⌘/Ctrl+↵ 新标签打开；高亮的对象行浮出预览卡；高亮底色在行间滑动。结果异步（AbortSignal）。交互借 Jamie Merrill 的搜索系列（2026-11-24 看的录屏帧），样子是我们的。

## Provide

`*` marks a required prop.

### Omnibox

面板本体，可以直接摆进页里。底座是 Command（cmdk），过滤关掉，行的先后照 onQuery 返回的；类别、作用域、最近都能受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onQuery` * | `OmniboxQuery` | — | Search: return the matching items of every category (or, with a scope, that object's actions); may be async. |
| `onSelect` * | `(item: OmniboxItem, info: OmniboxSelectInfo) => void` | — | Called when a command or page is chosen (Enter or click), or any row with Ctrl or Command held. |
| `onAsk` | `(text: string, scope: OmniboxItem \| null) => void` | — | Called with the text and the scope when the text reads as a question and Enter is pressed. |
| `categories` * | `readonly OmniboxCategory[]` | — | Categories in order; the first is the "all" tab. |
| `category` | `string` | — | Controlled category id. |
| `defaultCategory` | `string` | — | Initial category id when uncontrolled. |
| `onCategoryChange` | `(category: string) => void` | — | Called when the category changes. |
| `scope` | `OmniboxItem \| null` | — | Controlled scope (the object turned into a tag), or null for none. |
| `defaultScope` | `OmniboxItem \| null` | `null` | Initial scope when uncontrolled. |
| `onScopeChange` | `(scope: OmniboxItem \| null) => void` | — | Called when a scope tag is set or removed. |
| `recent` | `readonly OmniboxItem[]` | — | Controlled recent items, newest first. |
| `onRecentChange` | `(recent: OmniboxItem[]) => void` | — | Called with the new recent list after a choice or after clearing. |
| `recentLimit` | `number` | `5` | Most recent items kept. |
| `perCategory` | `number` | `4` | Rows per category in the all tab before the "show all" row. |
| `placeholders` | `readonly string[]` | — | Example queries that rotate as the placeholder while the box is empty. |
| `placeholderInterval` | `number` | `2800` | Milliseconds each example stays. |
| `placeholderCycles` | `number` | `1` | How many rounds through the examples before it settles on `labels.placeholder`. |
| `detectIntent` | `(text: string) => boolean \| 'weak'` | `defaultIntent` | Decides whether the text reads as a question: true always asks, `'weak'` asks only when the search found nothing (long product names reach the length threshold), false never. |
| `defaultQuery` | `string` | `''` | Initial text in the input. |
| `debounceMs` | `number` | `80` | Delay before onQuery runs after typing, in ms. |
| `labels` * | `OmniboxLabels` | — | Text. |
| `className` | `string` | — | Extra class name on the root. |

### OmniboxDialog

Dialog 的 bare 皮：顶部 12dvh、宽 min(640px, 100vw−24px)。选中命令、页面与提问后默认关上（keepOpen 留着），对象变成标签时不关；每次打开重新挂载面板。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `onQuery` * | `OmniboxQuery` | — | Search: return the matching items of every category (or, with a scope, that object's actions); may be async. |
| `onSelect` * | `(item: OmniboxItem, info: OmniboxSelectInfo) => void` | — | Called when a command or page is chosen (Enter or click), or any row with Ctrl or Command held. |
| `onAsk` | `(text: string, scope: OmniboxItem \| null) => void` | — | Called with the text and the scope when the text reads as a question and Enter is pressed. |
| `categories` * | `readonly OmniboxCategory[]` | — | Categories in order; the first is the "all" tab. |
| `category` | `string` | — | Controlled category id. |
| `defaultCategory` | `string` | — | Initial category id when uncontrolled. |
| `onCategoryChange` | `(category: string) => void` | — | Called when the category changes. |
| `scope` | `OmniboxItem \| null` | — | Controlled scope (the object turned into a tag), or null for none. |
| `defaultScope` | `OmniboxItem \| null` | — | Initial scope when uncontrolled. |
| `onScopeChange` | `(scope: OmniboxItem \| null) => void` | — | Called when a scope tag is set or removed. |
| `recent` | `readonly OmniboxItem[]` | — | Controlled recent items, newest first. |
| `onRecentChange` | `(recent: OmniboxItem[]) => void` | — | Called with the new recent list after a choice or after clearing. |
| `recentLimit` | `number` | — | Most recent items kept. |
| `perCategory` | `number` | — | Rows per category in the all tab before the "show all" row. |
| `placeholders` | `readonly string[]` | — | Example queries that rotate as the placeholder while the box is empty. |
| `placeholderInterval` | `number` | — | Milliseconds each example stays. |
| `placeholderCycles` | `number` | — | How many rounds through the examples before it settles on `labels.placeholder`. |
| `detectIntent` | `(text: string) => boolean \| 'weak'` | — | Decides whether the text reads as a question: true always asks, `'weak'` asks only when the search found nothing (long product names reach the length threshold), false never. |
| `defaultQuery` | `string` | — | Initial text in the input. |
| `debounceMs` | `number` | — | Delay before onQuery runs after typing, in ms. |
| `labels` * | `OmniboxLabels` | — | Text. |
| `className` | `string` | — | Extra class name on the root. |
| `open` * | `boolean` | — | Whether the dialog is open. |
| `onOpenChange` * | `(open: boolean) => void` | — | Called to open or close (Esc, click outside, after a choice or a question). |
| `keepOpen` | `boolean` | `false` | Keep the dialog open after a choice. |

### detectIntent(text, options?)

默认的意图判定：问号结尾、疑问词开头、「吗 / 呢」收尾、超过 minLength（24）个字或 minWords（6）个词，返回 true。纯函数。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `minLength` | `number` | — | Text at least this long (characters) reads as a question. |
| `minWords` | `number` | — | Text with at least this many space-separated words reads as a question. |

### createIntentDetector(options?)

做一个带阈值的判定函数，传给 detectIntent 属性。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `minLength` | `number` | — | Text at least this long (characters) reads as a question. |
| `minWords` | `number` | — | Text with at least this many space-separated words reads as a question. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { BookOpenIcon, PlayIcon, WalletIcon } from 'lucide-react'
import { Omnibox, SymbolMark, type OmniboxItem } from '@katana-ui/react'

// 演示数据，不是行情。品种是对象：选中后变成输入框里的标签，结果换成对它的操作。
const ITEMS: readonly OmniboxItem[] = [
  {
    id: 'AAPL',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'AAPL',
    description: 'Apple Inc.',
    icon: <SymbolMark symbol="AAPL" name="Apple Inc." size="sm" />,
    meta: 'NASDAQ',
    preview: <strong>AAPL 189.84 +1.26%</strong>,
  },
  {
    id: 'AMD',
    category: 'symbol',
    kind: 'object',
    type: 'symbol',
    label: 'AMD',
    description: 'Advanced Micro Devices',
    icon: <SymbolMark symbol="AMD" name="Advanced Micro Devices" size="sm" />,
    meta: 'NASDAQ',
    preview: <strong>AMD 141.20 -0.84%</strong>,
  },
  { id: 'backtest', category: 'command', label: '收盘后跑回测', icon: <PlayIcon size={16} />, meta: '命令' },
  { id: 'book', category: 'command', label: '打开订单簿', icon: <BookOpenIcon size={16} />, meta: '命令' },
  { id: 'positions', category: 'page', kind: 'page', label: '持仓', icon: <WalletIcon size={16} />, meta: '交易' },
]

const ACTIONS: readonly OmniboxItem[] = [
  { id: 'chart', label: '开图' },
  { id: 'ticket', label: '下单草稿' },
  { id: 'news', label: '看新闻' },
]

export function OmniboxUsage() {
  return (
    <div style={{ width: 560 }}>
      <Omnibox
        categories={[
          { id: 'all', label: '全部' },
          { id: 'symbol', label: '品种' },
          { id: 'command', label: '命令' },
          { id: 'page', label: '页面' },
        ]}
        debounceMs={0}
        recent={[ITEMS[0]!]}
        onQuery={(query, scope) => {
          const needle = query.trim().toLowerCase()
          const pool = scope ? ACTIONS : ITEMS
          return pool.filter((item) => `${item.label} ${item.description ?? ''}`.toLowerCase().includes(needle))
        }}
        onSelect={() => {}}
        onAsk={() => {}}
        labels={{
          title: '万能框',
          placeholder: '搜品种、命令、页面，或直接提问',
          categories: '类别',
          recent: '最近',
          empty: '没有匹配项',
          loading: '搜索中…',
          removeScope: (name) => `移除 ${name}`,
          scopeHeading: (name) => `${name} 的操作`,
          hintRun: '运行',
          hintOpen: '打开',
          hintViewOptions: '查看选项',
          ask: '问',
          footer: { navigate: '导航', select: '选择', newTab: '新标签', close: '关闭' },
        }}
      />
    </div>
  )
}
```

## States

- 空查询：先「最近」（有记录时，可清除），再每类前 perCategory（默认 4）条，多的给一行「显示全部 N」（点它切到那一类的页签）。
- 有查询：各类分组，命中段加粗提亮；页签上写每类条数；Tab 与空输入里的 ← → 切页签。
- 作用域：选中对象行后输入框里出标签（带 ×），页签收起，结果是调用方按对象类型给的动作；空输入退格或点 × 删标签。
- 问句：强意图（问号、疑问词）收起结果区（inert）、右侧写「问 ↵」，回车调 onAsk(文字, 作用域)；只是够长的弱意图要等搜索确实没有结果才收起（长品种名不误判）；问句模式仍在后台搜，有结果时出「改为搜索」（或按 ↓）；没有任何结果时回车也去问。没给 onAsk 或 labels.ask 就不判定。
- 回车与结果：结果没回来按的回车先记着，结果到了且作用域、查询、页签都没变才生效；换页签、方向键、改字都作废。× 上按 Enter / 空格是删标签。禁用行不亮。
- 高亮行：底色是一块在行间滑动的元素；行尾 meta 换成回车动作（运行 / 打开 / 查看选项），按住 ⌘/Ctrl 时变「新标签打开」。
- 预览：高亮的对象行停约 140ms 后，面板右侧（放不下换左侧，都放不下就不出）浮出调用方渲染的预览卡。
- 输入法组字中：回车、Esc、退格、意图切换、搜索都不触发，组字结束才认最终的字。
- 动效不跟系统的「减少动态效果」（产品底线，theme/motion.css 头部）：占位只转 1 轮、悬停暂停、输入后消失；高亮滑动与问句收起照常。

## Don't

- 不要在包里写搜索逻辑、行情或文案：onQuery、预览、动作都由调用方给。
- 不要把必须读到的信息只放进预览卡：它不给读屏读，触屏也没有悬停。
- 不要拿它换掉 CommandPalette 的「最近的命令」或 SymbolSearch 的市场分段：只要命令用 CommandPalette，只找品种用 SymbolSearch。
- 不要在 onQuery 里再按页签过滤：页签在本地按 item.category 分、数条数，onQuery 返回各类的结果就行。

## Composition

```
OmniboxDialog（Dialog bare）
  Omnibox（Command）
    输入行：搜索图标 · 作用域标签（× 按钮）· cmdk 输入框（combobox）· 占位轮播 · 「问 ↵」
    页签（tablist，每类带数量）
    CommandList（listbox）
      接近度高亮（useProximityHighlight）
      CommandGroup「最近」（含清除选项）
      CommandGroup × 类别（行 · 「显示全部 N」）
    底栏键位提示
  预览卡
  role=status（结果个数、作用域变化）
```

## Keyboard

- `↑ ↓`：在结果间移动高亮（首尾循环）
- `Enter`：命令与页面：回调 onSelect；对象：变成作用域标签；问句：回调 onAsk
- `⌘/Ctrl + Enter`：对高亮行直接回调 onSelect，info.newTab 为 true（新标签打开由调用方做）
- `Tab / Shift+Tab`：下一个 / 上一个页签（首尾相接）
- `← →`：输入框为空且没有标签时切页签；有字时是移光标
- `Backspace`：输入框为空时删掉作用域标签，回到全局
- `Esc`：关闭对话框，焦点回到打开前的地方；输入法组字中不关
