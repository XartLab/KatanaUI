// SPDX-License-Identifier: MIT
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from '../../src/index'

export function MenubarUsage() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New strategy</MenubarItem>
          <MenubarItem>Import data</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Export report</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Compact rows</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}
