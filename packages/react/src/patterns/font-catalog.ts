// SPDX-License-Identifier: MIT
// 字体目录（2026-11-17，用户：「字体可能还是太少了」）：渲染设置里按角色挑字体用的清单。
// 四个角色：ui（界面拉丁）、cjk（汉字）、num（数据字：价格、数量、刻度、代码号与小标签）、mono（代码、JSON、日志）。
// kind：system = 系统自带，不用加载；web = 开源字体，应用要自己装对应的 package 并引它的 CSS（件不替你加载，文档站引了全部）；
// local = 只用本机装了的（许可证不便打包，或体积太大），没装就落到下一个字体。
// 选择只改根节点上的字体变量（--font-sans、--font-sans-small、--font-sans-display、--font-num、--font-num-small、--font-mono），组件不用改。

export type FontRole = 'ui' | 'cjk' | 'num' | 'mono'
export type FontKind = 'system' | 'web' | 'local'

export type FontOption = {
  id: string
  label: string
  /** CSS font-family 里写的名字（不含回退）。system 项为空，用默认栈。 */
  family: string
  roles: readonly FontRole[]
  kind: FontKind
  /** web 项：npm 包名（应用引它的 CSS）。 */
  pkg?: string
  license?: string
  note?: string
}

/** 系统默认栈（跟 tokens.json 的 families 一致）：按平台的界面字体与光学档。 */
const SYSTEM_UI = {
  text: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, Ubuntu',
  small: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Small", "Segoe UI", Roboto, Ubuntu',
  display: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Roboto, Ubuntu',
} as const
const SYSTEM_CJK = '"PingFang SC", "Microsoft YaHei UI", "Noto Sans SC"'
const SYSTEM_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono"'

export const FONT_CATALOG: readonly FontOption[] = [
  // 界面拉丁
  {
    id: 'system',
    label: '系统界面字体',
    family: '',
    roles: ['ui', 'cjk', 'num', 'mono'],
    kind: 'system',
    note: 'macOS 用 SF，Windows 11 用 Segoe UI Variable（按字号分 Small / Text / Display），汉字苹方 / 微软雅黑。',
  },
  {
    id: 'inter',
    label: 'Inter',
    family: '"Inter Variable"',
    roles: ['ui', 'num'],
    kind: 'web',
    pkg: '@fontsource-variable/inter',
    license: 'OFL-1.1',
    note: '为屏幕设计的界面字体，带光学尺寸；数字有 tnum 与斜线零。',
  },
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    family: '"IBM Plex Sans"',
    roles: ['ui', 'num'],
    kind: 'web',
    pkg: '@fontsource/ibm-plex-sans',
    license: 'OFL-1.1',
    note: '工程感，字形区分度高（1 l I）。',
  },
  {
    id: 'roboto-flex',
    label: 'Roboto Flex',
    family: '"Roboto Flex Variable"',
    roles: ['ui', 'num'],
    kind: 'web',
    pkg: '@fontsource-variable/roboto-flex',
    license: 'OFL-1.1',
    note: '带 GRAD（等宽改粗细）与光学尺寸轴。',
  },
  {
    id: 'source-sans-3',
    label: 'Source Sans 3',
    family: '"Source Sans 3 Variable"',
    roles: ['ui'],
    kind: 'web',
    pkg: '@fontsource-variable/source-sans-3',
    license: 'OFL-1.1',
    note: 'Adobe 的界面字体，与思源黑体同源，中英混排协调。',
  },
  {
    id: 'geist',
    label: 'Geist',
    family: '"Geist Variable"',
    roles: ['ui', 'num'],
    kind: 'web',
    pkg: '@fontsource-variable/geist',
    license: 'OFL-1.1',
    note: 'Vercel 的界面字体，紧凑。',
  },
  {
    id: 'public-sans',
    label: 'Public Sans',
    family: '"Public Sans Variable"',
    roles: ['ui'],
    kind: 'web',
    pkg: '@fontsource-variable/public-sans',
    license: 'OFL-1.1',
    note: '美国政府设计系统（USWDS）用的中性字体。',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    family: '"Space Grotesk Variable"',
    roles: ['ui', 'num'],
    kind: 'web',
    pkg: '@fontsource-variable/space-grotesk',
    license: 'OFL-1.1',
    note: '几何感，数字有个性。',
  },
  {
    id: 'barlow-condensed',
    label: 'Barlow Condensed',
    family: '"Barlow Condensed"',
    roles: ['num'],
    kind: 'web',
    pkg: '@fontsource/barlow-condensed',
    license: 'OFL-1.1',
    note: '窄体，表格里同宽放得下更多位数（旧设计稿的标题与数字字）。',
  },
  {
    id: 'harmonyos-sans',
    label: 'HarmonyOS Sans SC',
    family: '"HarmonyOS Sans SC"',
    roles: ['ui', 'cjk'],
    kind: 'local',
    note: '本机装了才有。',
  },
  {
    id: 'misans',
    label: 'MiSans',
    family: '"MiSans", "MiSans VF"',
    roles: ['ui', 'cjk'],
    kind: 'local',
    note: '本机装了才有。',
  },
  // 汉字
  {
    id: 'noto-sans-sc',
    label: '思源黑体 / Noto Sans SC',
    family: '"Noto Sans SC Variable"',
    roles: ['cjk'],
    kind: 'web',
    pkg: '@fontsource-variable/noto-sans-sc',
    license: 'OFL-1.1',
    note: '按用到的字分片加载。',
  },
  {
    id: 'source-han-sans',
    label: '思源黑体（本机）',
    family: '"Source Han Sans SC", "Source Han Sans CN", "思源黑体"',
    roles: ['cjk'],
    kind: 'local',
    note: '本机装了才有。',
  },
  {
    id: 'sarasa',
    label: '更纱黑体 Sarasa UI SC',
    family: '"Sarasa UI SC", "Sarasa Gothic SC"',
    roles: ['cjk'],
    kind: 'local',
    note: '本机装了才有。',
  },
  {
    id: 'yahei',
    label: '微软雅黑 UI',
    family: '"Microsoft YaHei UI", "Microsoft YaHei"',
    roles: ['cjk'],
    kind: 'local',
    note: 'Windows 自带，为 ClearType 调过。',
  },
  { id: 'pingfang', label: '苹方', family: '"PingFang SC"', roles: ['cjk'], kind: 'local', note: 'macOS 自带。' },
  {
    id: 'smiley-sans',
    label: '得意黑（标题感）',
    family: '"Smiley Sans Oblique"',
    roles: ['cjk'],
    kind: 'web',
    pkg: '@chinese-fonts/dyh',
    license: 'OFL-1.1',
    note: '斜窄体，只适合标题与大字。',
  },
  // 等宽（代码，也可做数据字）
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    family: '"JetBrains Mono Variable"',
    roles: ['mono', 'num'],
    kind: 'web',
    pkg: '@fontsource-variable/jetbrains-mono',
    license: 'OFL-1.1',
  },
  {
    id: 'ibm-plex-mono',
    label: 'IBM Plex Mono',
    family: '"IBM Plex Mono"',
    roles: ['mono', 'num'],
    kind: 'web',
    pkg: '@fontsource/ibm-plex-mono',
    license: 'OFL-1.1',
  },
  {
    id: 'geist-mono',
    label: 'Geist Mono',
    family: '"Geist Mono Variable"',
    roles: ['mono', 'num'],
    kind: 'web',
    pkg: '@fontsource-variable/geist-mono',
    license: 'OFL-1.1',
  },
  {
    id: 'roboto-mono',
    label: 'Roboto Mono',
    family: '"Roboto Mono Variable"',
    roles: ['mono', 'num'],
    kind: 'web',
    pkg: '@fontsource-variable/roboto-mono',
    license: 'OFL-1.1',
  },
  {
    id: 'iosevka',
    label: 'Iosevka',
    family: '"Iosevka"',
    roles: ['mono', 'num'],
    kind: 'web',
    pkg: '@fontsource/iosevka',
    license: 'OFL-1.1',
    note: '窄等宽，一屏放更多列。',
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    family: '"Fira Code Variable"',
    roles: ['mono'],
    kind: 'web',
    pkg: '@fontsource-variable/fira-code',
    license: 'OFL-1.1',
  },
  {
    id: 'chivo-mono',
    label: 'Chivo Mono',
    family: '"Chivo Mono"',
    roles: ['mono', 'num'],
    kind: 'web',
    pkg: '@fontsource/chivo-mono',
    license: 'OFL-1.1',
  },
  {
    id: 'maple-mono-cn',
    label: 'Maple Mono CN',
    family: '"Maple Mono CN"',
    roles: ['mono', 'num'],
    kind: 'web',
    pkg: '@chinese-fonts/maple-mono-cn',
    license: 'OFL-1.1',
    note: '汉字宽 = 2 个拉丁宽，中英混排的表格列能对齐（旧设计稿的数据字）。',
  },
  {
    id: 'cascadia',
    label: 'Cascadia Mono',
    family: '"Cascadia Mono", "Cascadia Code"',
    roles: ['mono', 'num'],
    kind: 'local',
    note: 'Windows 11 自带。',
  },
  {
    id: 'sarasa-mono',
    label: '更纱等宽 Sarasa Mono SC',
    family: '"Sarasa Mono SC", "Sarasa Term SC"',
    roles: ['mono', 'num'],
    kind: 'local',
    note: '本机装了才有；汉字 = 2 个拉丁宽。',
  },
]

