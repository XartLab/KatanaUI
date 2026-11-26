// SPDX-License-Identifier: MIT
import { useRef, useState } from 'react'
import { Button, ToastStack, type ToastStackHandle, type ToastStackItem, type ToastStackLabels } from '../../src/index'
import { Row } from './parts'

// 叠放的弹出提示的演示（#195）。文案与数据都是演示用的。

const LABELS: ToastStackLabels = { region: '叠放提示演示', close: '关掉这条提示' }

/** 带「撤销」的一条：点了这一条原地换成「已恢复」，不另弹一条。 */
const undoable = (n: number): Omit<ToastStackItem, 'id'> => ({
  title: `已移出自选 ACME-${n}`,
  description: `ACME-${n} 不在自选里了（示例）`,
  action: {
    label: '撤销',
    result: { title: '已恢复', description: `ACME-${n} 回到自选（示例）` },
  },
})

const alertItem = (n: number): Omit<ToastStackItem, 'id'> => ({
  title: `告警 ${n}：BTCUSDT 上穿 106,000`,
  description: '价格穿越，触发价 106,012.4（示例）',
})

/** 摆给演示用的一个固定高度的舞台：叠放层 inline 地放在里面，新的贴着舞台下沿。 */
function Stage({ children, top = false }: { children: React.ReactNode; top?: boolean }) {
  return (
    <div
      style={{ width: 340, height: 380, display: 'flex', alignItems: top ? 'flex-start' : 'flex-end' }}
      data-gallery-toast-stage
    >
      {children}
    </div>
  )
}

/** 受控的另一种用法：调用方不让关（onItemsChange 里拒绝变短的表），叠放层不会自己把被拒绝的变更带进去。 */
function RejectingStack() {
  const [items, setItems] = useState<ToastStackItem[]>(
    ['A', 'B', 'C'].map((name) => ({
      id: `r${name}`,
      title: `条目 ${name}（调用方不让关）`,
      description: '关闭钮点了没反应，条目表不变（示例）',
      duration: Infinity,
      // 最前面的 C 带动作钮：被拒绝的关闭不能让它的结果态换不成。
      ...(name === 'C'
        ? { action: { label: '撤销', result: { title: '已恢复', description: '换成结果态不算变短，调用方接受' } } }
        : {}),
    })),
  )
  const [rejected, setRejected] = useState(0)
  return (
    <>
      <Stage>
        <ToastStack
          inline
          labels={{ region: '拒绝关闭的叠放提示演示', close: '关掉这条提示' }}
          items={items}
          onItemsChange={(next) => {
            if (next.length < items.length) {
              setRejected((n) => n + 1)
              return
            }
            setItems(next)
          }}
        />
      </Stage>
      <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
        <Button
          onClick={() =>
            setItems((list) => [
              ...list,
              {
                id: `r${list.length}`,
                title: `条目 ${list.length + 1}`,
                description: '调用方压的（示例）',
                duration: Infinity,
              },
            ])
          }
        >
          压一条
        </Button>
        <p className="gal-note" data-testid="rejecting-count">
          条目表 {items.length} 条，拒绝了 {rejected} 次关闭
        </p>
      </div>
    </>
  )
}

export function ToastStackDemo() {
  const stack = useRef<ToastStackHandle>(null)
  const count = useRef(0)
  const next = () => ++count.current
  const [controlled, setControlled] = useState<ToastStackItem[]>([
    { id: 'c1', title: '委托已成交', description: 'ACME 买入 100 股（示例）', tone: 'ok', duration: Infinity },
    { id: 'c2', title: '行情延迟', description: '落后 5 分钟（示例）', tone: 'warn', duration: Infinity },
    { id: 'c3', ...undoable(9), duration: Infinity },
  ])
  return (
    <>
      <Row name="弹出">
        <Button onClick={() => stack.current?.push(alertItem(next()))}>推一条</Button>
        <Button onClick={() => stack.current?.push(undoable(next()))}>推一条带撤销的</Button>
        <Button onClick={() => stack.current?.push({ ...alertItem(next()), duration: 2000 })}>
          推一条（2 秒后收）
        </Button>
        <Button
          onClick={() => {
            for (let i = 0; i < 3; i++) stack.current?.push(alertItem(next()))
          }}
        >
          连推三条
        </Button>
        <Button variant="ghost" onClick={() => stack.current?.clear()}>
          清空
        </Button>
        <p className="gal-note">
          不受控：用 ref 的 push 压进来，定时与最多条数（5）由叠放层管。指针移进或 Tab
          进去就展开，展开时不走时；横向拖过一大半或甩出去就关。
        </p>
      </Row>
      <Row name="叠放（不受控）">
        <Stage>
          <ToastStack ref={stack} inline labels={LABELS} duration={15_000} />
        </Stage>
      </Row>
      <Row name="受控（上角，往下叠）">
        <Stage top>
          <ToastStack
            inline
            position="top-right"
            labels={{ region: '受控的叠放提示演示', close: '关掉这条提示' }}
            items={controlled}
            onItemsChange={setControlled}
          />
        </Stage>
        <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
          <Button
            onClick={() =>
              setControlled((list) => [...list, { id: `c${Date.now()}`, ...alertItem(next()), duration: Infinity }])
            }
          >
            调用方压一条
          </Button>
          <p className="gal-note" data-testid="controlled-count">
            调用方的条目表里有 {controlled.length} 条
          </p>
        </div>
      </Row>
      <Row name="受控（调用方拒绝关闭）">
        <RejectingStack />
      </Row>
    </>
  )
}

/** 三种静态状态（组件截图用；文字用英文：截图基线在不同机器上不依赖中文字体）：收拢、展开、撤销后的结果态；都不走时、不接指针。 */
export function ToastStackStates() {
  const three: ToastStackItem[] = [
    { id: 'a', title: 'BTCUSDT crossed 106,000', description: 'Trigger price 106,012.4', duration: Infinity },
    { id: 'b', title: 'Order filled', description: 'Bought 100 ACME', tone: 'ok', duration: Infinity },
    {
      id: 'c',
      title: 'Removed from watchlist',
      description: 'ACME was removed',
      action: { label: 'Undo', result: { title: 'Restored' } },
      duration: Infinity,
    },
  ]
  const restored: ToastStackItem[] = [
    three[0]!,
    three[1]!,
    {
      id: 'c',
      tone: 'ok',
      title: 'Restored',
      description: 'ACME is back',
      duration: Infinity,
    },
  ]
  const frame = (name: string, items: ToastStackItem[], expanded: boolean, height: number) => (
    <div
      key={name}
      data-gallery-toast-state={name}
      style={{ width: 340, height, display: 'flex', alignItems: 'flex-end' }}
    >
      <ToastStack
        inline
        labels={{ region: 'Stacked toasts', close: 'Dismiss' }}
        items={items}
        expanded={expanded}
        duration={Infinity}
      />
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      {frame('collapsed', three, false, 100)}
      {frame('expanded', three, true, 230)}
      {frame('restored', restored, true, 230)}
    </div>
  )
}
