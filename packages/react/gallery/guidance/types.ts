// SPDX-License-Identifier: MIT
// 组件页「怎么用」「无障碍」两个页签的内容（照 Salt 组件页：示例 / 怎么用 / 无障碍，页头写别名）。
// 按组分文件（forms.ts、quant.ts…），一页一条，键是页 id。每条一句话，不写废话：能删的字都删。

export type Guidance = {
  /** 也叫（别的产品、别的设计系统里的叫法），用来搜。 */
  aliases?: readonly string[]
  /** 什么时候用。 */
  use?: readonly string[]
  /** 什么时候别用（改用什么）。页数据里原有的「不要」接在后面。 */
  avoid?: readonly string[]
  /** 无障碍：角色、读屏名、焦点、对比度、动态。键盘表另列。 */
  a11y?: readonly string[]
}

export type GuidanceMap = Readonly<Record<string, Guidance>>
