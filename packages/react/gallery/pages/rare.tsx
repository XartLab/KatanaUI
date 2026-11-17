// SPDX-License-Identifier: MIT
import { useEffect, useState } from 'react'
import { LiveToggle } from '../LiveToggle.tsx'
import { chance, pick, useLiveTicker, type Rng } from '../live-sim.ts'
import {
  AiStatus,
  ARCADE_SPRITES,
  ArcadePixel,
  Button,
  DeleteButton,
  MatrixOrb,
  NotificationBell,
  PasswordInput,
  Slider,
  StatusIcon,
  ToggleGroup,
  ToggleGroupItem,
  type AiStatusState,
  type ArcadePixelAnimate,
  type OrbState,
  type StatusIconStatus,
  useEnterMarks,
} from '../../src/index'
import { Cell, Row } from './parts'

// #1861：学 rare-ui 的交互、本仓库重写的六件的演示。数据与文字都是演示用的。

export function PasswordInputDemo() {
  const [visible, setVisible] = useState(false)
  return (
    <>
      <Row name="默认">
        <div className="gal-wide">
          <PasswordInput
            labels={{ toggle: '显示密钥' }}
            defaultValue="demo-secret-0123456789"
            aria-label="API 密钥"
            onVisibleChange={setVisible}
          />
        </div>
        <output data-gallery-visible>{visible ? '显示中' : '已遮住'}</output>
      </Row>
      <Row name="sm · 空">
        <div className="gal-wide">
          <PasswordInput labels={{ toggle: '显示口令' }} size="sm" placeholder="代理口令" aria-label="代理口令" />
        </div>
      </Row>
      <Row name="禁用">
        <div className="gal-wide">
          <PasswordInput labels={{ toggle: '显示' }} disabled defaultValue="locked" aria-label="已锁定" />
        </div>
      </Row>
      <p className="gal-note">点眼睛显示或遮住，输入框不丢焦点、选区还在；按钮的名字不变，状态看 aria-pressed。</p>
    </>
  )
}

export function DeleteButtonDemo() {
  const [deleted, setDeleted] = useState(0)
  const [kept, setKept] = useState(0)
  return (
    <>
      <Row name="默认">
        <DeleteButton
          label="删除工作区"
          labels={{ confirm: '确认删除', cancel: '取消', done: '已删除', kept: '已取消' }}
          onConfirm={() => setDeleted((n) => n + 1)}
          onCancel={() => setKept((n) => n + 1)}
        />
        <output data-gallery-delete>
          删除 {deleted} 次 · 取消 {kept} 次
        </output>
      </Row>
      <Row name="禁用">
        <DeleteButton label="删除（不可用）" labels={{ confirm: '确认', cancel: '取消' }} disabled />
      </Row>
      <p className="gal-note">点一下只展开，不执行；展开后焦点在「取消」上，Esc 或点外面都是取消，点勾才执行。</p>
    </>
  )
}

// 实时模拟（演示）：每 3 秒一拍，约四成来一条通知，第一拍必来；铃的未读数 = 列表里没读的条数，来新的铃闪、列表新条高亮。
const LIVE_NOTICES = [
  '成交回报：600001 买入 200 股',
  '价位提醒：300750 上破 202.00',
  'run 2e52 已完成',
  '公告：回购进展',
]
type LiveNotice = { id: string; text: string }
function noticeStep(list: readonly LiveNotice[], rng: Rng, tick: number): readonly LiveNotice[] {
  if (tick > 0 && !chance(rng, 0.4)) return list
  return [{ id: `live-${tick}`, text: pick(rng, LIVE_NOTICES) }, ...list].slice(0, 6)
}

