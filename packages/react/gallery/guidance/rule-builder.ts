// SPDX-License-Identifier: MIT
// 规则构建器（KatanaUI #223）的「怎么用 / 无障碍」。
import type { GuidanceMap } from './types'

const ruleBuilder: GuidanceMap = {
  'rule-builder': {
    aliases: ['Rule Builder', 'Query builder', 'Condition builder', 'Advanced rule builder', '规则构建器', '条件树'],
    use: [
      '告警、风控、选股条件、自动化触发要「条件树 + 动作」：WHEN 里嵌套 And / Or，THEN 分若为真 / 若为假。',
      '字段、运算符、动作全由 schema 给：数值字段配 > ≥ < 区间 上穿 下穿，枚举配 是 / 任一 / 都不是；要比另一个字段（收盘价上穿 MA20）给运算符 allowRef。',
      '起始条件不许用户删（比如「市场 是 A 股」）就给 locked: true，它会固定在组首、只改值。含锁定条件的组（任意深度）整组也删不掉：删除钮 aria-disabled 灰着，名字与 title 写明原因，点它与在把手上按 Delete 都不动（Delete 会播报原因）；不是只删非锁定的那部分，免得一次删除留下半个组。要删先去掉那条锁定条件。',
      '换字段时值怎么办：类型、单位、枚举选项都相同才保留（收盘价 → MA20）；口径不同的清空要求重填并播报（成交额 5 亿 → 换手率，5 亿不能悄悄变成 5%；板块 → 市场）；引用另一个字段的值一律清掉。只换运算符照旧保留同口径的值。',
      '动作的参数在定义里写 params 数组：每个参数有 key、类型（选项 / 数字 / 文本）、各自的校验（必填、数字范围、选项存在）与可选的连接词、单位；值存在 RuleAction.params[key]。例：生成下单草稿 = 方向（买 / 卖）+ 数量（1–100 手）+ 价格类型（前面连接词「按」）。回读模板 action(label, params) 拿到每个参数的文字与连接词。',
      'THEN 是否必填看 schema.requireActions，默认 false：选股规则可以只有 WHEN；设 true 则「若为真」至少要一个动作，缺了在该段下报错。',
      '受控的 value 换成另一份规则（不是自己刚写出去的那份，按引用或内容相同判断）时，撤销栈与「改过的行」一并清掉，旧文档的历史不会带进新文档；换文档后点「撤销」不会跳回上一份。',
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
      '出错的格子 aria-invalid，aria-describedby 指向行下那句原因；区间的两个框各自标红、动作的各个参数各自标红；顶行状态写问题个数。',
      '有问题时顶行状态是按钮（名字写明点了会怎样）：点它把全部问题显示出来，并把焦点移到阅读次序里第一个出错的格子（参数、值、字段，或空组的「加条件」、没有动作时的「加动作」）；没问题时只是文字。',
      '拖动只是指针的快捷方式：键盘用 Alt+↑↓，两者走同一个模型函数，同样不跨组。Alt+↑↓ 落在下拉触发器上时只挪整行、不打开下拉（触发器自己拦掉，Radix 默认会当成「打开」）；不带 Alt 的 ↑↓ 照常开下拉。',
      'And / Or 是按钮，读屏名写「用 And 组合；切到 Or」，切完播报；每个组（含根组）是带名字的 role=group，名字写条件数与当前的 And / Or（labels.group、labels.rootGroup），切了组合方式名字跟着变。',
      '顶行回读那一句不能把名字挂在 <p> 上（aria-label 在段落上读屏不认）：外面包一个 role=group，用不显示的文字（labels.readback）做名字，aria-labelledby 指过去。',
      '空组在回读里占位（labels 模板里的 blank），不会悄悄消失；删掉行再加，新行不继承旧行的「改过」标记，不会一上来就红。',
      '标签式多选：每个标签有「移除 xx」按钮，「加」开可搜索的勾选列表（焦点圈在里面，Esc 回到「加」）。',
      '全部文案（含错误原因、播报）由 labels 给；颜色之外，错误还有文字，红边不是唯一线索。',
    ],
  },
}

export default ruleBuilder
