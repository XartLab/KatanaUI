// SPDX-License-Identifier: MIT
// 过场、背景、特效与媒体的演示（改自 SmoothUI 的一批件，见 src/motion/transition、background、effect、media）。
// 场景取交易工作台：视图切换（持仓、订单、成交）过场；文档站首页、工作台空状态、加载、连接中的背景；AI 建议卡的边框光束；
// 背景只当底，不承载数据。进场与循环类的动效都带「重播」或实时开关；自动化浏览器默认暂停实时，用 window.__liveStep 步进。
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  ApertureBlurTransition,
  AsciiRender,
  AuroraCurtain,
  BorderBeam,
  Button,
  ChromaBlurTransition,
  CursorImageTrail,
  DitherImage,
  DrawingCursor,
  EmbossSurface,
  GravityStars,
  HolographicFoil,
  LiquidMetal,
  MagneticField,
  Orb,
  ParallaxLayers,
  PixelBrushCanvas,
  PixelFlowField,
  ProgressiveBlur,
  ScrollImageReveal,
  SdfBlobTransition,
  ShaderReveal,
  SvgClipMask,
  SvgDrawOnScroll,
  ToggleGroup,
  ToggleGroupItem,
  type DitherAlgorithm,
  type DrawingCursorHandle,
  type EmbossSurfaceVariant,
  type HolographicFoilPattern,
  type LiquidMetalVariant,
  type PixelBrushCanvasLabels,
  type SdfBlobVariant,
  type ShaderRevealVariant,
} from '../../src/index.ts'
import { LiveToggle } from '../LiveToggle.tsx'
import { makeRng, useLiveEnabled, useLiveTicker } from '../live-sim.ts'
import { Cell, Row } from './parts.tsx'

const LIVE_LABELS = { group: '数据刷新', live: '实时', paused: '暂停' }
const REPLAY = '重播'

/** 一个带标题的小画框：背景类的场景都摆在里面（高度固定，内容居中）。 */
function Scene({ name, children, height = 180 }: { name: string; children: ReactNode; height?: number }) {
  return (
    <Cell name={name}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height,
          overflow: 'hidden',
          border: '1px solid var(--line-100)',
          background: 'var(--bg-100)',
        }}
      >
        {children}
      </div>
    </Cell>
  )
}

const SCENE_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 12,
  width: '100%',
  maxWidth: 900,
}

const CENTER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  padding: 16,
}

// —— 示意图：自绘的 SVG 走势图，当「图片」素材用（不是真实行情） ——
const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
function chartImage(seed: number, width = 480, height = 320): string {
  const rng = makeRng(seed)
  let y = height * 0.6
  const points: string[] = []
  for (let i = 0; i < 48; i += 1) {
    y = Math.min(height - 50, Math.max(50, y + (rng() - 0.52) * 30))
    points.push(`${(i * width) / 47},${y.toFixed(1)}`)
  }
  const line = `M${points.join(' L')}`
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a4a"/><stop offset="1" stop-color="#101010"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><path d="${line} L${width},${height} L0,${height}Z" fill="#e8e0cf" fill-opacity=".28"/><path d="${line}" fill="none" stroke="#f4eddc" stroke-width="6" stroke-linejoin="round"/></svg>`,
  )
}
const CHART_A = chartImage(11)
const CHART_B = chartImage(23)
const CHART_C = chartImage(37)

// —— 过场：视图切换 ——
const VIEW_CARDS = [
  {
    title: '持仓',
    rows: [
      ['NVDA', '+4.2%', 'up'],
      ['AAPL', '-0.6%', 'down'],
      ['TSLA', '+1.1%', 'up'],
    ],
  },
  {
    title: '订单',
    rows: [
      ['BUY NVDA 100', '待成交', 'flat'],
      ['SELL AAPL 40', '待审批', 'flat'],
      ['BUY TSLA 25', '已撤', 'down'],
    ],
  },
  {
    title: '成交',
    rows: [
      ['NVDA 100 @ 106.9', '+0.8bp', 'up'],
      ['AAPL 40 @ 231.5', '-0.2bp', 'down'],
      ['TSLA 25 @ 342.0', '+0.1bp', 'up'],
    ],
  },
] as const

