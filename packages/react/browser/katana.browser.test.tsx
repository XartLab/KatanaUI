// SPDX-License-Identifier: MIT
// src/katana: one screenshot per public component, from the gallery usage demos (minimal data).
import { MeasuredSkeletonUsage } from '../gallery/usage/MeasuredSkeletonUsage.tsx'
import { beforeAll, afterAll, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { AiStatusUsage } from '../gallery/usage/AiStatusUsage.tsx'
import { AnimatedAvatarGroupUsage } from '../gallery/usage/AnimatedAvatarGroupUsage.tsx'
import { AnimatedListUsage } from '../gallery/usage/AnimatedListUsage.tsx'
import { AnimatedStepperUsage } from '../gallery/usage/AnimatedStepperUsage.tsx'
import { AnimatedTagsUsage } from '../gallery/usage/AnimatedTagsUsage.tsx'
import { CodeBlockUsage } from '../gallery/usage/CodeBlockUsage.tsx'
import { CountBadgeUsage } from '../gallery/usage/CountBadgeUsage.tsx'
import { DitherChartUsage } from '../gallery/usage/DitherChartUsage.tsx'
import { DotMatrixUsage } from '../gallery/usage/DotMatrixUsage.tsx'
import { DynamicIslandUsage } from '../gallery/usage/DynamicIslandUsage.tsx'
import { ExposureSliderUsage } from '../gallery/usage/ExposureSliderUsage.tsx'
import { GridLoaderUsage } from '../gallery/usage/GridLoaderUsage.tsx'
import { HoverExpandUsage } from '../gallery/usage/HoverExpandUsage.tsx'
import { JsonViewerUsage } from '../gallery/usage/JsonViewerUsage.tsx'
import { LcdUsage } from '../gallery/usage/LcdUsage.tsx'
import { LoadingUsage } from '../gallery/usage/LoadingUsage.tsx'
import { MacTerminalUsage } from '../gallery/usage/MacTerminalUsage.tsx'
import { MatrixOrbUsage } from '../gallery/usage/MatrixOrbUsage.tsx'
import { NotificationBellUsage } from '../gallery/usage/NotificationBellUsage.tsx'
import { PagePreloaderUsage } from '../gallery/usage/PagePreloaderUsage.tsx'
import { PinnedListUsage } from '../gallery/usage/PinnedListUsage.tsx'
import { PowerOffSlideUsage } from '../gallery/usage/PowerOffSlideUsage.tsx'
import { RollingTextUsage } from '../gallery/usage/RollingTextUsage.tsx'
import { ScrollProgressUsage } from '../gallery/usage/ScrollProgressUsage.tsx'
import { ScrubberUsage } from '../gallery/usage/ScrubberUsage.tsx'
import { SkeletonUsage } from '../gallery/usage/SkeletonUsage.tsx'
import { StatusIconUsage } from '../gallery/usage/StatusIconUsage.tsx'
import { StepPlayerUsage } from '../gallery/usage/StepPlayerUsage.tsx'
import { SwitchboardCardUsage } from '../gallery/usage/SwitchboardCardUsage.tsx'
import { BadgeUsage } from '../gallery/usage/BadgeUsage.tsx'
import { LinkUsage } from '../gallery/usage/LinkUsage.tsx'
import { PanelUsage } from '../gallery/usage/PanelUsage.tsx'
import { PillUsage } from '../gallery/usage/PillUsage.tsx'
import { SystemStatusUsage } from '../gallery/usage/SystemStatusUsage.tsx'
import { WebSearchUsage } from '../gallery/usage/WebSearchUsage.tsx'
import { MotionConfig } from 'motion/react'
import {
  ARCADE_SPRITES,
  ArcadePixel,
  InfiniteSlider,
  MeasuredSkeleton,
  WebSearchCitation,
  MotionLoader,
  Squircle,
} from '../src/index'
import { CopyToastStates } from '../gallery/pages/undo-copy.tsx'
import { mount } from './render.tsx'
import { settled, waitUntil, withFakeIntervals, withFrameClock, type FrameClock } from './settle.ts'

const items: Record<string, React.ReactNode> = {
  'ai-status': <AiStatusUsage />,
  'animated-avatar-group': <AnimatedAvatarGroupUsage />,
  'animated-list': <AnimatedListUsage />,
  'animated-stepper': <AnimatedStepperUsage />,
  'animated-tags': <AnimatedTagsUsage />,
  'copy-toast': <CopyToastStates />,
  // Animated parts (type/wipe/blink/marquee) are left out of the shot: they never settle.
  'arcade-pixel': (
    <>
      <ArcadePixel text="KATANA" pixelSize={6} />
      <ArcadePixel text="READY 01" pixelSize={4} />
      {Object.entries(ARCADE_SPRITES).map(([name, sprite]) => (
        <ArcadePixel
          key={name}
          sprite={sprite}
          label={name}
          pixelSize={5}
          palette={['transparent', 'var(--accent)', 'var(--k-content-primary-foreground)']}
        />
      ))}
    </>
  ),
  'code-block': <CodeBlockUsage />,
  'count-badge': <CountBadgeUsage />,
  'dither-chart': <DitherChartUsage />,
  'dot-matrix': <DotMatrixUsage />,
  'dynamic-island': <DynamicIslandUsage />,
  'exposure-slider': <ExposureSliderUsage />,
  'grid-loader': <GridLoaderUsage />,
  'hover-expand': <HoverExpandUsage />,
  // paused: the ticker is frame-driven, so freeze it at offset 0.
  'infinite-slider': (
    <InfiniteSlider label="Index quotes" speed={60} paused>
      <span>BTC 106,977.4 +1.20%</span>
      <span>ETH 3,814.2 +0.63%</span>
      <span>NVDA 148.62 -1.71%</span>
    </InfiniteSlider>
  ),
  'json-viewer': <JsonViewerUsage />,
  lcd: <LcdUsage />,
  loading: <LoadingUsage />,
  'mac-terminal': <MacTerminalUsage />,
  'matrix-orb': <MatrixOrbUsage />,
  'measured-skeleton': (
    <div style={{ width: 320 }}>
      <MeasuredSkeleton
        data={{ title: 'Quarterly results beat estimates' }}
        sample={{ title: 'Sample title text here' }}
        label="Loading card"
      >
        {(post) => <h3 style={{ margin: 0, font: 'inherit', fontWeight: 600 }}>{post.title}</h3>}
      </MeasuredSkeleton>
    </div>
  ),
  // Loading state (the gallery demo opens in it): bars appear after the 500ms gate.
  'measured-skeleton-loading': <MeasuredSkeletonUsage />,
  // Inside the 500ms gate the whole skeleton is invisible and only holds the space: no bars, and no empty card border.
  'measured-skeleton-wait': (
    <div style={{ width: 320 }}>
      <MeasuredSkeleton data={null} sample={{ title: 'Sample title text here' }} label="Loading card" delay={60_000}>
        {(post: { title: string }) => (
          <article style={{ padding: 12, border: '1px solid var(--line-100)', borderRadius: 'var(--radius-control)' }}>
            <h3 style={{ margin: 0, font: 'inherit', fontWeight: 600 }}>{post.title}</h3>
          </article>
        )}
      </MeasuredSkeleton>
    </div>
  ),
  // reducedMotion="always" stops the transform loops so the frame is stable.
  'motion-loader': (
    <MotionConfig reducedMotion="always">
      <MotionLoader label="Syncing positions" variant="orbit" size={32} />
    </MotionConfig>
  ),
  'notification-bell': <NotificationBellUsage />,
  'page-preloader': <PagePreloaderUsage />,
  'pinned-list': <PinnedListUsage />,
  'power-off-slide': <PowerOffSlideUsage />,
  'rolling-text': <RollingTextUsage />,
  'scroll-progress': <ScrollProgressUsage />,
  scrubber: <ScrubberUsage />,
  skeleton: <SkeletonUsage />,
  squircle: (
    <Squircle
      radius={24}
      smoothing={0.6}
      style={{ width: 96, height: 96, background: 'var(--k-surface-raised-background)' }}
    />
  ),
  'status-icon': <StatusIconUsage />,
  'step-player': <StepPlayerUsage />,
  'switchboard-card': <SwitchboardCardUsage />,
  badge: <BadgeUsage />,
  'web-search': <WebSearchUsage />,
  link: <LinkUsage />,
  panel: <PanelUsage />,
  pill: <PillUsage />,
  'system-status': <SystemStatusUsage />,
  'web-search-citation': (
    <p style={{ margin: 0 }}>
      Central bank cuts reserve ratio
      <WebSearchCitation
        source={{
          id: 'a',
          site: 'Reuters',
          title: 'Reserve ratio cut by 0.5 points',
          snippet: 'Releases about 1 trillion yuan.',
        }}
        index={1}
      />
      , tech stocks rally
      <WebSearchCitation source={{ id: 'b', site: 'Bloomberg', title: 'Tech leads the rally' }} index={2} />.
    </p>
  ),
}

// loading：骨架 500ms 后才出、2s 转「仍在加载」，等 250ms 截到哪边看机器忙不忙（#190）；钉在 1000ms 截骨架。
const settle: Record<string, number> = { 'page-preloader': 1500, 'measured-skeleton-loading': 900, loading: 1000 }

// Freeze the clock (Date only, so timers still run): today/relative-time cells must not drift between days.
const NOW = new Date('2026-11-17T09:00:00')
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterAll(() => vi.useRealTimers())

// 件自己一直在动、永远没有「画完」的时刻：用确定的时钟把它走到固定的一步，再截（#219）。
// 终端回放按 40ms 一跳数跳数（不是按时间），脚本放完才是终态：等可见区（<pre>，sr-only 里一开始就有整段文字）出现最后一行。
const ready: Record<string, () => boolean> = {
  'mac-terminal': () =>
    document.querySelector('[data-slot="mac-terminal"] pre')?.textContent?.includes('sharpe 1.42') ?? false,
}
// 画布按 requestAnimationFrame 与 performance.now 画的：虚拟时钟走固定的帧数后不再有帧（withFrameClock，出错也会恢复真时钟）。
// matrix-orb 永远在动，走 60 帧（1 秒）；dither-chart 的 900ms 画入是有限的，等第一帧排上（IntersectionObserver 触发）后走到没有帧为止，即演示件的终态。
const framed: Record<string, (clock: FrameClock) => Promise<void> | void> = {
  'matrix-orb': (clock) => clock.step(60),
  'dither-chart': async (clock) => {
    await waitUntil(() => clock.pending() > 0, 'dither-chart first frame')
    clock.runToIdle()
  },
}
// 灯随 setInterval 变（SwitchboardCard，每 200ms 一跳，种子固定）：假的 setInterval 走 8 跳（1.6s），之后不再跳（withFakeIntervals，出错也会换回只假 Date）。
const SWITCHBOARD_TICKS = 8

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items)) {
      test(name, async () => {
        await page.viewport(960, 1800)
        const render = async () => {
          await mount(
            <div
              style={{
                width: 720,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {node}
            </div>,
            theme,
          )
          await new Promise((r) => setTimeout(r, settle[name] ?? 250)) // let measuring / enter transitions finish
        }
        const drive = framed[name]
        if (drive)
          await withFrameClock(async (clock) => {
            await render()
            await drive(clock)
          })
        else if (name === 'switchboard-card')
          await withFakeIntervals(NOW, async (advance) => {
            await render()
            advance(200 * SWITCHBOARD_TICKS)
          })
        else await render()
        const done = ready[name]
        if (done) await waitUntil(done, name)
        await settled()
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-katana-${name}`)
      })
    }
  })
}
