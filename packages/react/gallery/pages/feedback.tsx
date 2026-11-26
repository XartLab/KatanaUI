// SPDX-License-Identifier: MIT
import { Info, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Progress,
  TOAST_EXIT_MS,
  Toast,
  ToastAction,
  ToastClear,
  ToastClose,
  ToastContent,
  ToastCountdown,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
  ToastViewport,
  type ToastPhase,
} from '../../src/index'
import { Row } from './parts'

// 弹出提示、行内提示、进度条的演示。文案与数值都是演示用的。

type Item = { id: number; title: string; phase: ToastPhase }

/** 撤销演示：5 秒内可撤销，指针或焦点在上面时停表；撤销后字变「已恢复」，约 1.5 秒后收。 */
const UNDO_MS = 5000
const RESTORED_MS = 1500
type Undo = { phase: ToastPhase; restored: boolean; remaining: number }

export function ToastDemo() {
  const [items, setItems] = useState<Item[]>([])
  const next = useRef(1)
  const add = () => {
    const id = next.current++
    setItems((list) => [{ id, title: `演示提示 ${id}`, phase: 'entering' as const }, ...list])
    // 先画一帧 entering 再换成 open，过渡才有起点（AlertToasts 的写法）。
    // 只把还在 entering 的换成 open：两帧还没到就点了叉的那条已是 closing，不能被改回 open（改回去收起的定时器就摘不掉它）。
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setItems((list) =>
          list.map((item) =>
            item.id === id && item.phase === 'entering' ? { ...item, phase: 'open' as const } : item,
          ),
        ),
      ),
    )
  }
  // 撤销演示的计时在调用方（这里）：包里的 ToastCountdown 只画剩余比例。
  const [undo, setUndo] = useState<Undo | null>(null)
  const clock = useRef({
    elapsed: 0,
    last: 0,
    paused: false,
    timer: undefined as ReturnType<typeof setInterval> | undefined,
  })
  const stopClock = () => clearInterval(clock.current.timer)
  useEffect(() => stopClock, [])
  const dismissUndo = () => {
    stopClock()
    setUndo((current) => (current ? { ...current, phase: 'closing' } : current))
    setTimeout(() => setUndo(null), TOAST_EXIT_MS)
  }
  const startUndo = () => {
    stopClock()
    clock.current = { elapsed: 0, last: performance.now(), paused: false, timer: undefined }
    setUndo({ phase: 'entering', restored: false, remaining: 1 })
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setUndo((current) => (current && current.phase === 'entering' ? { ...current, phase: 'open' } : current)),
      ),
    )
    clock.current.timer = setInterval(() => {
      const now = performance.now()
      if (!clock.current.paused) clock.current.elapsed += now - clock.current.last
      clock.current.last = now
      const remaining = Math.max(0, 1 - clock.current.elapsed / UNDO_MS)
      setUndo((current) => (current && !current.restored ? { ...current, remaining } : current))
      if (remaining === 0) dismissUndo()
    }, 100)
  }
  const restore = () => {
    stopClock()
    setUndo((current) => (current ? { ...current, restored: true } : current))
    setTimeout(dismissUndo, RESTORED_MS)
  }
  const pauseUndo = (paused: boolean) => {
    clock.current.paused = paused
    clock.current.last = performance.now()
  }
  const close = (id?: number) => {
    setItems((list) => list.map((item) => (id === undefined || item.id === id ? { ...item, phase: 'closing' } : item)))
    setTimeout(() => setItems((list) => list.filter((item) => item.phase !== 'closing')), TOAST_EXIT_MS)
  }
  return (
    <>
      <Row name="一条（静态摆出）">
        <div style={{ width: 340 }}>
          <Toast>
            <ToastContent>
              <ToastIcon />
              <ToastText>
                <ToastTitle>BTCUSDT 上穿 106,000</ToastTitle>
                <ToastDescription>价格穿越，触发价 106,012.4（示例）</ToastDescription>
              </ToastText>
              <ToastClose label="关掉这条提示" />
            </ToastContent>
          </Toast>
        </div>
      </Row>
      <Row name="语气">
        <div style={{ width: 340, display: 'grid', gap: 8 }} data-gallery-toast-tones>
          <Toast tone="ok" data-testid="toast-ok">
            <ToastContent>
              <ToastIcon />
              <ToastText>
                <ToastTitle>委托已成交</ToastTitle>
                <ToastDescription>ACME 买入 100 股（示例）</ToastDescription>
              </ToastText>
            </ToastContent>
          </Toast>
          <Toast tone="warn" data-testid="toast-warn">
            <ToastContent>
              <ToastIcon />
              <ToastText>
                <ToastTitle>行情延迟</ToastTitle>
                <ToastDescription>落后 5 分钟（示例）</ToastDescription>
              </ToastText>
            </ToastContent>
          </Toast>
          <Toast tone="danger" data-testid="toast-danger">
            <ToastContent>
              <ToastIcon />
              <ToastText>
                <ToastTitle>下单被拒</ToastTitle>
                <ToastDescription>可用保证金不足（示例）</ToastDescription>
              </ToastText>
            </ToastContent>
          </Toast>
        </div>
      </Row>
      <Row name="弹出">
        <Button onClick={add}>弹一条提示</Button>
        <p className="gal-note">提示叠在窗口右下角；两条以上多出「全部关掉」。收起走过渡，播完才摘节点。</p>
      </Row>
      <Row name="撤销">
        <Button onClick={startUndo}>删除一条画线</Button>
        <p className="gal-note">
          能撤销的操作先做、再给「撤销」：5 秒内可撤，停在上面时停表，环随剩余时间变短；撤销后字变「已恢复」，约 1.5
          秒后收。不能撤销的事先确认（AlertDialog），不要事后弹 toast。
        </p>
      </Row>
      <ToastViewport position="bottom-right" aria-label="演示提示" data-testid="toast-viewport">
        {undo ? (
          <Toast
            phase={undo.phase}
            data-testid="toast-undo"
            onPointerEnter={() => pauseUndo(true)}
            onPointerLeave={() => pauseUndo(false)}
            onFocus={() => pauseUndo(true)}
            onBlur={() => pauseUndo(false)}
          >
            <ToastContent>
              <ToastIcon />
              <ToastText>
                <ToastTitle>{undo.restored ? '已恢复' : '已删除画线'}</ToastTitle>
                {undo.restored ? null : <ToastDescription>趋势线 BTCUSDT 1H（示例）</ToastDescription>}
              </ToastText>
              {undo.restored ? null : (
                <>
                  <ToastCountdown remaining={undo.remaining} data-testid="toast-undo-countdown" />
                  <ToastAction onClick={restore}>撤销</ToastAction>
                </>
              )}
              <ToastClose label="关掉这条提示" onClick={dismissUndo} />
            </ToastContent>
          </Toast>
        ) : null}
        {items.map((item) => (
          <Toast key={item.id} phase={item.phase} data-testid="toast">
            <ToastContent>
              <ToastIcon />
              <ToastText>
                <ToastTitle>{item.title}</ToastTitle>
                <ToastDescription>点右边的叉关掉</ToastDescription>
              </ToastText>
              <ToastClose label="关掉这条提示" onClick={() => close(item.id)} />
            </ToastContent>
          </Toast>
        ))}
        {items.length > 1 ? <ToastClear onClick={() => close()}>{`全部关掉（${items.length}）`}</ToastClear> : null}
      </ToastViewport>
    </>
  )
}

