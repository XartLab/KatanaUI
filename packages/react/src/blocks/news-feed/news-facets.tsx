// SPDX-License-Identifier: MIT
/**
 * Facet filter row of NewsFeed: removable multi-select filters plus an add button.
 * NewsFeed 的组合过滤条（体检 §7 从 news-feed.tsx 拆出）：照 TradingView News Flow，多个可增删、可重置的多选过滤。
 */
import { ChevronDownIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '../../primitives/button.tsx'
import { Checkbox } from '../../primitives/checkbox.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover.tsx'
import type { NewsFacet } from './news-feed-model.ts'

export type NewsFacetsLabels = { group: string; add: string; reset: string; remove: string; none: string }

type NewsFacetsProps = {
  facets: readonly NewsFacet[]
  /** 过滤条上现在有哪些分面（key）。 */
  shown: readonly string[]
  onShownChange: (next: string[]) => void
  /** 各分面选中的取值。 */
  picked: Record<string, string[]>
  onPickedChange: (next: Record<string, string[]>) => void
  labels: NewsFacetsLabels
}

export function NewsFacets({ facets, shown, onShownChange, picked, onPickedChange, labels }: NewsFacetsProps) {
  const hidden = facets.filter((f) => !shown.includes(f.key))
  return (
    <div className="k-news-facets" role="group" aria-label={labels.group} data-slot="news-facets">
      {shown.flatMap((key) => {
        const facet = facets.find((f) => f.key === key)
        if (!facet) return []
        const chosen = picked[key] ?? []
        return [
          <Popover key={key}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="k-news-facet"
                data-facet={key}
                data-active={chosen.length > 0 ? '' : undefined}
              >
                <span>{facet.label}</span>
                {chosen.length > 0 && (
                  <b>
                    {chosen.length === 1
                      ? (facet.options.find((o) => o.value === chosen[0])?.label ?? chosen[0])
                      : chosen.length}
                  </b>
                )}
                <ChevronDownIcon size={12} aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="k-news-facet-pop" aria-label={facet.label}>
              <div className="k-news-facet-head">
                <b>{facet.label}</b>
                <span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={chosen.length === 0}
                    onClick={() => onPickedChange({ ...picked, [key]: [] })}
                  >
                    {labels.reset}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`${labels.remove} ${facet.label}`}
                    onClick={() => {
                      onShownChange(shown.filter((k) => k !== key))
                      onPickedChange({ ...picked, [key]: [] })
                    }}
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                </span>
              </div>
              <ul>
                {facet.options.map((o) => (
                  <li key={o.value}>
                    <label>
                      <Checkbox
                        checked={chosen.includes(o.value)}
                        onCheckedChange={(on) =>
                          onPickedChange({
                            ...picked,
                            [key]:
                              on === true
                                ? facet.single
                                  ? [o.value]
                                  : [...chosen, o.value]
                                : chosen.filter((v) => v !== o.value),
                          })
                        }
                      />
                      {o.label}
                    </label>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>,
        ]
      })}
      {hidden.length > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="k-news-facet k-news-facet-add" data-slot="news-facet-add">
              <PlusIcon size={12} aria-hidden="true" />
              <span>{labels.add}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="k-news-facet-pop" aria-label={labels.add}>
            <ul>
              {hidden.map((f) => (
                <li key={f.key}>
                  <button type="button" data-facet-option={f.key} onClick={() => onShownChange([...shown, f.key])}>
                    {f.label}
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}