function LiveNotifications() {
  const { state: list } = useLiveTicker<readonly LiveNotice[]>([], noticeStep, { intervalMs: 3000 })
  const [read, setRead] = useState<ReadonlySet<string>>(new Set())
  const unread = list.filter((n) => !read.has(n.id)).length
  const entering = useEnterMarks(list.map((n) => n.id))
  return (
    <div data-testid="bell-live" style={{ display: 'grid', gap: 8, width: 320 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
        <NotificationBell count={unread} label={`实时提醒，${unread} 条未读`} />
        <Button size="sm" onClick={() => setRead(new Set(list.map((n) => n.id)))}>
          全部已读
        </Button>
      </div>
      <ul aria-label="通知列表" data-slot="live-notices" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {list.map((n) => (
          <li
            key={n.id}
            className={entering.has(n.id) ? 'k-live-enter' : undefined}
            style={{ padding: '4px 8px', font: 'var(--text-data) var(--font-sans)' }}
          >
            {n.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function NotificationBellDemo() {
  const [count, setCount] = useState(0)
  return (
    <>
      <Row name="数字">
        <NotificationBell count={count} label={`提醒，${count} 条未读`} />
        <output data-gallery-bell>{count}</output>
      </Row>
      <Row name="上限 9">
        <NotificationBell count={count} max={9} label={`提醒，${count} 条未读`} />
      </Row>
      <Row name="圆点">
        <NotificationBell count={count} variant="dot" label={`提醒，${count > 0 ? '有未读' : '没有未读'}`} />
      </Row>
      <Row>
        <Button onClick={() => setCount((n) => n + 1)}>来 1 条</Button>
        <Button onClick={() => setCount((n) => n + 5)}>来 5 条</Button>
        <Button onClick={() => setCount((n) => Math.max(0, n - 1))}>读 1 条</Button>
        <Button onClick={() => setCount(0)}>全部已读</Button>
        <Button onClick={() => setCount(120)}>120 条</Button>
      </Row>
      <Row name="实时">
        <LiveNotifications />
      </Row>
      <p className="gal-note">数变多铃摆一下，力度跟增量走；变少、清零不摆。数字按增减方向滚。</p>
    </>
  )
}

const STATUSES: readonly StatusIconStatus[] = ['success', 'error', 'warning', 'info', 'pending']

export function StatusIconDemo() {
  const [status, setStatus] = useState<StatusIconStatus>('pending')
  return (
    <>
      <Row name="五种">
        {STATUSES.map((item) => (
          <Cell key={item} name={item}>
            <StatusIcon status={item} label={`状态 ${item}`} />
          </Cell>
        ))}
      </Row>
      <Row name="换状态">
        <div data-gallery-status>
          <StatusIcon status={status} label={`当前 ${status}`} />
        </div>
        <Button onClick={() => setStatus('pending')}>进行中</Button>
        <Button onClick={() => setStatus('success')}>成功</Button>
        <Button onClick={() => setStatus('error')}>失败</Button>
      </Row>
      <p className="gal-note">对勾与叉一笔一笔画出来；进行中的弧先退出，结果图标再弹入。</p>
    </>
  )
}

const AI_STATES: readonly { state: AiStatusState; label: string }[] = [
  { state: 'thinking', label: '思考中' },
  { state: 'searching', label: '检索中' },
  { state: 'writing', label: '编写中' },
  { state: 'done', label: '完成' },
  { state: 'error', label: '出错了' },
]

export function AiStatusDemo() {
  const [state, setState] = useState<AiStatusState>('thinking')
  const [elapsed, setElapsed] = useState(0)
  const active = state === 'thinking' || state === 'searching' || state === 'writing'
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(timer)
  }, [active])
  const current = AI_STATES.find((item) => item.state === state)!
  return (
    <>
      <Row name="当前">
        <AiStatus
          state={state}
          label={current.label}
          detail={state === 'searching' ? 'docs/product/README.md' : undefined}
          elapsed={elapsed}
        />
      </Row>
      <Row name="切换">
        {AI_STATES.map((item) => (
          <Button
            key={item.state}
            onClick={() => {
              setState(item.state)
              if (item.state === 'thinking') setElapsed(0)
            }}
          >
            {item.state}
          </Button>
        ))}
      </Row>
      <Row name="五种">
        {AI_STATES.map((item) => (
          <AiStatus key={item.state} state={item.state} label={item.label} />
        ))}
      </Row>
      <p className="gal-note">进行中的文字有流光，结束就停；换状态时图标缩放着换、文字上下滑着换，整行宽度弹簧伸缩。</p>
    </>
  )
}

const ORB_STATES: readonly { state: OrbState; label: string }[] = [
  { state: 'idle', label: '空闲' },
  { state: 'listening', label: '聆听' },
  { state: 'thinking', label: '思考' },
  { state: 'streaming', label: '流式' },
  { state: 'done', label: '完成' },
  { state: 'error', label: '出错' },
]

export function MatrixOrbDemo() {
  const [state, setState] = useState<OrbState>('idle')
  const [level, setLevel] = useState(0.6)
  return (
    <>
      <Row name="可切换">
        <div data-gallery-orb>
          <MatrixOrb state={state} level={state === 'listening' ? level : undefined} label={`状态球：${state}`} />
        </div>
        <ToggleGroup
          size="sm"
          value={state}
          onValueChange={(next) => next && setState(next as OrbState)}
          aria-label="状态"
        >
          {ORB_STATES.map((item) => (
            <ToggleGroupItem key={item.state} value={item.state}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {state === 'listening' ? (
          <div className="gal-orb-level">
            <span>输入电平</span>
            <Slider
              value={[level]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(next) => setLevel(next[0] ?? 0)}
              thumbLabels={['输入电平']}
            />
          </div>
        ) : null}
      </Row>
      <Row name="三种">
        {ORB_STATES.map((item) => (
          <Cell key={item.state} name={item.label}>
            <MatrixOrb state={item.state} label={`状态球：${item.label}`} cells={12} />
          </Cell>
        ))}
      </Row>
      <p className="gal-note">
        方点排成圆：待命慢呼吸、聆听同心波跟输入电平走、思考几个热点绕着转；换状态时权重插值，整个球按弹簧缩放。
      </p>
    </>
  )
}

const ARCADE_ANIMATES: ArcadePixelAnimate[] = ['none', 'type', 'wipe', 'blink', 'marquee']

export function ArcadePixelDemo() {
  const [run, setRun] = useState(0)
  return (
    <>
      <Row name="文字">
        <div data-gallery-arcade>
          <ArcadePixel text="KATANA" pixelSize={6} />
        </div>
        <ArcadePixel text="READY 01" pixelSize={4} />
        <ArcadePixel text="GAME OVER" pixelSize={4} palette={['transparent', 'var(--ink-100)']} />
      </Row>
      <Row name="精灵">
        {Object.entries(ARCADE_SPRITES).map(([name, sprite]) => (
          <Cell key={name} name={name}>
            <ArcadePixel
              sprite={sprite}
              pixelSize={5}
              palette={['transparent', 'var(--signal-orange)', 'var(--ink-100)']}
            />
          </Cell>
        ))}
      </Row>
      <Row name="动画">
        {ARCADE_ANIMATES.map((animate) => (
          <Cell key={animate} name={animate}>
            <ArcadePixel
              key={run}
              text={animate === 'marquee' ? 'KATANA READY' : 'READY'}
              animate={animate}
              columns={animate === 'marquee' ? 36 : undefined}
              loop={animate === 'blink' || animate === 'marquee'}
              pixelSize={3}
            />
          </Cell>
        ))}
        <Button onClick={() => setRun((n) => n + 1)}>重播</Button>
      </Row>
      <Row name="屏幕效果">
        <Cell name="glow">
          <ArcadePixel text="KATANA" pixelSize={4} glow />
        </Cell>
        <Cell name="scanlines">
          <ArcadePixel text="KATANA" pixelSize={4} scanlines />
        </Cell>
        <Cell name="crt">
          <ArcadePixel text="KATANA" pixelSize={4} crt glow scanlines />
        </Cell>
      </Row>
      <p className="gal-note">
        5x7 点阵字体只有拉丁字母、数字与 - , : ! ? . *
        空格，没有中日韩字；也可以传自己的精灵（二维数组，数字是色板下标）。 屏外与标签页隐藏时动画暂停。
      </p>
    </>
  )
}