function ViewCard({ index }: { index: number }) {
  const card = VIEW_CARDS[index % VIEW_CARDS.length]!
  return (
    <div style={{ padding: 16, minHeight: 150, display: 'grid', gap: 8, alignContent: 'start' }}>
      <strong className="k-text-title">{card.title}</strong>
      {card.rows.map(([name, value, tone]) => (
        <div key={name} className="k-text-data" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{name}</span>
          <span
            style={{ color: tone === 'up' ? 'var(--pnl-up)' : tone === 'down' ? 'var(--pnl-down)' : 'var(--ink-300)' }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

/** 过场演示的外壳：实时开关自动轮换三个视图，也能手动「切换」；children 拿到视图序号与过场计数（当 transitionKey）。 */
function TransitionBox({
  id,
  controls,
  children,
}: {
  id: string
  controls?: ReactNode
  children: (index: number, key: number) => ReactNode
}) {
  const { state, tick, advance } = useLiveTicker(0, (index) => (index + 1) % VIEW_CARDS.length, { intervalMs: 3200 })
  return (
    <div className="gal-stack" data-gallery-motion={id} style={{ width: '100%', maxWidth: 560 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <Button size="sm" onClick={advance}>
          切换视图
        </Button>
        {controls}
      </Row>
      <div data-view-index={state} data-tick={tick}>
        {children(state, tick)}
      </div>
    </div>
  )
}

const SHADER_VARIANTS: readonly ShaderRevealVariant[] = [
  'noise',
  'zoom',
  'circle',
  'wipe',
  'luma',
  'planetary',
  'stripes',
  'push',
]
export function ShaderRevealDemo() {
  const [variant, setVariant] = useState<ShaderRevealVariant>('noise')
  return (
    <TransitionBox
      id="shader-reveal"
      controls={
        <ToggleGroup aria-label="变体" value={variant} onValueChange={(v) => v && setVariant(v as ShaderRevealVariant)}>
          {SHADER_VARIANTS.map((item) => (
            <ToggleGroupItem key={item} value={item}>
              {item}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    >
      {(index, key) => (
        <ShaderReveal variant={variant} transitionKey={key}>
          <ViewCard index={index} />
        </ShaderReveal>
      )}
    </TransitionBox>
  )
}

const SDF_VARIANTS: readonly SdfBlobVariant[] = ['circle', 'warped', 'merge', 'radial', 'final']
export function SdfBlobTransitionDemo() {
  const [variant, setVariant] = useState<SdfBlobVariant>('final')
  return (
    <TransitionBox
      id="sdf-blob-transition"
      controls={
        <ToggleGroup aria-label="变体" value={variant} onValueChange={(v) => v && setVariant(v as SdfBlobVariant)}>
          {SDF_VARIANTS.map((item) => (
            <ToggleGroupItem key={item} value={item}>
              {item}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    >
      {(index, key) => (
        <SdfBlobTransition variant={variant} transitionKey={key}>
          <ViewCard index={index} />
        </SdfBlobTransition>
      )}
    </TransitionBox>
  )
}

export function ApertureBlurTransitionDemo() {
  return (
    <TransitionBox id="aperture-blur-transition">
      {(index, key) => (
        <ApertureBlurTransition transitionKey={key}>
          <ViewCard index={index} />
        </ApertureBlurTransition>
      )}
    </TransitionBox>
  )
}

export function ChromaBlurTransitionDemo() {
  return (
    <TransitionBox id="chroma-blur-transition">
      {(index, key) => (
        <ChromaBlurTransition transitionKey={key}>
          <ViewCard index={index} />
        </ChromaBlurTransition>
      )}
    </TransitionBox>
  )
}

// —— 背景：首页、空状态、加载、连接中 ——
/** 背景类默认跟全局实时开关：暂停时画面定格，自动化浏览器里也稳定。 */
const useBackdropPaused = () => !useLiveEnabled()[0]

function Caption({ title, note }: { title: string; note: string }) {
  return (
    <div style={CENTER}>
      {/* 垫一层半透明底：金属、箔这类亮面上，文字也读得清。 */}
      <div
        style={{
          padding: '8px 14px',
          borderRadius: 'var(--radius-control)',
          background: 'color-mix(in oklch, var(--bg-000) 72%, transparent)',
        }}
      >
        <strong className="k-text-title">{title}</strong>
        <div className="k-text-caption" style={{ color: 'var(--ink-300)', marginTop: 4 }}>
          {note}
        </div>
      </div>
    </div>
  )
}

export function AuroraCurtainDemo() {
  const paused = useBackdropPaused()
  const [noise, setNoise] = useState(false)
  return (
    <div className="gal-stack" data-gallery-motion="aurora-curtain" style={{ width: '100%', maxWidth: 900 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <Button size="sm" onClick={() => setNoise((value) => !value)} aria-pressed={noise}>
          胶片颗粒
        </Button>
      </Row>
      <div style={SCENE_GRID}>
        <Scene name="工作台空状态">
          <AuroraCurtain className="gal-fx-fill" paused={paused} noise={noise}>
            <Caption title="没有打开的策略" note="从左边的列表选一个，或新建。" />
          </AuroraCurtain>
        </Scene>
        <Scene name="direction=down 三条带">
          <AuroraCurtain className="gal-fx-fill" paused={paused} direction="down" bands={3} intensity={0.8}>
            <Caption title="登录" note="背景只当底，不放数据。" />
          </AuroraCurtain>
        </Scene>
      </div>
    </div>
  )
}

export function GravityStarsDemo() {
  const paused = useBackdropPaused()
  return (
    <div className="gal-stack" data-gallery-motion="gravity-stars" style={{ width: '100%', maxWidth: 900 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <span className="gal-note">指针在画面里移动，星点被吸过去再甩开；暂停时定格。</span>
      </Row>
      <div style={SCENE_GRID}>
        <Scene name="文档站首页" height={220}>
          <GravityStars className="gal-fx-fill" paused={paused} count={160}>
            <Caption title="KatanaUI" note="交易工作台的组件库" />
          </GravityStars>
        </Scene>
        <Scene name="不连线、更亮" height={220}>
          <GravityStars
            className="gal-fx-fill"
            paused={paused}
            connect={false}
            glow={8}
            count={120}
            color="var(--accent)"
          >
            <Caption title="未连接" note="等待行情源" />
          </GravityStars>
        </Scene>
      </div>
    </div>
  )
}

const METALS: readonly LiquidMetalVariant[] = ['chrome', 'gold', 'mercury', 'oil']
export function LiquidMetalDemo() {
  const paused = useBackdropPaused()
  const [variant, setVariant] = useState<LiquidMetalVariant>('chrome')
  return (
    <div className="gal-stack" data-gallery-motion="liquid-metal" style={{ width: '100%', maxWidth: 900 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <ToggleGroup aria-label="材质" value={variant} onValueChange={(v) => v && setVariant(v as LiquidMetalVariant)}>
          {METALS.map((item) => (
            <ToggleGroupItem key={item} value={item}>
              {item}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Row>
      <div style={SCENE_GRID}>
        <Scene name="面">
          <LiquidMetal className="gal-fx-fill" variant={variant} paused={paused}>
            <Caption title="Premium" note="金属面铺底" />
          </LiquidMetal>
        </Scene>
        <Scene name="maskText：金属字">
          <div style={CENTER}>
            <LiquidMetal variant={variant} maskText paused={paused}>
              <span style={{ font: '800 44px/1 var(--font-sans-display, var(--font-sans))' }}>KATANA</span>
            </LiquidMetal>
          </div>
        </Scene>
      </div>
    </div>
  )
}

export function OrbDemo() {
  const paused = useBackdropPaused()
  return (
    <div className="gal-stack" data-gallery-motion="orb" style={{ width: '100%', maxWidth: 900 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <span className="gal-note">循环首尾无缝；离屏停。</span>
      </Row>
      <div style={SCENE_GRID}>
        <Scene name="AI 思考中" height={200}>
          <div style={CENTER}>
            <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
              <Orb size={96} paused={paused} />
              <span className="k-text-caption" style={{ color: 'var(--ink-300)' }}>
                正在读财报…
              </span>
            </div>
          </div>
        </Scene>
        <Scene name="连接中，四色" height={200}>
          <div style={CENTER}>
            <Orb
              size={96}
              paused={paused}
              colors={['var(--signal-blue)', 'var(--signal-green)', 'var(--signal-amber)', 'var(--accent)']}
              iridescence={0.5}
              glow={0.4}
            />
          </div>
        </Scene>
      </div>
    </div>
  )
}

export function PixelFlowFieldDemo() {
  const paused = useBackdropPaused()
  const [scatter, setScatter] = useState(0)
  return (
    <div className="gal-stack" data-gallery-motion="pixel-flow-field" style={{ width: '100%', maxWidth: 900 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <Button size="sm" onClick={() => setScatter((value) => value + 1)}>
          {REPLAY}
        </Button>
        <span className="gal-note">点「重播」把字炸开再聚拢；指针划过会推开像素。</span>
      </Row>
      <div style={SCENE_GRID}>
        <Scene name="连接中" height={200}>
          <PixelFlowField className="gal-fx-fill" paused={paused} text="LINK" scatter={scatter} cellSize={7} gap={2} />
        </Scene>
        <Scene name="圆点、加载中" height={200}>
          <PixelFlowField
            className="gal-fx-fill"
            paused={paused}
            text="LOAD"
            shape="circle"
            scatter={scatter}
            cellSize={8}
            gap={3}
          />
        </Scene>
      </div>
    </div>
  )
}

// —— 特效 ——
export function BorderBeamDemo() {
  const [active, setActive] = useState(true)
  return (
    <div className="gal-stack" data-gallery-motion="border-beam" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <Button size="sm" onClick={() => setActive((value) => !value)} aria-pressed={active}>
          {active ? '停下' : '跑起来'}
        </Button>
        <span className="gal-note">AI 的交易建议待审时，用一圈光标出「等你」，审完即停。</span>
      </Row>
      <div style={SCENE_GRID}>
        <Cell name="单束">
          <BorderBeam active={active} radius={4} className="gal-fx-w">
            <div style={{ padding: 16 }}>
              <strong className="k-text-title">AI 建议：减仓 NVDA 20%</strong>
              <div className="k-text-caption" style={{ color: 'var(--ink-300)' }}>
                待审批 · 置信度 0.72
              </div>
            </div>
          </BorderBeam>
        </Cell>
        <Cell name="两束、反向、悬停暂停">
          <BorderBeam active={active} beams={2} reverse pauseOnHover radius={4} duration={4} className="gal-fx-w">
            <div style={{ padding: 16 }}>
              <strong className="k-text-title">风控：敞口超限</strong>
              <div className="k-text-caption" style={{ color: 'var(--ink-300)' }}>
                净敞口 64%，上限 60%
              </div>
            </div>
          </BorderBeam>
        </Cell>
      </div>
    </div>
  )
}

const TRAIL_IMAGES = [
  { src: CHART_A, alt: '示意走势图 A' },
  { src: CHART_B, alt: '示意走势图 B' },
  { src: CHART_C, alt: '示意走势图 C' },
]
export function CursorImageTrailDemo() {
  return (
    <div className="gal-stack" data-gallery-motion="cursor-image-trail" style={{ width: '100%', maxWidth: 760 }}>
      <span className="gal-note">
        指针在下面的区域里移动：每隔一段距离留一张图（仅有精确指针的设备）。适合首页或作品集，不进行情区。
      </span>
      <CursorImageTrail images={TRAIL_IMAGES} imageSize={72} distance={70} className="gal-fx-w">
        <div
          style={{
            height: 200,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--bg-100)',
            border: '1px solid var(--line-100)',
          }}
        >
          <span className="k-text-title">最近看过的走势</span>
        </div>
      </CursorImageTrail>
    </div>
  )
}

export function DrawingCursorDemo() {
  const handle = useRef<DrawingCursorHandle>(null)
  const [decay, setDecay] = useState(800)
  return (
    <div className="gal-stack" data-gallery-motion="drawing-cursor" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <ToggleGroup aria-label="消退" value={String(decay)} onValueChange={(v) => v && setDecay(Number(v))}>
          <ToggleGroupItem value="800">800ms 消退</ToggleGroupItem>
          <ToggleGroupItem value="0">不消退</ToggleGroupItem>
        </ToggleGroup>
        <Button size="sm" onClick={() => handle.current?.clear()}>
          清除
        </Button>
        <span className="gal-note">在图上随手划线做批注；线宽随速度变细。</span>
      </Row>
      <DrawingCursor ref={handle} decay={decay} lineWidth={3} className="gal-fx-w">
        <div style={{ height: 200, background: 'var(--bg-100)', border: '1px solid var(--line-100)' }}>
          <img
            alt="示意走势图"
            src={CHART_A}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
          />
        </div>
      </DrawingCursor>
    </div>
  )
}

const EMBOSS: readonly EmbossSurfaceVariant[] = ['emboss', 'deboss', 'plaster', 'metal-stamp']
export function EmbossSurfaceDemo() {
  return (
    <div className="gal-stack" data-gallery-motion="emboss-surface" style={{ width: '100%', maxWidth: 760 }}>
      <Row name="四种材质">
        {EMBOSS.map((variant) => (
          <Cell key={variant} name={variant}>
            <EmbossSurface variant={variant} depth={3} className="k-text-title" as="div">
              <div style={{ padding: '20px 28px' }}>NVDA</div>
            </EmbossSurface>
          </Cell>
        ))}
      </Row>
      <Row name="interactive：光源跟指针">
        <EmbossSurface interactive depth={4} lightAngle={120}>
          <div className="k-text-title" style={{ padding: '24px 40px' }}>
            Premium
          </div>
        </EmbossSurface>
      </Row>
    </div>
  )
}

const FOILS: readonly HolographicFoilPattern[] = ['prism', 'aurora', 'gold', 'oil']
export function HolographicFoilDemo() {
  const [pattern, setPattern] = useState<HolographicFoilPattern>('prism')
  return (
    <div className="gal-stack" data-gallery-motion="holographic-foil" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <ToggleGroup
          aria-label="箔"
          value={pattern}
          onValueChange={(v) => v && setPattern(v as HolographicFoilPattern)}
        >
          {FOILS.map((item) => (
            <ToggleGroupItem key={item} value={item}>
              {item}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="gal-note">指针在卡上移动，箔跟着偏色、卡轻微倾斜；适合「年度最佳策略」这类奖牌卡。</span>
      </Row>
      <HolographicFoil pattern={pattern} className="gal-fx-card" orientationLabel="Enable tilt">
        <div style={{ padding: 20, minHeight: 140, display: 'grid', alignContent: 'space-between' }}>
          <span className="k-text-caption" style={{ color: 'var(--ink-300)' }}>
            2026 年度策略
          </span>
          <strong className="k-text-title" style={{ fontSize: 28 }}>
            +38.2%
          </strong>
        </div>
      </HolographicFoil>
    </div>
  )
}

const SECTORS = ['半导体', '银行', '能源', '医药', '软件', '消费']
export function MagneticFieldDemo() {
  const [mode, setMode] = useState<'attract' | 'repel' | 'orbit'>('attract')
  return (
    <div className="gal-stack" data-gallery-motion="magnetic-field" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <ToggleGroup aria-label="方式" value={mode} onValueChange={(v) => v && setMode(v as typeof mode)}>
          <ToggleGroupItem value="attract">attract</ToggleGroupItem>
          <ToggleGroupItem value="repel">repel</ToggleGroupItem>
          <ToggleGroupItem value="orbit">orbit</ToggleGroupItem>
        </ToggleGroup>
        <span className="gal-note">指针靠近时，板块标签被吸、被推或绕着转（仅有精确指针的设备）。</span>
      </Row>
      <MagneticField
        mode={mode}
        radius={150}
        className="gal-fx-field"
        items={SECTORS.map((name) => ({
          id: name,
          element: (
            <span
              className="k-text-data"
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                border: '1px solid var(--line-200)',
                background: 'var(--bg-200)',
              }}
            >
              {name}
            </span>
          ),
        }))}
      />
    </div>
  )
}

export function ParallaxLayersDemo() {
  const container = useRef<HTMLDivElement>(null)
  return (
    <div className="gal-stack" data-gallery-motion="parallax-layers" style={{ width: '100%', maxWidth: 760 }}>
      <span className="gal-note">在下面的框里滚动：三层按各自深度错位（用于首页的头图，不用于数据）。</span>
      <div
        ref={container}
        data-scrollbox
        style={{ height: 240, overflowY: 'auto', border: '1px solid var(--line-100)', background: 'var(--bg-100)' }}
      >
        <div style={{ height: 120 }} />
        <ParallaxLayers
          container={container}
          range={60}
          className="gal-fx-parallax"
          layers={[
            {
              id: 'far',
              depth: 0.2,
              blur: 2,
              opacity: 0.5,
              content: <img alt="" src={CHART_C} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />,
            },
            {
              id: 'mid',
              depth: 0.6,
              opacity: 0.8,
              content: (
                <img
                  alt=""
                  src={CHART_B}
                  style={{ width: '60%', height: '100%', objectFit: 'cover', margin: '0 auto' }}
                />
              ),
            },
            {
              id: 'near',
              depth: 1,
              content: (
                <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
                  <strong className="k-text-title" style={{ fontSize: 32 }}>
                    Market open
                  </strong>
                </div>
              ),
            },
          ]}
        />
        <div style={{ height: 240 }} />
      </div>
    </div>
  )
}

const NEWS = [
  'Fed holds rates steady and signals one cut before year end',
  'NVDA beats on data center demand, guides above consensus',
  'Crude slides as inventories build for a third week',
  'Yuan firms after PBOC sets stronger midpoint',
  'Treasury yields ease ahead of the auction',
  'Bank earnings lift financials; regional lenders lag',
  'Gold steadies near record as dollar softens',
  'Chip export rules tighten, equipment makers slip',
]
export function ProgressiveBlurDemo() {
  const [direction, setDirection] = useState<'bottom' | 'top' | 'right'>('bottom')
  return (
    <div className="gal-stack" data-gallery-motion="progressive-blur" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <ToggleGroup
          aria-label="方向"
          value={direction}
          onValueChange={(v) => v && setDirection(v as typeof direction)}
        >
          <ToggleGroupItem value="bottom">bottom</ToggleGroupItem>
          <ToggleGroupItem value="top">top</ToggleGroupItem>
          <ToggleGroupItem value="right">right</ToggleGroupItem>
        </ToggleGroup>
        <span className="gal-note">滚动列表的边缘渐渐虚掉，提示「下面还有」；模糊盖在内容上，不挡点击。</span>
      </Row>
      <div
        style={{
          position: 'relative',
          height: 220,
          border: '1px solid var(--line-100)',
          background: 'var(--bg-100)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
          {NEWS.map((line) => (
            <div key={line} className="k-text-data">
              {line}
            </div>
          ))}
        </div>
        <ProgressiveBlur direction={direction} blur={12} className={`gal-fx-blur-${direction}`} />
      </div>
    </div>
  )
}

export function ScrollImageRevealDemo() {
  const container = useRef<HTMLDivElement>(null)
  const masks = ['wipe', 'curtain', 'circle', 'blinds', 'scale'] as const
  return (
    <div className="gal-stack" data-gallery-motion="scroll-image-reveal" style={{ width: '100%', maxWidth: 760 }}>
      <span className="gal-note">在下面的框里滚动：图片随滚动揭开，五种遮罩。</span>
      <div
        ref={container}
        data-scrollbox
        style={{
          height: 260,
          overflowY: 'auto',
          border: '1px solid var(--line-100)',
          background: 'var(--bg-100)',
          padding: 12,
        }}
      >
        <div style={{ display: 'grid', gap: 140, padding: '120px 0 160px' }}>
          {masks.map((mask) => (
            <div key={mask}>
              <div className="gal-cap">{mask}</div>
              <ScrollImageReveal
                className="gal-fx-reveal"
                container={container}
                mask={mask}
                alt={`示意走势图（${mask}）`}
                src={CHART_A}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const BLOB_A =
  'M0.5,0.02 C0.75,0.02 0.98,0.25 0.98,0.5 C0.98,0.75 0.75,0.98 0.5,0.98 C0.25,0.98 0.02,0.75 0.02,0.5 C0.02,0.25 0.25,0.02 0.5,0.02 Z'
const BLOB_B =
  'M0.5,0.1 C0.8,0.0 1.0,0.3 0.95,0.55 C0.9,0.85 0.7,0.95 0.45,0.97 C0.2,0.99 0.0,0.8 0.05,0.5 C0.1,0.25 0.25,0.2 0.5,0.1 Z'
export function SvgClipMaskDemo() {
  return (
    <div className="gal-stack" data-gallery-motion="svg-clip-mask" style={{ width: '100%', maxWidth: 760 }}>
      <Row name="预设形状">
        {(['blob', 'arch', 'diamond', 'wave'] as const).map((shape) => (
          <Cell key={shape} name={shape}>
            <SvgClipMask shape={shape} className="gal-fx-sq">
              <img
                alt={`示意走势图（${shape}）`}
                src={CHART_A}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </SvgClipMask>
          </Cell>
        ))}
      </Row>
      <Row name="动画">
        <Cell name="morph（循环变形）">
          <SvgClipMask animate="morph" morphPaths={[BLOB_A, BLOB_B]} duration={3} className="gal-fx-sq">
            <img alt="示意走势图（变形）" src={CHART_B} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </SvgClipMask>
        </Cell>
        <Cell name="hover（悬停换形）">
          <SvgClipMask animate="hover" morphPaths={[BLOB_A, BLOB_B]} className="gal-fx-sq">
            <img alt="示意走势图（悬停）" src={CHART_C} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </SvgClipMask>
        </Cell>
      </Row>
    </div>
  )
}

const EQUITY_PATH = 'M4,86 C14,84 18,70 28,72 S44,56 52,58 S66,36 76,30 S90,12 96,8'
export function SvgDrawOnScrollDemo() {
  const container = useRef<HTMLDivElement>(null)
  return (
    <div className="gal-stack" data-gallery-motion="svg-draw-on-scroll" style={{ width: '100%', maxWidth: 760 }}>
      <span className="gal-note">
        在下面的框里滚动：曲线随滚动一笔画出来，笔尖挂一个标记点（策略复盘页的权益曲线入场）。
      </span>
      <div
        ref={container}
        data-scrollbox
        style={{ height: 260, overflowY: 'auto', border: '1px solid var(--line-100)', background: 'var(--bg-100)' }}
      >
        <div style={{ height: 200 }} />
        <SvgDrawOnScroll
          container={container}
          path={EQUITY_PATH}
          strokeWidth={1.6}
          className="gal-fx-draw"
          stroke="var(--accent)"
          marker={
            <span
              style={{ display: 'block', width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }}
            />
          }
        />
        <div style={{ height: 240 }} />
      </div>
    </div>
  )
}

// —— 媒体 ——
export function AsciiRenderDemo() {
  const [color, setColor] = useState<'mono' | 'source'>('mono')
  return (
    <div className="gal-stack" data-gallery-motion="ascii-render" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <ToggleGroup aria-label="着色" value={color} onValueChange={(v) => v && setColor(v as typeof color)}>
          <ToggleGroupItem value="mono">mono</ToggleGroupItem>
          <ToggleGroupItem value="source">source</ToggleGroupItem>
        </ToggleGroup>
        <span className="gal-note">把图按亮度采样成字符；读屏读 alt。</span>
      </Row>
      <AsciiRender
        alt="示意走势图的字符画"
        source={{ src: CHART_A, type: 'image' }}
        columns={72}
        fontSize={8}
        color={color}
        className="gal-fx-w"
      />
    </div>
  )
}

const DITHERS: readonly DitherAlgorithm[] = ['bayer', 'atkinson', 'floyd-steinberg', 'threshold']
export function DitherImageDemo() {
  return (
    <div className="gal-stack" data-gallery-motion="dither-image" style={{ width: '100%', maxWidth: 760 }}>
      <Row name="四种算法">
        {DITHERS.map((algorithm) => (
          <Cell key={algorithm} name={algorithm}>
            <DitherImage
              alt={`示意走势图（${algorithm}）`}
              src={CHART_B}
              algorithm={algorithm}
              width={160}
              height={110}
              pixelSize={3}
            />
          </Cell>
        ))}
      </Row>
      <Row name="四档灰度">
        <DitherImage
          alt="示意走势图（四档）"
          src={CHART_C}
          algorithm="atkinson"
          levels={4}
          width={240}
          height={160}
          pixelSize={2}
        />
      </Row>
    </div>
  )
}

const BRUSH_LABELS: PixelBrushCanvasLabels = {
  canvas: '像素画板',
  palette: '颜色',
  tools: '画笔',
  brushes: { pencil: '铅笔', eraser: '橡皮', fill: '填充', line: '直线', rect: '矩形' },
  color: (index) => `颜色 ${index + 1}`,
  cell: (column, row, colorIndex) =>
    `第 ${column} 列，第 ${row} 行，${colorIndex === null ? '空' : `颜色 ${colorIndex + 1}`}`,
  anchor: (column, row) => `起点已设在第 ${column} 列，第 ${row} 行；移动后再按空格完成`,
}
export function PixelBrushCanvasDemo() {
  const handle = useRef<import('../../src/index.ts').PixelBrushCanvasHandle>(null)
  const [count, setCount] = useState(0)
  return (
    <div className="gal-stack" data-gallery-motion="pixel-brush-canvas" style={{ width: '100%', maxWidth: 760 }}>
      <Row>
        <Button size="sm" onClick={() => handle.current?.undo()}>
          撤销
        </Button>
        <Button size="sm" onClick={() => handle.current?.clear()}>
          清空
        </Button>
        <span className="gal-note" data-testid="pixel-brush-count">
          已画 {count} 格 · 方向键移动、空格落笔、B/E/G 切笔
        </span>
      </Row>
      <PixelBrushCanvas
        ref={handle}
        labels={BRUSH_LABELS}
        grid
        width={16}
        height={12}
        pixelSize={16}
        onChange={(pixels) => setCount(pixels.filter(Boolean).length)}
      />
    </div>
  )
}
