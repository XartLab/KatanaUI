// SPDX-License-Identifier: MIT
// 添加组件目录的演示：抽屉样式（默认）与「+」垂下来的紧凑 menu 样式。
import { ComponentCatalogMenuUsage } from '../usage/ComponentCatalogMenuUsage.tsx'
import { ComponentCatalogUsage } from '../usage/ComponentCatalogUsage.tsx'
import { Row } from './parts'

export function ComponentCatalogDemo() {
  return (
    <>
      <Row name="抽屉样式（默认）：搜索 · 类别页签 · 缩略图卡片">
        <ComponentCatalogUsage />
      </Row>
      <Row name='variant="menu"：分组可折叠 · 每行名字加「+」· 灰的悬停或聚焦说明原因'>
        <ComponentCatalogMenuUsage />
      </Row>
    </>
  )
}
