// SPDX-License-Identifier: MIT
// 反馈组的「怎么用 / 无障碍」（照 Salt 组件页）。
import type { GuidanceMap } from './types'

const feedback: GuidanceMap = {
  skeleton: {
    aliases: ['Loading', 'Placeholder', 'Shimmer', 'Spinner'],
    use: ['等数据时占住内容区，用 Loading 包住内容。', '要给超时加重试时用 LoadingView。'],
    avoid: ['知道进度时用 progress。', '操作结果的提示用 toast 或 alert。', '没数据（不是在等）用 empty-state。'],
    a11y: ['加载区是 role=status、aria-busy，骨架线条对读屏隐藏。', '「仍在加载」与重试文案由调用方传。'],
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
}

export default feedback
