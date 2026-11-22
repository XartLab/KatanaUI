// SPDX-License-Identifier: MIT
import { RenderingSettingsUsage } from '../usage/RenderingSettingsUsage'
import type { Pattern } from './types'

const pattern: Pattern = {
  id: 'preferences',
  title: '偏好设置',
  summary: '用户自己调的设置页：每项一行——名称、一句说明、控件；改了立刻生效，不要「应用」按钮。',
  Demo: RenderingSettingsUsage,
  use: ['影响整个应用、用户会按自己习惯调的东西：渲染、字体、密度、主题、声音', '一次可能改好几项、要边改边看效果'],
  avoid: ['一次性的操作确认：用对话框', '只影响一个面板的选项：放在面板自己的菜单里'],
  parts: [
    { page: 'rendering-settings', role: '渲染一节的现成实现' },
    { page: 'toggle-group', role: '两三个互斥选项（灰度 / 系统）' },
    { page: 'switch', role: '开 / 关' },
    { page: 'slider', role: '连续值（字重补偿、字号），右边写当前值' },
    { page: 'select', role: '选项多于 4 个（字体）' },
  ],
  rules: [
    '一项一行：左边名称（13px 600）+ 一句说明（11px 淡一档），右边控件固定 220 宽',
    '改了立刻生效，不要「应用 / 取消」；底部只放「恢复默认」',
    '值存在应用里（设置文件或 localStorage），启动时写回；件不存值',
    '按主题分节（渲染、字体、行情、声音），节名小号大写',
    '调不了的只读项不做假开关：用读数显示（如 GPU、DPR）',
  ],
  source: {
    label: 'Salt · Preferences dialog',
    href: 'https://www.saltdesignsystem.com/salt/patterns/preferences-dialog',
  },
}
export default pattern
