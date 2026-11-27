// SPDX-License-Identifier: MIT
// 改自 SmoothUI sdf-blob-transition（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。
// 原件有五个出口：共用引擎 sdf-blob-transition 加四个只换 variant 的薄壳（sdf-circle、warped-circle、organic-merge、radial-circles），
// 这里归成一个 SdfBlobTransition 加 variant 参数；原件名记在文档页的别名里。引擎共用 ./shader-reveal/engine.ts。
import { SDF_BLOB_FRAGMENT } from './shader-reveal/shaders.ts'
import { EASES, type TransitionSpec } from './shader-reveal/engine.ts'
import { ShaderTransitionStage, type ShaderTransitionStageProps } from './shader-reveal/stage.tsx'

export type SdfBlobVariant = 'circle' | 'warped' | 'merge' | 'radial' | 'final'

/** 着色器里 uVariant 的取值顺序（0 到 4），跟 shaders.ts 的 if 分支一一对应。 */
const VARIANT_INDEX: Record<SdfBlobVariant, number> = { circle: 0, warped: 1, merge: 2, radial: 3, final: 4 }

/** 原件：easeOutQuart、1120ms、过半换内容、收尾 90ms 淡出。 */
const SPEC: TransitionSpec = {
  fragment: SDF_BLOB_FRAGMENT,
  ease: EASES.quart,
  fadeMs: 90,
  duration: 1120,
}

export type SdfBlobTransitionProps = Omit<ShaderTransitionStageProps, 'spec' | 'variantIndex'> & {
  /** Shape of the blobs: one circle, a warped ring, two merging blobs, a radial cluster, or all of them. */
  variant?: SdfBlobVariant
}

export function SdfBlobTransition({ variant = 'final', ...props }: SdfBlobTransitionProps) {
  return <ShaderTransitionStage {...props} spec={SPEC} variantIndex={VARIANT_INDEX[variant]} />
}
