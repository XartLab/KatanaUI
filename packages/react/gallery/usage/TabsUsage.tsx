// SPDX-License-Identifier: MIT
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/index'

export function TabsUsage() {
  return (
    <Tabs defaultValue="gainers">
      <TabsList>
        <TabsTrigger value="gainers">Gainers</TabsTrigger>
        <TabsTrigger value="volume">Volume</TabsTrigger>
      </TabsList>
      <TabsContent value="gainers">Top gainers</TabsContent>
      <TabsContent value="volume">Top by volume</TabsContent>
    </Tabs>
  )
}
