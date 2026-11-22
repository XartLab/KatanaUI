// SPDX-License-Identifier: MIT
// 文字动效的演示（改自 SmoothUI 的一批件，见 src/motion/text）：场景取交易工作台——新闻标题进场、AI 回复打字、代码与价格变化、切换视图。
// 演示都带「重播」或实时开关：进场类的动效播一次就没了，要能再看一遍；自动化浏览器默认暂停实时，用 window.__liveStep 步进。
import { useRef, useState, type ReactNode } from 'react'
import {
  Button,
  GravityLetters,
  KineticTypeScroll,
  PerspectiveText3D,
  RansomNote,
  ScrambleText,
  ScrollRevealParagraph,
  ShineText,
  TEXT_REVEAL_PRESETS,
  TextMorph,
  TextReveal,
  TextSwap,
  ToggleGroup,
  ToggleGroupItem,
  TypewriterText,
  WaveText,
  WordBuild,
  type TextRevealPreset,
  type TextSwapVariant,
} from '../../src/index.ts'
import { LiveToggle } from '../LiveToggle.tsx'
import { pick, randomWalk, useLiveTicker } from '../live-sim.ts'
import { Cell, Row } from './parts.tsx'

const LIVE_LABELS = { group: '数据刷新', live: '实时', paused: '暂停' }
const REPLAY = '重播'

const HEADLINES = [
  'Fed holds rates steady and signals one cut before year end',
  'NVDA beats on data center demand, guides above consensus',
  'Crude slides as inventories build for a third week',
  'Yuan firms after PBOC sets stronger midpoint',
]

/** 一块带「重播」的演示：children 拿到重播次数，当 key 或 replayKey 用。 */
function Replayable({ id, children, note }: { id: string; children: (run: number) => ReactNode; note?: string }) {
  const [run, setRun] = useState(0)
  return (
    <div className="gal-stack" data-gallery-motion={id} style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <Button size="sm" onClick={() => setRun((value) => value + 1)}>
          {REPLAY}
        </Button>
        {note ? <span className="gal-note">{note}</span> : null}
      </Row>
      {children(run)}
    </div>
  )
}

// —— TextReveal：17 个原件，一个件 ——
const SAMPLE: Record<'char' | 'word' | 'all' | 'line', string | string[]> = {
  char: 'NVDA +4.2%',
  word: 'Fed holds rates steady',
  all: 'Earnings beat',
  line: ['Fed holds rates', 'signals one cut'],
}

export function TextRevealDemo() {
  return (
    <Replayable id="text-reveal" note="17 个 SmoothUI 原件都是这一个件的预设；改任一参数就是自己的变体。">
      {(run) => (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            {(Object.keys(TEXT_REVEAL_PRESETS) as TextRevealPreset[]).map((preset) => {
              const by = TEXT_REVEAL_PRESETS[preset].by
              const sample = SAMPLE[by]
              return (
                <Cell key={preset} name={preset}>
                  <TextReveal
                    className="k-text-body"
                    lines={Array.isArray(sample) ? sample : undefined}
                    preset={preset}
                    replayKey={run}
                  >
                    {Array.isArray(sample) ? undefined : sample}
                  </TextReveal>
                </Cell>
              )
            })}
          </div>
          <Row name="自定义">
            <TextReveal by="char" from="left" blur={6} order="center" stagger={30} replayKey={run}>
              Order filled at 106,977.4
            </TextReveal>
          </Row>
        </>
      )}
    </Replayable>
  )
}

// —— TextSwap：新闻标题与切换视图 ——
const SWAP_VARIANTS: readonly TextSwapVariant[] = ['fade-through', 'axis-x', 'axis-z', 'word-cut', 'slide-right']
const VIEWS = [
  ['holdings', 'Holdings: 12 positions, net exposure 64%'],
  ['orders', 'Orders: 3 working, 1 awaiting approval'],
  ['fills', 'Fills: 27 today, average slippage 0.8 bp'],
] as const

