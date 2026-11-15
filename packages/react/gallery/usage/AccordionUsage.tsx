// SPDX-License-Identifier: MIT
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../src/index'

export function AccordionUsage() {
  return (
    <Accordion type="single" collapsible defaultValue="source">
      <AccordionItem value="source">
        <AccordionTrigger>Where does the data come from?</AccordionTrigger>
        <AccordionContent>Public market data; the reason is shown when it is unavailable.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
