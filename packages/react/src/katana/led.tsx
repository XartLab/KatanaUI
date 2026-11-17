// SPDX-License-Identifier: MIT
// 组件卡 StatusLED。LED 默认 off；只表达真实状态，必须配文字或 aria-label。
// 搬自 src/ui（#1860）：样子与行为没改，皮肤在 ../theme/led.css。
// 状态变了在灯外画一圈光晕闪一次（共用层 useStatusFlash；灯自己的底色就是状态色，闪底色看不见，所以闪外圈）：变坏（警告、危险）用警示闪，变好用涨色闪。
import { useStatusFlash } from '../lib/live.ts'

export type LedState = 'off' | 'on' | 'ok' | 'warn' | 'danger'

/** 联动组：同组的面板跟着同一个品种走。组的颜色在组件卡里（theme/led.css 的 link-a…d），所以组名定义在这里。 */
export type LinkGroup = 'A' | 'B' | 'C' | 'D'
export const LINK_GROUPS: readonly LinkGroup[] = ['A', 'B', 'C', 'D']

export function Led({
  state = 'off',
  group,
  hollow,
  bare,
  small,
  label,
}: {
  /** on glows orange; ok, warn and danger are green, amber and red. */
  state?: LedState
  /** Link group: panels in the same group follow the same symbol; the group color overrides state. */
  group?: LinkGroup | null
  /** Hollow: transparent fill with a 1px border, no glow. */
  hollow?: boolean
  /**
   * Set when no text next to the light names the state: the off state draws a 3:1 ring instead of a barely visible dark dot.
   * 旁边没有写出状态的文字：熄灭态画一圈 3:1 的环，不靠近乎看不见的暗点单独表示（WCAG 1.4.11，#477）。
   */
  bare?: boolean
  /**
   * A 6px light for inline pieces such as pills.
   * 6px 的小灯：药丸这样的行内小件里用（来源角标，#1069）。
   */
  small?: boolean
  /** Accessible name (required). */
  label: string
}) {
  const tone = group ? `link-${group.toLowerCase()}` : state === 'off' ? '' : state
  const changed = useStatusFlash(state)
  return (
    <span
      className={`k-led${tone ? ` ${tone}` : ''}${hollow ? ' hollow' : ''}${bare ? ' bare' : ''}${small ? ' sm' : ''}`}
      role="img"
      aria-label={label}
    >
      {changed.flash && (
        <i
          key={changed.key}
          className={state === 'warn' || state === 'danger' ? 'k-led-halo k-live-alert' : 'k-led-halo k-live-flash'}
          data-tone={state === 'danger' ? 'negative' : undefined}
          data-flash={state === 'warn' || state === 'danger' ? undefined : 'up'}
          aria-hidden="true"
        />
      )}
    </span>
  )
}
