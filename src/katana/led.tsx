// SPDX-License-Identifier: MIT
// 组件卡 StatusLED。LED 默认 off；只表达真实状态，必须配文字或 aria-label。
// 搬自 src/ui（#1860）：样子与行为没改，皮肤在 ../theme/led.css。

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
  state?: LedState
  group?: LinkGroup | null
  hollow?: boolean
  /** 旁边没有写出状态的文字：熄灭态画一圈 3:1 的环，不靠近乎看不见的暗点单独表示（WCAG 1.4.11，#477）。 */
  bare?: boolean
  /** 6px 的小灯：药丸这样的行内小件里用（来源角标，#1069）。 */
  small?: boolean
  label: string
}) {
  const tone = group ? `link-${group.toLowerCase()}` : state === 'off' ? '' : state
  return (
    <span
      className={`k-led${tone ? ` ${tone}` : ''}${hollow ? ' hollow' : ''}${bare ? ' bare' : ''}${small ? ' sm' : ''}`}
      role="img"
      aria-label={label}
    />
  )
}