export function AlertDemo() {
  return (
    <div className="gal-wide" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Alert data-testid="alert-default">
        <Info />
        <AlertTitle>本机服务未连接</AlertTitle>
        <AlertDescription>行情走模拟源，连上以后自动切换。</AlertDescription>
      </Alert>
      <Alert tone="ok" data-testid="alert-ok">
        <AlertTitle>已同步</AlertTitle>
        <AlertDescription>台账与券商一致。</AlertDescription>
      </Alert>
      <Alert tone="warn" data-testid="alert-warn">
        <TriangleAlert />
        <AlertTitle>接近日亏损限额</AlertTitle>
        <AlertDescription>已用 80%，到 100% 会锁交易。</AlertDescription>
      </Alert>
      <Alert tone="danger" data-testid="alert-danger">
        <TriangleAlert />
        <AlertTitle>下单被拒</AlertTitle>
        <AlertDescription>可用保证金不足。</AlertDescription>
      </Alert>
    </div>
  )
}

export function ProgressDemo() {
  const [value, setValue] = useState(30)
  return (
    <>
      <Row name="进度">
        <div className="gal-wide">
          <Progress aria-label="演示进度" value={value} data-testid="progress" />
        </div>
        <output data-testid="progress-value">{value}</output>
        <Button size="sm" onClick={() => setValue((v) => Math.min(100, v + 20))}>
          加 20
        </Button>
      </Row>
      <Row name="色调">
        <div className="gal-wide" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Progress aria-label="ok" value={60} tone="ok" data-testid="progress-ok" />
          <Progress aria-label="warn" value={75} tone="warn" />
          <Progress aria-label="danger" value={95} tone="danger" />
        </div>
      </Row>
      <Row name="不确定">
        <div className="gal-wide">
          <Progress aria-label="不确定进度" data-testid="progress-indeterminate" />
        </div>
      </Row>
    </>
  )
}
