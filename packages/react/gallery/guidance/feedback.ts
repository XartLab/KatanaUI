// SPDX-License-Identifier: MIT
// 反馈组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const feedback: GuidanceMap = {
  skeleton: {
    aliases: ['Loading', 'Placeholder', 'Shimmer', 'Spinner'],
    use: ['等数据时占住内容区，用 Loading 包住内容。', '要给超时加重试时用 LoadingView。'],
    avoid: [
      '知道进度时用 progress。',
      '操作结果的提示用 toast 或 alert。',
      '没数据（不是在等）用 empty-state。',
      '卡片、文章这类形状复杂的，用 measured-skeleton。',
    ],
    a11y: ['加载区是 role=status、aria-busy，骨架线条对读屏隐藏。', '「仍在加载」与重试文案由调用方传。'],
  },
  'measured-skeleton': {
    aliases: ['Skeleton screen', 'Content placeholder', 'Skullet', 'Shimmer'],
    use: [
      '卡片、文章、建议队列这类形状复杂的加载占位，内容到了位置不动。',
      '示例数据排出的版面要和真数据同样的行数与控件。',
    ],
    avoid: ['表格用按行高的 skeleton，图表自己画占位。', '知道进度时用 progress。'],
    a11y: [
      '加载期间有一个 role=status 的读屏文字，名字由调用方传 label（必填）。',
      '骨架本身 aria-hidden 且 inert，加载的容器带 aria-busy。',
      '骨架不闪不脉冲，所以没有动效要另外照顾。',
    ],
  },
  toast: {
    aliases: ['Snackbar', 'Notification', 'Banner', 'Flash message'],
    use: ['操作完成、告警触发这类会自己消失的反馈。', '多条提示排在窗口一角。'],
    avoid: ['要用户处理的事用 dialog 或 alert。', '一直在页面里的说明用 alert。'],
    a11y: [
      'ToastViewport 是 role=region，aria-live=assertive，新增的条目立刻被读。',
      '关闭钮与「全部关掉」的读屏名由调用方传。',
    ],
  },
  alert: {
    aliases: ['Banner', 'Callout', 'Inline message', 'Notice'],
    use: ['页面里常驻的提示、警告或错误说明。', '表单或区块顶部说明为什么不可用。'],
    avoid: ['会自己消失的反馈用 toast。', '必须裁决的用 dialog。', '字段旁的错误用 field。'],
    a11y: [
      'role 按语气定：warn、danger 是 alert，default、ok 是 status。',
      '页面一直在的提示改传 role=note，不要反复播报。',
      '语气靠标题写明，不只靠色条。',
    ],
  },
  progress: {
    aliases: ['Progress bar', 'Linear progress', 'Loading bar', 'Meter'],
    use: ['上传、回测等知道进度的任务。', '不知道进度时用不确定条。'],
    avoid: ['库存、额度的满格用 meter。', '等待内容区加载用 skeleton。'],
    a11y: [
      'Radix Progress，role=progressbar，确定态带 aria-valuenow。',
      '不确定态不带 aria-valuenow。',
      '名字由调用方传 aria-label。',
    ],
  },
  'status-icon': {
    aliases: ['Status glyph', 'Result icon', 'Check mark', 'Feedback icon'],
    use: ['提示条、列表行里的成功、失败、警告、进行中图标。', '状态切换要有明显动作时。'],
    avoid: ['只是一个在线点用 led。', '没有文字的状态不要单放图标。'],
    a11y: ['传了 label 是 role=img 并读出，不传就 aria-hidden。', '图标旁边必须有文字。'],
  },
  'ai-status': {
    aliases: ['Typing indicator', 'Thinking status', 'Agent status', 'Progress text'],
    use: [
      '一行说明 AI 在思考、检索、书写、完成或出错。',
      '长任务里显示耗时。',
      '换文字时宽度在同一帧算好交给弹簧，不先跳一帧。',
    ],
    avoid: ['有真实百分比用 progress。', '只想要状态球用 matrix-orb。', '步骤清单用 task-list。'],
    a11y: ['整行是 role=status，状态变了读屏会播报。', '图标对读屏隐藏，文字是唯一的读法。'],
  },
  'web-search': {
    aliases: ['Sources', 'Citations', 'Footnote', 'Reference list'],
    use: ['回答里展示联网检索用了哪些来源。', '正文里用行内引用标出处。'],
    avoid: ['普通外链用链接。', '来源很少且不需要预览时直接写文字。'],
    a11y: [
      '药丸是按钮，用 aria-expanded 表示展开，状态在 aria-live=polite 里播报。',
      '行内引用是按钮，预览是 role=tooltip，聚焦就弹出。',
      '图标与来源小标对读屏隐藏。',
    ],
  },
  'animated-list': {
    aliases: ['Feed', 'Activity feed', 'Live list', 'Stream'],
    use: [
      '新闻快讯、成交回报、炸板提醒这类往上顶的信息流。',
      '条目有稳定 id、会增删的列表。',
      '读的人可能停在某条上：悬停时新条目先攒着。',
    ],
    avoid: ['上千行的流用 news-feed 的虚拟滚动。', '不会变的列表不需要它。', '要给每一条打分排序的用 data-grid。'],
    a11y: [
      'ul 带读屏名，aria-live=polite，新条目被礼貌播报。',
      'onItemClick 开着时每条是按钮，读屏名取 label。',
      '攒着的条数提示是 role=status。',
    ],
  },
  'dynamic-island': {
    aliases: ['Notch', 'Pill', 'Live activity', 'Island'],
    use: ['成交回报、炸板提醒、连接状态这类「看一眼就退」的通知。', '内容大小不同、切换时想要弹性变形的场合。'],
    avoid: ['要用户处理的事用 toast 或 dialog。', '一条持续显示的状态用 led 或 status-bar。'],
    a11y: ['胶囊是 role=status、aria-live=polite，读屏名由调用方传。', '内容换了会播报新内容。'],
  },
  'grid-loader': {
    aliases: ['Spinner', 'Loading indicator', 'Pixel loader', 'Activity indicator'],
    use: ['按钮里、面板角上、AI 在想这类小的不定长等待。', '像素风的界面里替代圆形转圈。'],
    avoid: ['等一整块数据时用 skeleton 与 Loading。', '有进度时用 progress。'],
    a11y: ['role=status，读屏名取 label（必填）。', '颜色之外靠运动表达「在等」。'],
  },
  'motion-loader': {
    aliases: ['Spinner', 'Loading indicator', 'Throbber', 'Activity indicator'],
    use: ['行内与按钮里的小加载指示。', '连续运动的圆形款，与点阵款 grid-loader 二选一。'],
    avoid: ['等一整块数据时用 skeleton 与 Loading。', '有进度时用 progress。'],
    a11y: ['role=status，读屏名取 label（必填）。', '颜色取当前文字色，不单独传意。'],
  },
  'page-preloader': {
    aliases: ['Splash', 'Page transition', 'Loading screen', 'Curtain'],
    use: ['切换工作区、冷启动首屏的一次性过场。', '数据就绪后想要一个有仪式感的揭开。'],
    avoid: ['每次切页都盖会让人烦，只用一次。', '要显示真实加载状态用 skeleton 与 Loading。'],
    a11y: ['遮罩是 role=status，读屏名取 label。', '整页遮罩时锁住 body 滚动，揭开后还原。'],
  },
  'scroll-progress': {
    aliases: ['Reading progress', 'Scroll indicator', 'Progress bar', 'Scroll spy'],
    use: ['研报、新闻正文、策略报告这类长文里指示读到哪。', '想把进度放进自己顶栏时用 position=inline。'],
    avoid: ['任务做了多少用 progress。', '内容不滚动的页面不要放。'],
    a11y: ['role=progressbar，aria-valuenow 是 0 到 100。', '值经弹簧平滑，读屏取的是整数百分比。'],
  },
}

export default feedback
