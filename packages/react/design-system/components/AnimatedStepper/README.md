# AnimatedStepper

步骤条：下单向导（选品种、填参数、确认）这类多步流程。当前步的圆点外扩一圈光环，完成的步打钩（笔画画出来），步与步之间的线随进度填满，下方内容按前进或后退方向滑入。横排与竖排两种。与 StepPlayer 的分工：StepPlayer 是回放控制，这个是用户自己填的流程进度。

## Provide

`*` marks a required prop.

### AnimatedStepper

currentStep 受控；allowClickNavigation 关着时步骤只能从外面改，圆点是禁用的。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `steps` * | `readonly AnimatedStepperStep[]` | — | The steps in order; each has a label and optional description, icon and content. |
| `labels` * | `AnimatedStepperLabels` | — | All the text read by screen readers; the package ships none. |
| `currentStep` | `number` | — | Current step (controlled); omit to let the component keep it. |
| `defaultStep` | `number` | `0` | Step shown first when uncontrolled. |
| `onStepChange` | `(step: number) => void` | — | Called with the new step index when the user moves. |
| `allowClickNavigation` | `boolean` | `false` | Let the user click or arrow to any step; off means the steps only move from outside. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Whether the steps run across or down. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AnimatedStepper } from '@katana-ui/react'

export function AnimatedStepperUsage() {
  return (
    <AnimatedStepper
      allowClickNavigation
      labels={{
        steps: 'Order steps',
        step: (n, label) => `Step ${n}: ${label}`,
        completed: 'completed',
        current: 'current',
      }}
      steps={[
        { label: 'Symbol', content: <p>Pick BTCUSDT.</p> },
        { label: 'Size', content: <p>0.50 at 106,900.</p> },
        { label: 'Confirm', content: <p>Review and submit.</p> },
      ]}
    />
  )
}
```

## States

- 未到：灰线圆点显示序号。
- 当前：强调色实心，外扩一圈光环。
- 完成：打钩，线填满。
- allowClickNavigation：点或方向键走任意步。

## Don't

- 不要超过 6 步：横排标题挤不下。
- 步骤互相独立可任意顺序时用 Tabs。

## Composition

```
AnimatedStepper
  div
    div（role=tablist）
      motion.button（role=tab）
    div（role=tabpanel）
      motion.div（内容）
```

## Keyboard

- `← → / ↑ ↓`：允许点击导航时在步骤间走
- `Tab`：焦点只停在当前步
