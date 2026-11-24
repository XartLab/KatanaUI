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
import { ToastStackStates } from '../gallery/pages/toast-stack.tsx'
import { mount } from './render.tsx'

const items: Record<string, React.ReactNode> = {
  'ai-status': <AiStatusUsage />,
  'animated-avatar-group': <AnimatedAvatarGroupUsage />,
  'animated-list': <AnimatedListUsage />,
  'animated-stepper': <AnimatedStepperUsage />,
  'animated-tags': <AnimatedTagsUsage />,
  'copy-toast': <CopyToastStates />,
  'toast-stack': <ToastStackStates />,
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

const settle: Record<string, number> = { 'page-preloader': 1500, 'measured-skeleton-loading': 900, 'toast-stack': 700 }

// Freeze the clock (Date only, so timers still run): today/relative-time cells must not drift between days.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-17T09:00:00'))
})
afterAll(() => vi.useRealTimers())

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items)) {
      test(name, async () => {
        await page.viewport(960, 1800)
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
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-katana-${name}`)
      })
    }
  })
}
