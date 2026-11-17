// SPDX-License-Identifier: MIT
// KatanaNewsFeed：新闻流（按频道与来源筛选、关键词搜索、列表或卡片排法）。标题永远是按钮：真实的 https 链接不进 DOM，
// 点一条只发 Action，带条目 id 与链接，由宿主决定开不开（照 web-search 的做法）。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { NewsFeed, type NewsItem } from '../../blocks/index.ts'
import { agoOf, agoShape, text, utcStamp, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, fill, httpsUrl, isoToMs, parseList, weightSchema } from '../support.tsx'

const choice = z
  .object({ value: z.string().min(1).describe('Stable value.'), label: text('The text shown for it.') })
  .strict()

const itemSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the news item. The host gets it back when the user opens it.'),
    time: z.string().describe('When it was published, ISO 8601.'),
    channel: z.string().describe('The value of one of the channels.'),
    source: z.string().describe('The value of one of the sources.'),
    title: z.string().describe('The headline.'),
    summary: z.string().describe('A short summary, shown in the card layout.').optional(),
    symbols: z
      .array(
        z
          .object({
            code: z.string().describe('Instrument code.'),
            name: z.string().describe('Instrument name.').optional(),
          })
          .strict(),
      )
      .max(12)
      .describe('Instruments the news is about.')
      .optional(),
    important: z.boolean().describe('Mark it as important.').optional(),
    readMinutes: z.number().min(1).max(120).describe('Estimated reading time in minutes.').optional(),
    href: httpsUrl
      .describe(
        'The article link, https only. It is never put in the page: the host gets it in the action and decides.',
      )
      .optional(),
  })
  .strict()

type Item = z.infer<typeof itemSchema>

export const KatanaNewsFeedApi = {
  name: 'KatanaNewsFeed',
  schema: z
    .object({
      items: z
        .union([z.array(itemSchema), CommonSchemas.DataBinding])
        .describe(
          'The news items. Either a literal array or {"@path": "/news"} bound to a data-model array; append to it as news arrives.',
        ),
      channels: z.array(choice).max(24).describe('The channel segments the user can pick.'),
      sources: z.array(choice).max(48).describe('The source chips the user can pick.'),
      now: CommonSchemas.DynamicString.describe(
        'The current time, ISO 8601, used for relative times. Omit to use the clock of the device.',
      ).optional(),
      layout: z.enum(['list', 'card']).default('list').describe('How items are laid out first.').optional(),
      labels: z
        .object({
          all: text('The "all" choice of a filter.'),
          feed: text('Accessible name of the whole feed.'),
          channels: text('Accessible name of the channel segments.'),
          sources: text('Accessible name of the source chips.'),
          clearSources: text('Button that clears the source filter.'),
          search: text('Accessible name and placeholder of the search box.'),
          layout: text('Accessible name of the layout switch.'),
          layoutList: text('Layout switch: list.'),
          layoutCard: text('Layout switch: cards.'),
          pause: text('Button that pauses live updates.'),
          resume: text('Button that resumes live updates.'),
          newItems: text('Banner for unseen items; {n}, for example "{n} new items".'),
          important: text('Accessible name of the important mark.'),
          empty: text('Text when nothing matches.'),
          read: text('Reading time; {n} minutes, for example "{n} min read".'),
          ...agoShape,
        })
        .strict()
        .describe('All visible and screen-reader text, in the language of the user.'),
      onOpen: actionSchema(
        'Dispatched when the user opens an item. metadata.extensions.katanaNews carries {id, href}; href is null when the item has none.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaNewsFeed = createComponentImplementation(KatanaNewsFeedApi, ({ props }) => {
  const fixed = isoToMs(props.now)
  const hrefs = useMemo(() => new Map<string, string>(), [])
  const items = useMemo(() => {
    hrefs.clear()
    return parseList<Item>(itemSchema, props.items).flatMap((item): NewsItem[] => {
      const time = isoToMs(item.time)
      if (time === undefined) return []
      if (item.href) hrefs.set(item.id, item.href)
      return [
        {
          id: item.id,
          time,
          channel: item.channel,
          source: item.source,
          title: item.title,
          ...(item.summary === undefined ? {} : { summary: item.summary }),
          ...(item.symbols === undefined
            ? {}
            : {
                symbols: item.symbols.map((s) => ({ code: s.code, ...(s.name === undefined ? {} : { name: s.name }) })),
              }),
          ...(item.important === undefined ? {} : { important: item.important }),
          ...(item.readMinutes === undefined ? {} : { readMinutes: item.readMinutes }),
        },
      ]
    })
  }, [props.items, hrefs])
  const t = props.labels
  if (!t) return null
  return (
    <Cell weight={props.weight}>
      <NewsFeed
        items={items}
        channels={props.channels ?? []}
        sources={props.sources ?? []}
        now={fixed ?? Date.now()}
        defaultLayout={props.layout}
        // 不给 href、永远传 onOpen：标题是按钮，真实链接留在这里，只经 Action 交给宿主。
        onOpen={(item) =>
          void props.onOpen?.(withExtension('katanaNews', { id: item.id, href: hrefs.get(item.id) ?? null }))
        }
        labels={{
          all: t.all,
          feed: t.feed,
          channels: t.channels,
          sources: t.sources,
          clearSources: t.clearSources,
          search: t.search,
          layout: t.layout,
          layoutList: t.layoutList,
          layoutCard: t.layoutCard,
          pause: t.pause,
          resume: t.resume,
          newItems: (n) => fill(t.newItems, { n }),
          ago: agoOf(t),
          absolute: utcStamp,
          important: t.important,
          empty: t.empty,
          read: (minutes) => fill(t.read, { n: minutes }),
        }}
      />
    </Cell>
  )
})
