// SPDX-License-Identifier: MIT
// 渲染设置（2026-11-17）：应用「设置 → 渲染」那一页的件，每一项一行：名称、一句说明、控件，照原生程序的渲染设置页（如 Tern、Windows Terminal）的写法。
// 值落在根节点上（theme/rendering.css 读）：data-text-smoothing、data-pixel-snap、data-numerals、data-cjk-adjust 与 --k-weight-adjust、--k-text-scale。
// 件本身不存值：调用方拿 onChange 的值自己存（本地设置文件、localStorage 都行），启动时用 applyRendering 写回根节点。

import type { ReactNode } from 'react'
import { Button } from '../primitives/button.tsx'
import { Slider } from '../primitives/slider.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'

export type RenderingSettingsValue = {
  /** grayscale：灰度平滑（默认）；system：交回系统默认（macOS 上可能是子像素）。 */
  smoothing: 'grayscale' | 'system'
  /** 网格、基线、柱子与格子吸到设备像素。 */
  pixelSnap: boolean
  /** 全部文字档的字重加减，-60..+60，默认 0。 */
  weightAdjust: number
  /** 全部文字档的字号缩放，0.85..1.3，默认 1；结果取整到整像素。 */
  textScale: number
  /** 数字 0 带斜线。 */
  slashedZero: boolean
  /** 中英混排按大写字母高度对齐汉字回退字体。 */
  cjkAdjust: boolean
}

export const DEFAULT_RENDERING: RenderingSettingsValue = {
  smoothing: 'grayscale',
  pixelSnap: true,
  weightAdjust: 0,
  textScale: 1,
  slashedZero: false,
  cjkAdjust: false,
}

/** 把设置写到根节点（或给定节点）上；默认值对应的属性会移除，根节点保持干净。 */
export function applyRendering(value: RenderingSettingsValue, root: HTMLElement = document.documentElement) {
  const set = (name: string, on: boolean, text: string) =>
    on ? root.setAttribute(name, text) : root.removeAttribute(name)
  set('data-text-smoothing', value.smoothing !== 'grayscale', value.smoothing)
  set('data-pixel-snap', !value.pixelSnap, 'off')
  set('data-numerals', value.slashedZero, 'slashed')
  set('data-cjk-adjust', value.cjkAdjust, 'cap')
  const prop = (name: string, on: boolean, text: string) =>
    on ? root.style.setProperty(name, text) : root.style.removeProperty(name)
  prop('--k-weight-adjust', value.weightAdjust !== 0, String(value.weightAdjust))
  prop('--k-text-scale', value.textScale !== 1, String(value.textScale))
}

/** 从根节点读回当前设置（没写过的项是默认值）。 */
export function readRendering(target?: HTMLElement): RenderingSettingsValue {
  if (!target && typeof document === 'undefined') return DEFAULT_RENDERING
  const root = target ?? document.documentElement
  const num = (name: string, fallback: number) => {
    const raw = Number.parseFloat(root.style.getPropertyValue(name))
    return Number.isFinite(raw) ? raw : fallback
  }
  return {
    smoothing: root.getAttribute('data-text-smoothing') === 'system' ? 'system' : 'grayscale',
    pixelSnap: root.getAttribute('data-pixel-snap') !== 'off',
    weightAdjust: num('--k-weight-adjust', 0),
    textScale: num('--k-text-scale', 1),
    slashedZero: root.getAttribute('data-numerals') === 'slashed',
    cjkAdjust: root.getAttribute('data-cjk-adjust') === 'cap',
  }
}

export type RenderingSettingsLabels = {
  smoothing: string
  smoothingHint: string
  grayscale: string
  system: string
  pixelSnap: string
  pixelSnapHint: string
  weight: string
  weightHint: string
  scale: string
  scaleHint: string
  zero: string
  zeroHint: string
  cjk: string
  cjkHint: string
  on: string
  off: string
  reset: string
}

