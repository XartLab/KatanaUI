// SPDX-License-Identifier: MIT
// 改自 SmoothUI shader-reveal-transition（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。
// 原件有九个出口：共用引擎 shader-reveal-transition 加八个只换 variant 的薄壳（circle、luma、noise、planetary、push、stripes、wipe、zoom），
// 这里归成一个 ShaderReveal 加 variant 参数；原件名记在文档页的别名里。引擎在 ./engine.ts，WebGL 不可用时退回淡入淡出（见 ./stage.tsx）。
import { SHADER_REVEAL_FRAGMENT } from './shaders.ts'
import { EASES, type TransitionSpec } from './engine.ts'
import { ShaderTransitionStage, type ShaderTransitionStageProps } from './stage.tsx'

export type ShaderRevealVariant = 'noise' | 'zoom' | 'circle' | 'wipe' | 'luma' | 'planetary' | 'stripes' | 'push'

/** 着色器里 uVariant 的取值顺序，跟 shaders.ts 的 if 分支一一对应，别改序。 */
const VARIANT_INDEX: Record<ShaderRevealVariant, number> = {
  noise: 0,
  zoom: 1,
  circle: 2,
  wipe: 3,
  luma: 4,
  planetary: 5,
  stripes: 6,
  push: 7,
}

/** 原件：easeOutQuart、1080ms、过半换内容、收尾 90ms 淡出。 */
const SPEC: TransitionSpec = {
  fragment: SHADER_REVEAL_FRAGMENT,
  ease: EASES.quart,
  fadeMs: 90,
  duration: 1080,
}

export type ShaderRevealProps = Omit<ShaderTransitionStageProps, 'spec' | 'variantIndex'> & {
  /** Which shader effect plays between the two contents. */
  variant?: ShaderRevealVariant
}

export function ShaderReveal({ variant = 'noise', ...props }: ShaderRevealProps) {
  return <ShaderTransitionStage {...props} spec={SPEC} variantIndex={VARIANT_INDEX[variant]} />
}
