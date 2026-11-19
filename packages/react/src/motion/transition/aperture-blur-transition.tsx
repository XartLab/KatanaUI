// SPDX-License-Identifier: MIT
// 改自 SmoothUI aperture-blur-transition（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：光圈从中心扩开的环形光。
// 引擎与舞台共用 ./shader-reveal 下的内部模块；没有 variant。
import { APERTURE_BLUR_FRAGMENT } from './shader-reveal/shaders.ts'
import { EASES, type TransitionSpec } from './shader-reveal/engine.ts'
import { ShaderTransitionStage, type ShaderTransitionStageProps } from './shader-reveal/stage.tsx'

/** 原件：easeOutCubic、760ms、进度到 0.48 换内容、收尾 70ms 淡出。 */
const SPEC: TransitionSpec = {
  fragment: APERTURE_BLUR_FRAGMENT,
  ease: EASES.cubic,
  midpoint: 0.48,
  fadeMs: 70,
  duration: 760,
}

export type ApertureBlurTransitionProps = Omit<ShaderTransitionStageProps, 'spec' | 'variantIndex'>

export function ApertureBlurTransition(props: ApertureBlurTransitionProps) {
  return <ShaderTransitionStage {...props} spec={SPEC} />
}