export function TextSwapDemo() {
  const { state, advance } = useLiveTicker(0, (index) => (index + 1) % HEADLINES.length, { intervalMs: 2600 })
  const [view, setView] = useState('holdings')
  const viewIndex = VIEWS.findIndex(([id]) => id === view)
  return (
    <div className="gal-stack" data-gallery-live="text-swap" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <Button size="sm" onClick={advance}>
          下一条
        </Button>
        <span className="gal-note">五种换法共用一个序号；标题是演示用的虚构新闻。</span>
      </Row>
      {SWAP_VARIANTS.map((variant) => (
        <Row key={variant} name={variant}>
          <TextSwap className="k-text-body" index={state} phrases={HEADLINES} variant={variant} />
        </Row>
      ))}
      <Row name="切换视图">
        <ToggleGroup aria-label="视图" value={view} onValueChange={(value) => value && setView(value)}>
          {VIEWS.map(([id]) => (
            <ToggleGroupItem key={id} value={id}>
              {id}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <TextSwap className="k-text-body" index={viewIndex} phrases={VIEWS.map(([, text]) => text)} variant="axis-x" />
      </Row>
    </div>
  )
}

// —— WordBuild ——
export function WordBuildDemo() {
  return (
    <Replayable id="word-build" note="搭好停 2.5 秒，整句退场，换下一句。">
      {(run) => (
        <>
          <Row name="right">
            <WordBuild
              className="k-text-body"
              from="right"
              key={`r-${run}`}
              phrases={['Fed holds rates steady', 'Yields fall, equities rally']}
            />
          </Row>
          <Row name="top">
            <WordBuild
              className="k-text-body"
              from="top"
              key={`t-${run}`}
              phrases={['Crude slides again', 'Dollar index at two-week low']}
            />
          </Row>
        </>
      )}
    </Replayable>
  )
}

// —— TypewriterText：AI 回复 ——
const REPLY_PARTS = [
  'Position is 6% over the single-name limit. ',
  'Trim 1,200 shares at market before the close, ',
  'or hedge with a short in the sector ETF.',
]

export function TypewriterTextDemo() {
  const [parts, setParts] = useState(1)
  const [run, setRun] = useState(0)
  return (
    <div className="gal-stack" data-gallery-motion="typewriter-text" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <Button
          size="sm"
          onClick={() => {
            setParts(1)
            setRun((value) => value + 1)
          }}
        >
          {REPLAY}
        </Button>
        <Button size="sm" disabled={parts >= REPLY_PARTS.length} onClick={() => setParts((value) => value + 1)}>
          追加一句
        </Button>
        <span className="gal-note">文字变长时接着打，不从头重来（AI 流式回复）。</span>
      </Row>
      <p className="k-text-body" style={{ minHeight: 48, margin: 0 }}>
        <TypewriterText caret key={run} speed={22}>
          {REPLY_PARTS.slice(0, parts).join('')}
        </TypewriterText>
      </p>
    </div>
  )
}

// —— ScrambleText：悬停与数据变化 ——
const CODES = ['AAPL.US', 'TSLA.US', '600519.SH', '00700.HK', 'NVDA.US']

export function ScrambleTextDemo() {
  const { state, advance } = useLiveTicker(
    { code: CODES[0]!, price: 106977.4 },
    (current, rng) => ({ code: pick(rng, CODES), price: randomWalk(current.price, rng, 0.01) }),
    { intervalMs: 2200 },
  )
  const mono = { fontFamily: 'var(--font-mono)' }
  return (
    <div className="gal-stack" data-gallery-live="scramble-text" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <Button size="sm" onClick={advance}>
          走一步
        </Button>
        <span className="gal-note">悬停下面第一行；后两行在代码与价格变化时扰一次。</span>
      </Row>
      <Row name="hover">
        <ScrambleText className="k-text-body">Open order ticket</ScrambleText>
      </Row>
      <Row name="change">
        <span style={mono}>
          <ScrambleText duration={700} trigger="change">
            {state.code}
          </ScrambleText>
        </span>
      </Row>
      <Row name="left-to-right">
        <span style={mono}>
          <ScrambleText duration={700} settle="left-to-right" trigger="change">
            {state.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </ScrambleText>
        </span>
      </Row>
    </div>
  )
}

// —— TextMorph ——
const STATUSES = ['Pending approval', 'Partially filled', 'Filled', 'Cancelled']

export function TextMorphDemo() {
  const { state, advance } = useLiveTicker(
    { status: 0, price: 106977.4 },
    (current, rng) => ({
      status: (current.status + 1) % STATUSES.length,
      price: randomWalk(current.price, rng, 0.004),
    }),
    { intervalMs: 2000 },
  )
  return (
    <div className="gal-stack" data-gallery-live="text-morph" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <Button size="sm" onClick={advance}>
          走一步
        </Button>
      </Row>
      <Row name="characters">
        <TextMorph
          className="k-text-data"
          text={state.price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        />
      </Row>
      <Row name="words">
        <TextMorph className="k-text-body" mode="words" text={STATUSES[state.status]!} />
      </Row>
    </div>
  )
}

// —— ShineText、WaveText ——
export function ShineTextDemo() {
  return (
    <div className="gal-stack" data-gallery-motion="shine-text">
      <Row name="分析中">
        <ShineText className="k-text-body">Analyzing 4,812 filings</ShineText>
      </Row>
      <Row name="自定义色">
        <ShineText baseColor="var(--ink-400)" className="k-text-body" duration={1.6} shineColor="var(--ink-100)">
          Waiting for approval
        </ShineText>
      </Row>
    </div>
  )
}

export function WaveTextDemo() {
  return (
    <div className="gal-stack" data-gallery-motion="wave-text">
      <Row name="实时">
        <WaveText className="k-text-body">Live market</WaveText>
      </Row>
      <Row name="大波幅">
        <WaveText amplitude={14} className="k-text-body" duration={1.8} staggerDelay={0.08}>
          Streaming
        </WaveText>
      </Row>
    </div>
  )
}

// —— 随滚动的两个：给一个能滚的小框，传它当 container ——
const NOTE =
  'Breadth narrowed for a third session as megacap leadership held the index up. Small caps lagged on higher yields, credit spreads stayed tight, and positioning data shows funds adding to energy while trimming defensives into the close.'

function ScrollBox({
  id,
  children,
}: {
  id: string
  children: (container: React.RefObject<HTMLDivElement | null>) => ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  return (
    <div
      className="k-text-body"
      // 可滚的框要能用键盘滚到（axe scrollable-region-focusable）：可聚焦、有名字。
      tabIndex={0}
      role="region"
      aria-label="滚动示例"
      data-gallery-motion={id}
      data-testid={`${id}-scroller`}
      ref={box}
      // position: relative 不能少：motion 沿 offsetParent 往上量元素相对滚动容器的位置，容器不是定位元素就量歪了。
      style={{
        height: 240,
        overflow: 'auto',
        position: 'relative',
        width: '100%',
        maxWidth: 560,
        border: '1px solid var(--line-100)',
      }}
    >
      <div style={{ height: 200 }}>
        <span className="gal-note">向下滚动</span>
      </div>
      <div style={{ padding: 16 }}>{children(box)}</div>
      <div style={{ height: 480 }} />
    </div>
  )
}

export function ScrollRevealParagraphDemo() {
  return (
    <ScrollBox id="scroll-reveal-paragraph">
      {(box) => <ScrollRevealParagraph container={box} paragraph={NOTE} />}
    </ScrollBox>
  )
}

export function KineticTypeScrollDemo() {
  return (
    <ScrollBox id="kinetic-type-scroll">
      {(box) => (
        <KineticTypeScroll
          className="k-text-title"
          container={box}
          offset={['start 0.9', 'end 0.3']}
          words={['Risk', 'on', 'returns', 'as', 'yields', 'fall']}
        />
      )}
    </ScrollBox>
  )
}

// —— PerspectiveText3D ——
export function PerspectiveText3DDemo() {
  return (
    <div className="gal-stack" data-gallery-motion="perspective-text-3d">
      <Row name="static">
        <PerspectiveText3D className="k-text-title" depth={30} text="Net exposure by sector" />
      </Row>
      <Row name="pointer">
        <PerspectiveText3D
          className="k-text-title"
          depth={50}
          driver="pointer"
          split="lines"
          text={'Move the pointer\nover this panel'}
        />
      </Row>
    </div>
  )
}

// —— GravityLetters ——
export function GravityLettersDemo() {
  const [fallen, setFallen] = useState(false)
  return (
    <div className="gal-stack" data-gallery-motion="gravity-letters" style={{ width: '100%', maxWidth: 560 }}>
      <Row>
        <Button size="sm" onClick={() => setFallen((value) => !value)}>
          {fallen ? '收回' : '掉落'}
        </Button>
        <span className="gal-note">由按钮控制（collapsed）；下面一个点击触发。</span>
      </Row>
      <div data-testid="gravity-controlled" style={{ border: '1px solid var(--line-100)' }}>
        <GravityLetters className="k-text-title" collapsed={fallen} text="Circuit breaker" trigger="manual" />
      </div>
      <div data-testid="gravity-click" style={{ border: '1px solid var(--line-100)' }}>
        <GravityLetters className="k-text-title" text="Limit down" trigger="click" />
      </div>
    </div>
  )
}

// —— RansomNote ——
export function RansomNoteDemo() {
  return (
    <Replayable id="ransom-note" note="纯装饰：空状态与品牌页用，不要放数据。">
      {(run) => (
        <>
          <Row name="assemble">
            <RansomNote key={`a-${run}`} className="k-text-title" seed={7} text="No signal" />
          </Row>
          <Row name="jitter">
            <RansomNote animate="jitter" className="k-text-title" intensity={0.9} seed={3} text="Halted" />
          </Row>
        </>
      )}
    </Replayable>
  )
}
