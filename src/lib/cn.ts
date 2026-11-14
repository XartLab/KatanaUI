// SPDX-License-Identifier: MIT
// 取自 shadcn/ui 的 lib/utils（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn）的 cn，加了我们自己的字号档类。
// 引擎用 shadcn-ui/cn（https://github.com/shadcn-ui/cn ，MIT），替掉 clsx + tailwind-merge：同样的接口与输出
// （其 README 称有 35.6 万条差分测试对齐 tailwind-merge），合并更快；2026-11-14 读自其 README。
import { createCn } from 'cn/config'

/** 字号档类（theme/theme.css 的 @utility k-text-*）：`font` 简写，一个类同时定字重、字号、行高、字体族。 */
const TEXT_TIERS = ['title', 'body', 'data', 'caption', 'micro']

/** 拼类名，后写的 Tailwind 类盖住前面冲突的（调用方传 className 能改样式）。 */
export const cn = createCn({
  extend: {
    classGroups: { 'text-tier': [{ 'k-text': TEXT_TIERS }] },
    // 档类是 font 简写：后写的档类盖掉前面的字号、字重、行高、字距（tailwind-merge 从右往左处理，冲突只对「前面的」生效）。
    // 反过来只有字号：档类后面又写 text-sm 是在换字号，档类整个让位。字重与行高不互斥：档类后面写 leading-none、font-semibold
    // 是在档类的基础上微调（按钮 k-text-data leading-none、sm 按钮 k-text-caption font-semibold），不该把档类删掉
    // （删了就退回从祖先继承的 13px/400，2026-11-13 独立审实测）。
    conflictingClassGroups: {
      'text-tier': ['font-size', 'font-weight', 'leading', 'tracking'],
      'font-size': ['text-tier'],
    },
  },
})