export type FontChoice = Record<FontRole, string>
/** num 默认 'follow-ui'：数据字跟界面字体走（加 tnum）。 */
export const DEFAULT_FONTS: FontChoice = { ui: 'system', cjk: 'system', num: 'follow-ui', mono: 'system' }

export const fontsFor = (role: FontRole) => FONT_CATALOG.filter((font) => font.roles.includes(role))
const find = (id: string) => FONT_CATALOG.find((font) => font.id === id)

/** 由选择算出要写到根节点上的字体变量；值等于默认时返回 undefined（不写）。 */
export function fontVariables(choice: FontChoice): Record<string, string | undefined> {
  const ui = find(choice.ui)
  const cjk = find(choice.cjk)
  const cjkStack = cjk && cjk.kind !== 'system' ? `${cjk.family}, ${SYSTEM_CJK}` : SYSTEM_CJK
  const uiFamily = ui && ui.kind !== 'system' ? ui.family : undefined
  const changedUi = uiFamily !== undefined || cjkStack !== SYSTEM_CJK
  const sans = (tier: keyof typeof SYSTEM_UI) => `${uiFamily ?? SYSTEM_UI[tier]}, ${cjkStack}, sans-serif`
  const mono = find(choice.mono)
  const num = choice.num === 'follow-ui' ? undefined : find(choice.num)
  const numStack = num
    ? num.kind === 'system'
      ? `${SYSTEM_MONO}, ${cjkStack}, monospace`
      : `${num.family}, ${cjkStack}, sans-serif`
    : undefined
  return {
    '--font-sans': changedUi ? sans('text') : undefined,
    '--font-sans-small': changedUi ? sans('small') : undefined,
    '--font-sans-display': changedUi ? sans('display') : undefined,
    '--font-num': numStack,
    '--font-num-small': numStack,
    '--font-mono':
      mono && mono.kind !== 'system' ? `${mono.family}, ${SYSTEM_MONO}, ${cjkStack}, monospace` : undefined,
  }
}
