// SPDX-License-Identifier: AGPL-3.0-only
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../src/index'
import { Row } from './parts'

// 布局与导航的演示。数据和文案都是演示用的。

export function TabsDemo() {
  return (
    <Row>
      <Tabs defaultValue="gainers">
        <TabsList>
          <TabsTrigger value="gainers">涨幅榜</TabsTrigger>
          <TabsTrigger value="amount">成交额榜</TabsTrigger>
          <TabsTrigger value="turnover">换手榜</TabsTrigger>
          <TabsTrigger value="off" disabled>
            已禁用
          </TabsTrigger>
        </TabsList>
        <TabsContent value="gainers">涨幅榜的内容</TabsContent>
        <TabsContent value="amount">成交额榜的内容</TabsContent>
        <TabsContent value="turnover">换手榜的内容</TabsContent>
      </Tabs>
      <Tabs defaultValue="a">
        <TabsList variant="line">
          <TabsTrigger value="a">日线</TabsTrigger>
          <TabsTrigger value="b">周线</TabsTrigger>
        </TabsList>
        <TabsContent value="a">日线的内容</TabsContent>
        <TabsContent value="b">周线的内容</TabsContent>
      </Tabs>
    </Row>
  )
}

export function AccordionDemo() {
  return (
    <Accordion type="single" collapsible defaultValue="a" className="gal-wide">
      <AccordionItem value="a">
        <AccordionTrigger>数据从哪来</AccordionTrigger>
        <AccordionContent>A 股公开数据连接，取不到时写原因，不放样本数据。</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>多久更新一次</AccordionTrigger>
        <AccordionContent>盘中按数据集各自的间隔刷新，盘后停在收盘。</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
