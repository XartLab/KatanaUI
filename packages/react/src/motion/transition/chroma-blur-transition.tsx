// SPDX-License-Identifier: MIT
// 改自 SmoothUI chroma-blur-transition（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）：带色散的柔光帘子斜着扫过。
// 引擎与舞台共用 ./shader-reveal 下的内部模块；没有 variant。
import { CHROMA_BLUR_FRAGMENT } from './shader-reveal/shaders.ts'
import { EASES, type TransitionSpec } from './shader-reveal/engine.ts'
import { ShaderTransitionStage, type ShaderTransitionStageProps } from './shader-reveal/stage.tsx'

/** 原件：easeOutQuart、1040ms、过半换内容、收尾 90ms 淡出。 */
const SPEC: TransitionSpec = {
  fragment: CHROMA_BLUR_FRAGMENT,
  ease: EASES.quart,
  fadeMs: 90,
  duration: 1040,
}

export type ChromaBlurTransitionProps = Omit<ShaderTransitionStageProps, 'spec' | 'variantIndex'>

export function ChromaBlurTransition(props: ChromaBlurTransitionProps) {
  return <ShaderTransitionStage {...props} spec={SPEC} />
}
