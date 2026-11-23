// SPDX-License-Identifier: MIT
// AI 组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const ai: GuidanceMap = {
  'ai-conversation': {
    aliases: ['Chat thread', 'Message list', 'Stick to bottom', 'Scroll anchor'],
    use: ['装一串对话消息，流式中自动跟到底。', '读者往上翻后停止跟随，给一键回到最新。'],
    avoid: ['不是对话的长列表用 data-grid 或普通滚动区。', '别在读者往上翻时用代码把他拽回底部。'],
    a11y: ['滚动区是 role=log，读屏名取 label，新消息会被礼貌地播报。', '滚动区可聚焦，方向键与翻页键直接滚动。'],
  },
  'ai-message': {
    aliases: ['Chat bubble', 'Message', 'Turn', 'Chat message'],
    use: ['一条用户或助手的消息，带复制、重试、赞踩。', '助手回合里有自己的卡片时关掉气泡。'],
    avoid: ['流式文字用 ai-response 放进它里面。', '别给用户自己的消息画赞踩。'],
    a11y: [
      '动作是带读屏名的按钮，名字取 labels；赞踩带 aria-pressed。',
      '动作在悬停与键盘聚焦时都显出，键盘用户够得着。',
    ],
  },
  'ai-response': {
    aliases: ['Streaming text', 'Typewriter', 'Markdown stream', 'Answer'],
    use: ['显示流式到达的助手文字，词到了才进场。', '正文里用 [n] 标出处，传 citations 就变成行内引用。'],
    avoid: ['整段已经完整的文字不需要它。', '引用来源列表用 web-search，别在正文里堆。'],
    a11y: ['是普通段落，读屏读到的是当前全文；光标 aria-hidden。', '引用小标可聚焦，聚焦立即弹出预览。'],
  },
  markdown: {
    aliases: ['Rich text', 'Safe markdown', 'Prose', 'Help doc'],
    use: ['画模型写的整段话：标题、列表、表格、代码。', '帮助文档的正文，要锚点与站内链接。'],
    avoid: ['逐词到达的流式回答用 ai-response。', '用户自己的话原样写，不要当 Markdown 解析。'],
    a11y: [
      '是普通的标题、段落、列表与表格，读屏照结构读；外链在新标签页打开。',
      '图片换成文字说明，读屏读到的是说明。',
    ],
  },
  'ai-reasoning': {
    aliases: ['Thinking', 'Chain of thought', 'Thought process', 'Reasoning trace'],
    use: ['模型推理期间展开给人看，结束后自动收起。', '只想让人在需要时才看过程。'],
    avoid: ['最终回答别放进来，用 ai-response。', '行内的一句状态用 ai-status。'],
    a11y: ['摘要是按钮，aria-expanded 表示开合，aria-controls 指向内容。', '流光只在思考中，结束停下；不靠颜色传意。'],
  },
  'ai-tool-call': {
    aliases: ['Function call', 'Tool use', 'Action step', 'Tool invocation'],
    use: ['展示 AI 调了什么工具、传了什么参数、拿回什么。', '一次回答里有多次调用时每次一行。'],
    avoid: ['带来源的检索结果用 web-search。', '原始 JSON 太长时在 result 里放 json-viewer。'],
    a11y: ['状态读屏词在 labels.status，状态环本身 aria-hidden。', '没有参数与结果时整行不可展开，按钮禁用。'],
  },
  'ai-diff': {
    aliases: ['Change preview', 'Proposed edit', 'Code diff', 'Review changes'],
    use: ['AI 要改参数或配置时，让人先看前后差再点头。', '少量行的改动：策略参数、阈值、过滤条件。'],
    avoid: ['大文件的行级审阅不用它。', '要真的落地的动作交给 ai-approval，diff 只负责看差。'],
    a11y: ['每一行读屏先读「新增 / 删除 / 未变」，符号与行号 aria-hidden。', '决定后状态词在 role=status 里播报。'],
  },
  'ai-approval': {
    aliases: ['Human in the loop', 'Confirm action', 'Permission prompt', 'Order approval'],
    use: ['AI 建议下单、撤单、停策略时，先摆出标的、方向、数量与理由让人拍板。', '不可撤的选项给 hold，按住确认。'],
    avoid: ['可撤的小动作不必审批，直接做并给撤销。', '只展示不需要决定的信息用 alert。'],
    a11y: [
      '选项区是 role=group，名字取问题；决定后 role=status 播报选中项。',
      'hold 项的读屏提示写明要「按住」，键盘按住空格或回车同样有效。',
    ],
  },
  'ai-context-meter': {
    aliases: ['Token usage', 'Context window', 'Usage ring', 'Token counter'],
    use: ['放在输入框旁，随时看上下文用了多少。', '用量接近上限时提醒要压缩或换话题。'],
    avoid: ['任务进度用 progress。', '一次性的耗时用 ai-status 的 elapsed。'],
    a11y: ['按钮读屏名取 label，必传，写成「已用 62%，79k / 128k」。', '颜色之外读数本身也变化，不只靠色相。'],
  },
  'ai-prompt-input': {
    aliases: ['Composer', 'Chat input', 'Prompt box', 'Message input'],
    use: ['对话的输入区：多行、附件、发送、流式中停止。', '把模型选择、上下文用量放进 children 的工具栏。'],
    avoid: ['单行的搜索框用 input。', '别靠 placeholder 当读屏名。'],
    a11y: ['文本框名字取 label，必传；发送钮名字在流式中变成「停止」。', '中文输入法选词时的回车不会发送。'],
  },
  'ai-suggestions': {
    aliases: ['Prompt chips', 'Quick replies', 'Follow-ups', 'Starter prompts'],
    use: ['对话的空态给几个起手问题。', '回答之后给两三个追问。'],
    avoid: ['需要多选或筛选用 chip-group。', '放太多就不再是建议。'],
    a11y: ['是一组按钮，Tab 依次聚焦。', '标题 label 可选，有就读出。'],
  },
  'ai-artifact': {
    aliases: ['Canvas', 'Output frame', 'Code preview', 'Generated result'],
    use: ['AI 产出的策略、报告、配置：能预览也能看源。', '想让人复制原文时给 copyText。'],
    avoid: ['只有代码时直接用 code-block。', '两个视图内容对不上时别并排放。'],
    a11y: [
      '页签是 role=tablist，方向键切换，面板用 aria-labelledby 关联页签。',
      '复制钮读屏名在复制后变成「已复制」。',
    ],
  },
  'ai-branch': {
    aliases: ['Regenerate', 'Response variants', 'Alternate replies', 'Version switcher'],
    use: ['同一问题重答出多个版本，让人来回翻。'],
    avoid: ['不同话题的对话用页签或侧栏，不是分支。', '只有一个版本时翻页条自动隐藏，不用自己判断。'],
    a11y: ['上一个、下一个按钮的读屏名必传。', '页码是 role=status，翻页后读出「第几个，共几个」。'],
  },
  'ai-task-list': {
    aliases: ['Agent plan', 'Todo list', 'Progress steps', 'Execution plan'],
    use: ['展示 Agent 的计划与每一步进度，含一层子步骤。', '失败的步骤要看得出来并带小注。'],
    avoid: ['让人自己勾选用 task-list。', '单个步骤的状态用 ai-status。'],
    a11y: ['每行读屏末尾追加状态词，来自 statusLabels。', '框与勾叉 aria-hidden；计数是文本，从任务派生。'],
  },
  'agent-avatar': {
    aliases: ['Identicon', 'Pixel avatar', 'Agent icon', 'Generated avatar'],
    use: ['多个 Agent 并存时区分谁在说话。', '同一个种子永远同一张脸，稳定的 id 当种子。'],
    avoid: ['用户头像用 symbol-mark 或真实图片。', '状态表达用 matrix-orb，头像不随状态变。'],
    a11y: ['role=img，读屏名取 label，必传。', '纯装饰的动效不带信息，动画只是环境。'],
  },
}

export default ai
