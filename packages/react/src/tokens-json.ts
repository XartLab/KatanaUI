// SPDX-License-Identifier: MIT
// `@katana-ui/react/tokens.json` 的出口：转发 @katana-ui/tokens 的 tokens.json（JSON 文件自己转发不了，所以用一个模块）。
// 带 import 属性：Node 不认没有属性的 JSON 导入。
import tokens from '@katana-ui/tokens/tokens.json' with { type: 'json' }

export default tokens
