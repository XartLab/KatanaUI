// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-core（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// AI 件共用的状态约定：同一个 AiState 传给状态球、输入框、工具卡，整面一起动，而不是各动各的。
// 只搬了「状态与动效参数」；原件里的麦克风振幅钩子（useAudioAmplitude）不搬：我们的件不碰麦克风，聆听电平由调用方传给 MatrixOrb。
// 状态名与 MatrixOrb 的 OrbState 是同一组，所以这里直接取它的类型，不再造一份。
import type { OrbState } from '../katana/matrix-orb-model.ts'
import { statusColor } from '../lib/severity.ts'

/** 六种状态：待命、聆听、思考、流式输出、完成、出错。 */
export type AiState = OrbState

/** 每个状态用什么「动作」表达（各件用自己的材质画它，不叠同一张图）。 */
export type AiStateMotif = 'breathe' | 'receive' | 'scan' | 'pulse' | 'ping' | 'fault'

/** 状态的语义色：完成是绿、出错是红，其余不带色（颜色之外还有动作，不只靠色相）。 */
export type AiStateAccent = 'success' | 'danger' | null

export type AiStateMotion = {
  accent: AiStateAccent
  motif: AiStateMotif
  /** 环境循环的快慢倍数，1 是件自己的基准节奏。 */
  speed: number
  /** 离散脉冲之间隔几秒。 */
  pulseSeconds: number
}

// 取自 SmoothUI AI_STATE_MOTION 里与我们的件相关的几列（其余是它的着色器参数，我们没有着色器）。
// 要点：thinking 不放大（只在内部翻动，免得页面抖）；done 过冲一次再回；每个状态有自己的 motif，靠「什么在动」区分，不靠「动得多快」。
export const AI_STATE_MOTION: Readonly<Record<AiState, AiStateMotion>> = {
  idle: { accent: null, motif: 'breathe', speed: 0.6, pulseSeconds: 4.5 },
  listening: { accent: null, motif: 'receive', speed: 1, pulseSeconds: 1.6 },
  thinking: { accent: null, motif: 'scan', speed: 2.4, pulseSeconds: 1.1 },
  streaming: { accent: null, motif: 'pulse', speed: 1.4, pulseSeconds: 1.25 },
  done: { accent: 'success', motif: 'ping', speed: 0.8, pulseSeconds: 0.65 },
  error: { accent: 'danger', motif: 'fault', speed: 1, pulseSeconds: 0.9 },
}

/** 语义色走 lib/severity.ts 的状态色（--k-status-ok / danger-foreground；不是涨跌色，涨跌色会按市场习惯互换）。 */
export const AI_ACCENT_COLORS: Readonly<Record<'success' | 'danger', string>> = {
  success: statusColor('ok'),
  danger: statusColor('danger'),
}

/** 某状态的动效参数；没传或不认识的状态当 idle。 */
export const getAiStateMotion = (state: AiState | undefined): AiStateMotion =>
  AI_STATE_MOTION[state ?? 'idle'] ?? AI_STATE_MOTION.idle

/** 某状态的语义色，没有就返回 fallback。 */
export const getAiStateAccentColor = (state: AiState | undefined, fallback: string): string => {
  const accent = getAiStateMotion(state).accent
  return accent ? AI_ACCENT_COLORS[accent] : fallback
}
