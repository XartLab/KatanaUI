// SPDX-License-Identifier: MIT
import { Info, TriangleAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Progress,
  TOAST_EXIT_MS,
  Toast,
  ToastClear,
  ToastClose,
  ToastContent,
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

export function ToastDemo() {
  const [items, setItems] = useState<Item[]>([])
  const next = useRef(1)
  const add = () => {
    const id = next.current++
    setItems((list) => [{ id, title: `演示提示 ${id}`, phase: 'entering' as const }, ...list])
    // 先画一帧 entering 再换成 open，过渡才有起点（AlertToasts 的写法）。
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setItems((list) => list.map((item) => (item.id === id ? { ...item, phase: 'open' as const } : item))),
      ),
    )
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
      <Row name="弹出">
        <Button onClick={add}>弹一条提示</Button>
        <p className="gal-note">提示叠在窗口右下角；两条以上多出「全部关掉」。收起走过渡，播完才摘节点。</p>
      </Row>
      <ToastViewport position="bottom-right" aria-label="演示提示" data-testid="toast-viewport">
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
