// SPDX-License-Identifier: MIT
// EventCalendar 的国家选择：导航行上的触发按钮加模态框（搜索、「全世界」与「前 N 大经济体」两个预设、按地区分组两列复选、取消 / 应用）。
// 从 event-calendar.tsx 拆出（G5），行为不变：打开时草稿从已选的国家起，取消不改，应用才交给 onValueChange。
import { useState } from 'react'
import { SymbolMark } from '../quotes/symbol-mark.tsx'
import { Button } from '../primitives/button.tsx'
import { Checkbox } from '../primitives/checkbox.tsx'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog.tsx'
import { Input } from '../primitives/input.tsx'
import type { CalendarItem, EventCalendarLabels } from './event-calendar-types.ts'

export type RegionPickerProps = {
  /** 已选的国家代码；空 = 全部。 */
  value: readonly string[]
  onValueChange: (regions: string[]) => void
  /** 可选的国家（每个国家取一条事件，读它的 region、regionName、flag、regionGroup）。 */
  options: readonly CalendarItem[]
  topRegions?: readonly string[]
  labels: EventCalendarLabels
}

export function RegionPicker({ value, onValueChange, options, topRegions, labels }: RegionPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const openCountries = () => {
    setDraft([...value])
    setSearch('')
    setDialogOpen(true)
  }
  const needle = search.trim().toLowerCase()
  const shownRegions = options.filter(
    (r) => needle === '' || r.regionName.toLowerCase().includes(needle) || r.region.toLowerCase().includes(needle),
  )
  const regionGroups = (() => {
    const map = new Map<string, CalendarItem[]>()
    for (const r of shownRegions) {
      const key = r.regionGroup ?? labels.countries.otherGroup
      map.set(key, [...(map.get(key) ?? []), r])
    }
    return [...map]
  })()
  const toggleDraft = (code: string) =>
    setDraft((prev) => (prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]))

  return (
    <>
      <Button size="sm" variant="ghost" className="k-ecal-regions" data-slot="ecal-regions" onClick={openCountries}>
        {value.length === 0 ? labels.countries.all : labels.countries.count(value.length)}
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent closeLabel={labels.countries.cancel} className="k-ecal-dialog">
          <DialogHeader>
            <DialogTitle>{labels.countries.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">{labels.countries.title}</DialogDescription>
          <DialogBody>
            <Input
              type="search"
              aria-label={labels.countries.search}
              placeholder={labels.countries.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="k-ecal-presets">
              <Button size="sm" variant="ghost" onClick={() => setDraft([])}>
                {labels.countries.entireWorld}
              </Button>
              {topRegions && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDraft(topRegions.filter((r) => options.some((o) => o.region === r)))}
                >
                  {labels.countries.top}
                </Button>
              )}
            </div>
            {regionGroups.length === 0 && <p className="k-ecal-empty">{labels.countries.empty}</p>}
            {regionGroups.map(([group, list]) => (
              <fieldset key={group} className="k-ecal-region-group">
                <legend>{group}</legend>
                <div className="k-ecal-region-grid">
                  {list.map((r) => (
                    <label key={r.region} className="k-ecal-region-item">
                      <Checkbox checked={draft.includes(r.region)} onCheckedChange={() => toggleDraft(r.region)} />
                      <SymbolMark symbol={r.region} name={r.regionName} src={r.flag} size={16} />
                      <span>{r.regionName}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {labels.countries.cancel}
            </Button>
            <Button
              onClick={() => {
                onValueChange(draft)
                setDialogOpen(false)
              }}
            >
              {labels.countries.apply}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
