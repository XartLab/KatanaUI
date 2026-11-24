// SPDX-License-Identifier: MIT
// 规则构建器（KatanaUI #223）的「怎么用 / 无障碍」。
import type { GuidanceMap } from './types'

const ruleBuilder: GuidanceMap = {
  'rule-builder': {
    aliases: ['Rule Builder', 'Query builder', 'Condition builder', 'Advanced rule builder', '规则构建器', '条件树'],
    use: [
      '告警、风控、选股条件、自动化触发要「条件树 + 动作」：WHEN 里嵌套 And / Or，THEN 分若为真 / 若为假。',
      '字段、运算符、动作全由 schema 给：数值字段配 > ≥ < 区间 上穿 下穿，枚举配 是 / 任一 / 都不是；要比另一个字段（收盘价上穿 MA20）给运算符 allowRef。',
      '起始条件不许用户删（比如「市场 是 A 股」）就给 locked: true，它会固定在组首、只改值。',
      '层数上限默认 3（根组算 1），要改写 schema.maxDepth；到了上限「加组」不再出现。',
      '存与传用整份 JSON（value / onValueChange）；保存前调 validateRule，空数组才算过，件里的红框读的是同一份。',
      '「下单草稿」这类动作在定义里标 draft: true，行上带草稿标；真下单由调用方在人确认后走 OrderTicket。',
      '回读那一句的文案模板由调用方给（RuleTextTemplates），换语言只换模板与 labels。',
    ],
    avoid: [
      '一行平铺、全是「且」的筛选用 FilterBar。',
      '有先后的流程（触发 → 动作 → 分支）用 FlowBuilder。',
      '只有一两个固定条件时直接放两个 Select，别上整棵树。',
    ],
    a11y: [
      '每行的把手是带名字的按钮（名字写这一行的内容），aria-describedby 写键位：Alt+↑↓ 挪、Delete 删；挪完焦点留在把手上，结果在 aria-live 里播报「挪到第几 / 共几」。',
      '锁图标是 role=img 并带名字；锁定行的字段与运算符是文字，不是不可用的控件。',
      '出错的格子 aria-invalid，aria-describedby 指向行下那句原因；区间的两个框各自标红；顶行状态写问题个数。',
      '拖动只是指针的快捷方式：键盘用 Alt+↑↓，两者走同一个模型函数，同样不跨组。',
      'And / Or 是按钮，读屏名写「用 And 组合；切到 Or」，切完播报；每个嵌套组是带名字的 role=group。',
      '标签式多选：每个标签有「移除 xx」按钮，「加」开可搜索的勾选列表（焦点圈在里面，Esc 回到「加」）。',
      '全部文案（含错误原因、播报）由 labels 给；颜色之外，错误还有文字，红边不是唯一线索。',
    ],
  },
}

export default ruleBuilder