export const RENDERING_LABELS_ZH: RenderingSettingsLabels = {
  smoothing: '文字平滑',
  smoothingHint:
    '灰度：每个像素只算明暗，字边在暗底上更干净。系统：交给操作系统（macOS 可能是子像素）。Windows 的 ClearType 由系统管，在「调整 ClearType 文本」里调。',
  grayscale: '灰度',
  system: '系统',
  pixelSnap: '像素对齐',
  pixelSnapHint: '网格、基线、柱子与格子的边吸到屏幕像素上，1px 线不会糊成两条浅线。曲线不吸。',
  weight: '字重补偿',
  weightHint:
    '暗底上的浅色字看着比实际粗，不同显示器与平滑方式也不一样；往负调变细，往正调变粗。只改笔画粗细的观感，不改字号。',
  scale: '字号',
  scaleHint: '全部文字一起缩放，结果取整到整像素，行高跟着走。',
  zero: '斜线零',
  zeroHint: '数字 0 带斜线，跟字母 O 区分（代码、订单号、价格）。',
  cjk: '中英对齐',
  cjkHint: '按大写字母高度把汉字字体缩放到跟英文一致，混排时大小更齐；汉字可能略大或略小，按观感开关。',
  on: '开',
  off: '关',
  reset: '恢复默认',
}

function Row({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="k-render-row" data-slot="rendering-row">
      <div className="k-render-text">
        <div className="k-render-title">{title}</div>
        <p className="k-render-hint">{hint}</p>
      </div>
      <div className="k-render-control">{children}</div>
    </div>
  )
}

function Switch({
  value,
  onChange,
  labels,
  name,
}: {
  value: boolean
  onChange: (next: boolean) => void
  labels: RenderingSettingsLabels
  name: string
}) {
  return (
    <ToggleGroup
      variant="sm"
      value={value ? 'on' : 'off'}
      onValueChange={(next) => next && onChange(next === 'on')}
      aria-label={name}
    >
      <ToggleGroupItem value="off">{labels.off}</ToggleGroupItem>
      <ToggleGroupItem value="on">{labels.on}</ToggleGroupItem>
    </ToggleGroup>
  )
}

export type RenderingSettingsProps = {
  value: RenderingSettingsValue
  onChange: (next: RenderingSettingsValue) => void
  labels?: RenderingSettingsLabels
}

/** 渲染设置面板：受控件，值由调用方保存；一般在 onChange 里调 applyRendering 并存盘。 */
export function RenderingSettings({ value, onChange, labels = RENDERING_LABELS_ZH }: RenderingSettingsProps) {
  const patch = (part: Partial<RenderingSettingsValue>) => onChange({ ...value, ...part })
  return (
    <div className="k-render" data-slot="rendering-settings">
      <Row title={labels.smoothing} hint={labels.smoothingHint}>
        <ToggleGroup
          variant="sm"
          value={value.smoothing}
          onValueChange={(next) => next && patch({ smoothing: next as RenderingSettingsValue['smoothing'] })}
          aria-label={labels.smoothing}
        >
          <ToggleGroupItem value="grayscale">{labels.grayscale}</ToggleGroupItem>
          <ToggleGroupItem value="system">{labels.system}</ToggleGroupItem>
        </ToggleGroup>
      </Row>
      <Row title={labels.pixelSnap} hint={labels.pixelSnapHint}>
        <Switch
          name={labels.pixelSnap}
          value={value.pixelSnap}
          onChange={(pixelSnap) => patch({ pixelSnap })}
          labels={labels}
        />
      </Row>
      <Row title={labels.weight} hint={labels.weightHint}>
        <div className="k-render-slider">
          <Slider
            value={[value.weightAdjust]}
            min={-60}
            max={60}
            step={10}
            onValueChange={(next) => patch({ weightAdjust: next[0] ?? 0 })}
            aria-label={labels.weight}
          />
          <output className="k-render-out">
            {value.weightAdjust > 0 ? `+${value.weightAdjust}` : value.weightAdjust}
          </output>
        </div>
      </Row>
      <Row title={labels.scale} hint={labels.scaleHint}>
        <div className="k-render-slider">
          <Slider
            value={[value.textScale]}
            min={0.85}
            max={1.3}
            step={0.05}
            onValueChange={(next) => patch({ textScale: Math.round((next[0] ?? 1) * 100) / 100 })}
            aria-label={labels.scale}
          />
          <output className="k-render-out">{Math.round(value.textScale * 100)}%</output>
        </div>
      </Row>
      <Row title={labels.zero} hint={labels.zeroHint}>
        <Switch
          name={labels.zero}
          value={value.slashedZero}
          onChange={(slashedZero) => patch({ slashedZero })}
          labels={labels}
        />
      </Row>
      <Row title={labels.cjk} hint={labels.cjkHint}>
        <Switch
          name={labels.cjk}
          value={value.cjkAdjust}
          onChange={(cjkAdjust) => patch({ cjkAdjust })}
          labels={labels}
        />
      </Row>
      <div className="k-render-foot">
        <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_RENDERING)}>
          {labels.reset}
        </Button>
      </div>
    </div>
  )
}
