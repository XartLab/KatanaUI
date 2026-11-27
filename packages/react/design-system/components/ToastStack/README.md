# ToastStack

可选的叠放层，套在 Toast 零件外面：多条时只露最新一条、后面的缩小上移变淡（最多 3 层），指针移进或 Tab 进去展开成列表，横向拖过约 40% 或甩出去就关，带动作钮的条点了原地变成结果态（如「已恢复」）。定时、暂停、最多条数由它管；条目表受控或不受控都行。旧的 Toast 零件不变。

## Provide

`*` marks a required prop.

### ToastStack

items / onItemsChange 受控，defaultItems 加 ref 的 push、dismiss、clear 不受控（受控时 ref 也能用，结果经 onItemsChange 交回）。条目表从旧到新，最后一条在最前面。labels（region、close）必填，包里不带文案。duration、resultDuration、max 管计时与条数；expanded、paused 供外部强制；inline 不固定在窗口一角（文档与截图）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ToastStackItem[]` | — | Controlled list of toasts, oldest first: the last one is the front. |
| `defaultItems` | `ToastStackItem[]` | — | Initial list when uncontrolled; push through the ref afterwards. |
| `onItemsChange` | `(items: ToastStackItem[]) => void` | — | Called with the next list whenever a toast is pushed, dismissed, expires, settles into its result or is trimmed by max. |
| `labels` * | `ToastStackLabels` | — | Accessible names (required; the package ships no text): region is the live region's aria-label, close names every close button. |
| `position` | `ToastPosition` | `'bottom-right'` | Which corner (default bottom-right): at the bottom corners the newest sits on the window edge and older ones peek upward; at the top corners the reverse. |
| `max` | `number` | `5` | Most toasts kept (default 5); the oldest goes first. |
| `duration` | `number` | `5000` | Default time on screen in ms (default 5000, Infinity never expires); an item's own duration wins. |
| `resultDuration` | `number` | `2400` | How long a result state stays after its action button was clicked, in ms (default 2400). |
| `expanded` | `boolean` | — | Force expanded or collapsed; leave it out to follow the pointer and keyboard focus (true also pauses the timers). |
| `paused` | `boolean` | `false` | Pause every timer from outside; expanded, hovered, keyboard-focused, touch-opened stacks and a hidden page (tab switched away) already pause by themselves. |
| `inline` | `boolean` | `false` | Render in the document flow instead of fixed to a window corner (docs and screenshots). |
| `className` | `string` | — | Extra classes for the viewport region. |
| `ref` | `Ref<ToastStackHandle>` | — | Handle with push, dismiss and clear; works when controlled too, the result goes out through onItemsChange. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useRef } from 'react'
import { Button, ToastStack, type ToastStackHandle } from '@katana-ui/react'

export function ToastStackUsage() {
  const stack = useRef<ToastStackHandle>(null)
  return (
    <>
      <Button
        onClick={() =>
          stack.current?.push({
            title: 'Watchlist item removed',
            description: 'ACME is no longer on your watchlist',
            // Clicking Undo turns this same toast into the result below; no second toast appears.
            action: { label: 'Undo', result: { title: 'Restored', description: 'ACME is back on your watchlist' } },
          })
        }
      >
        Remove
      </Button>
      <ToastStack ref={stack} labels={{ region: 'Notifications', close: 'Dismiss' }} />
    </>
  )
}
```

## States

- 收拢：只露最新一条，后面每层缩小 5%、上移 8px、变淡（不透明度 0.8、0.55），第四层起淡掉；后面的条压成最前面那条的高度，露的只是边。
- 展开：指针移进（触屏的 pointerenter 不算）或键盘 Tab 进来；触屏点一下叠层（不是点在钮上），点叠层外收回；条间距 8px，都是原大小；移出或焦点离开收回。条目清空时悬停与触屏展开状态一并复位。
- 计时：每条自己的停留时间（默认 5 秒），展开、指针在上面、键盘焦点在条里、页面不可见（切走标签页）时暂停，走开后接着剩下的，不从头。
- 焦点：关掉有焦点的一条，焦点去相邻一条的关闭钮；最后一条（或被 max 裁掉）就还给进叠层前的元素。看不见的层与退场中的条是 inert。
- 滑动关：横向拖，拖过条宽 40%，或松手速度 ≥ 500px/s 且已拖开 24px，往那边滑出并关；不够弹回。拖的时候越远越透明。
- 撤销就地变状态：action.result 给了，点钮后这一条原地换成结果（默认 ok 语气，停留 2.4 秒），不新增条目；没给 result，点了就关。
- 补位：关掉一条，其余走 snappy 弹簧（位置、高度、缩放）补上。
- 减弱动效（prefers-reduced-motion）：不缩放、不滑、不接手势；收拢只留最前面一条，别的淡出；展开瞬间摆好，只淡入淡出。

## Don't

- 不要把要用户处理的事只放进带动作钮的提示里，它会自己消失；动作也要在界面别处有入口。
- 不要在包里写死文案：region、close、动作钮的字、结果态的字都由调用方传。
- 不要拿 ToastViewport 再包一层 ToastStack，它自己就渲染 ToastViewport。
- 不要把条目表一半交给调用方、一半放 ref：给了 items 就都由调用方管。

## Composition

```
ToastStack（渲染 ToastViewport）
  li ×N
    Toast
      ToastContent
        ToastIcon
        ToastText
          ToastTitle
          ToastDescription
        动作钮（有 action 时）
        ToastClose
```

## Keyboard

- `Tab`：进入叠层即展开；依次走到每条的动作钮与关闭钮
- `Enter / Space`：点动作钮（原地变结果态）或关闭钮
- `Esc`：关掉焦点所在的那一条，焦点移到相邻一条
