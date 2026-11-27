// SPDX-License-Identifier: MIT
// 资料导入与模板库的「怎么用 / 无障碍」（#226）。日历事件点与洞察写在四个日历页自己的条目里。
import type { GuidanceMap } from './types'

const researchCalendar: GuidanceMap = {
  'file-import': {
    aliases: ['Document upload', 'Import sources', 'Attachment list', '资料导入', '文档上传'],
    use: [
      '研究资料进工作区：研报 PDF、因子 CSV、回测结果 parquet，一次拖进来几份，每份各看各的进度。',
      '同一处还要收粘贴的文字（会议纪要、摘要）与链接：给 onPaste、onLink 就出现对应页签。',
      '失败的行就地「重试 / 移除」，不用重新选一遍。',
    ],
    avoid: [
      '只选一个文件、不要清单：用 AnimatedFileUpload。',
      '要件自己去上传：做不到，上传、重试次数与失败原因都由调用方更新 items。',
    ],
    a11y: [
      '来源是 Radix Tabs（role=tablist），← → 切换；上传区是 role=button，名字在 labels.upload.zone。',
      '清单是带名字的 ul；进度条是 role=progressbar，读屏名取文件名；状态写成字（完成带勾、失败带叹号），不只靠颜色。',
      '失败原因与链接不合法的提示是 role=alert，出现时立即播报；两个行内按钮的读屏名带文件名（labels.retry、labels.remove）。',
      '移除之后焦点交给相邻的一行，不落到页面顶。',
      '输入法组字时的 Enter 不添加（isComposing 或 keyCode 229）。',
    ],
  },
  'template-library': {
    aliases: ['Template picker', 'Saved templates', 'Prompt library', '模板库', '策略模板'],
    use: [
      '策略模板、提示词模板、回测配置模板：左边找，右边看全文，一键「使用模板」。',
      '内置的放 readOnly 分组，用户要改就「复制为我的模板」（onDuplicate）。',
      '同一模板的几个版本挂在它下面当变体（一层）。',
    ],
    avoid: ['选项是简单的几条，用 Select 或 ListBox。', '要改正文格式（标题、加粗）：这里的正文是纯文本。'],
    a11y: [
      '树是 react-aria 的 Tree（treegrid）：↑↓ 走、→ 展开、← 收起、Enter 或 Space 选中；焦点移动不改选中。',
      '搜索框有读屏名，命中个数在 role=status 的屏外区播报；搜索时命中的分支全部展开。',
      '命中的字加粗加下划线，不只靠颜色。',
      '标题的读屏与键盘同 InlineEdit；正文静止时是 button（读屏名「正文: 内容」，描述是 labels.editHint），编辑时是 textarea。',
      'Enter、Esc、⌘↵ 先判输入法组字（isComposing 或 keyCode 229），组字时是选字，不保存也不放弃。',
      '保存被拒绝时正文下的提示是 role=alert；切走模板后看不到的失败经 onSaveError 交给调用方。复制被拒时按钮字换成 labels.copyFailed，同一个 aria-live 播报。',
    ],
  },
}

export default researchCalendar
