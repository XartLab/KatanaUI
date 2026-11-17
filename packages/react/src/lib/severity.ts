// SPDX-License-Identifier: MIT
/**
 * Status severity shared by alerts, progress bars, LEDs and meters.
 * 状态语气的唯一定义（G0，体检 §1：Led、StatusIcon、Alert、Progress、Meter 与 system-monitor / decision-queue / hypothesis-ledger 的手写映射各有一套）。
 * 现有件的 props 先不改（G1 / G3 / G6 改成 tone: Severity）；颜色走 characteristics 的 --k-status-*。
 */

/** Tone of a status: neutral (no judgement), ok, warn or danger. */
export type Severity = 'neutral' | 'ok' | 'warn' | 'danger'

/** Severity plus the two LED / meter-only states: off (unlit) and accent (lit in the accent color, e.g. pending). */
export type SeverityExt = Severity | 'off' | 'accent'

/** The LED states `ledOf` maps to; structurally the same as Led's `LedState` (lib does not import components). */
export type LedOf = 'off' | 'on' | 'ok' | 'warn' | 'danger'

const LED: Record<SeverityExt, LedOf> = {
  neutral: 'off',
  off: 'off',
  accent: 'on',
  ok: 'ok',
  warn: 'warn',
  danger: 'danger',
}

/** Maps a severity to the Led state that shows it: neutral and off are unlit, accent is the lit accent LED. */
export const ledOf = (severity: SeverityExt): LedOf => LED[severity]

/** Part of a status color: text and icon, fill, or edge. */
export type StatusPart = 'foreground' | 'background' | 'borderColor'

// 变量名写全（不拼字符串）：theming.test 逐个核对引用的变量都在 tokens.css 里。
const STATUS_COLOR: Record<Severity, Record<StatusPart, string>> = {
  neutral: {
    foreground: 'var(--k-status-neutral-foreground)',
    background: 'var(--k-status-neutral-background)',
    borderColor: 'var(--k-status-neutral-borderColor)',
  },
  ok: {
    foreground: 'var(--k-status-ok-foreground)',
    background: 'var(--k-status-ok-background)',
    borderColor: 'var(--k-status-ok-borderColor)',
  },
  warn: {
    foreground: 'var(--k-status-warn-foreground)',
    background: 'var(--k-status-warn-background)',
    borderColor: 'var(--k-status-warn-borderColor)',
  },
  danger: {
    foreground: 'var(--k-status-danger-foreground)',
    background: 'var(--k-status-danger-background)',
    borderColor: 'var(--k-status-danger-borderColor)',
  },
}

/** CSS color of a severity, as a characteristics variable (`var(--k-status-ok-foreground)`). */
export const statusColor = (severity: Severity, part: StatusPart = 'foreground'): string => STATUS_COLOR[severity][part]
