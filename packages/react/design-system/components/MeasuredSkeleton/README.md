# MeasuredSkeleton

卡片、文章这类形状复杂的加载占位：用真组件加示例数据在不可见层排一次版，量出每行文字、每张图、每个控件的位置再画骨架，内容到了位置不动。外观与 Skeleton 同色、不闪不脉冲。

## Provide

`*` marks a required prop.

### MeasuredSkeleton

包 skullet（MIT，锁精确版本）的 Skeleton，件里不直接引第三方；label 必填，读屏读 role=status。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name read while loading (required; the package ships no text). |
| `loading` | `boolean` | — | Whether we are waiting; data mode defaults to "data is empty". |
| `id` | `string` | — | Remember the measured shape under this key. |
| `onReveal` | `() => void` | — | Called once when content has replaced the skeleton. |
| `delay` | `number` | — | Milliseconds to wait before the bars show; defaults to LoadingWait's 500. |
| `minShown` | `number` | — | Minimum milliseconds the bars stay once shown, even if the data arrives sooner; defaults to LoadingWait's 500. |
| `className` | `string` | — | Class name for the root element. |
| `data` | `never` | — | The data; loading while null or undefined. |
| `sample` | `ReactNode` | — | Example content measured while loading, instead of children. |
| `children` * | `ReactNode` | — | The content shown once loading is done. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, MeasuredSkeleton, ToggleGroup, ToggleGroupItem } from '@katana-ui/react'

type Post = { author: string; title: string; tags: readonly string[] }

// 示例数据只负责「排版和真的一样」：标题同样两行、同样两个标签；文字内容不会出现在骨架里。
const SAMPLE: Post = {
  author: '示例作者',
  title: '这是一条示例标题，长度要写到换成两行，骨架才会画出两条文字条来',
  tags: ['示例', '标签'],
}
const POST: Post = {
  author: '演示通讯社',
  title: '演示：虚构公司公布季度业绩，营收好于预期，管理层上调全年指引并公布回购计划',
  tags: ['财报', '指引'],
}

const AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2a2a2a"/></svg>',
)}`

function PostCard({ post }: { post: Post }) {
  return (
    <article
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-3)',
        border: '1px solid var(--line-100)',
        borderRadius: 'var(--radius-control)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <img src={AVATAR} alt="" width={32} height={32} style={{ borderRadius: '50%' }} />
        <span>{post.author}</span>
      </header>
      <h3 style={{ margin: 0, font: 'inherit', fontWeight: 600, lineHeight: 1.5 }}>{post.title}</h3>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {post.tags.map((tag) => (
          <span
            key={tag}
            style={{
              padding: '0 var(--space-2)',
              border: '1px solid var(--line-100)',
              borderRadius: 'var(--radius-control)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <Button style={{ alignSelf: 'flex-start' }}>查看全文</Button>
    </article>
  )
}

// 切到「加载」：卡片用示例排一次版再画骨架；切到「已加载」：真内容出现在骨架的位置，不跳。
export function MeasuredSkeletonUsage() {
  const [loading, setLoading] = useState(true)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: 320 }}>
      <ToggleGroup
        size="sm"
        aria-label="数据状态"
        value={loading ? 'loading' : 'loaded'}
        onValueChange={(next) => next && setLoading(next === 'loading')}
      >
        <ToggleGroupItem value="loading">加载</ToggleGroupItem>
        <ToggleGroupItem value="loaded">已加载</ToggleGroupItem>
      </ToggleGroup>
      <MeasuredSkeleton data={loading ? null : POST} sample={SAMPLE} label="正在载入文章卡片">
        {(post) => <PostCard post={post} />}
      </MeasuredSkeleton>
    </div>
  )
}
```

## States

- 加载中：不到 500ms 不露骨架条（不可见层照样占位），超过了才出，快的请求不闪；出了至少留 minShown（默认 500ms），数据早到也等满再揭示。
- 骨架：每行文字一条 line-200 的圆角条，图片、按钮、标签各一块，圆角跟随内容；不闪、不脉冲。
- 数据到了：真内容淡入到骨架的位置，onReveal 调一次；给了 id 的下次进来第一帧就是上次的形状。

## Don't

- 示例数据的文字行数、有没有图要和真的一样，否则内容到了会跳。
- 表格与图表不用它：表格用按行高的 Skeleton，图表自己画占位。
- 图片要给宽高或 aspect-ratio，否则加载完才有大小，会跳一次。

## Composition

```
MeasuredSkeleton
  span role=status（读屏名）
  skullet Skeleton（不可见层 + 骨架条）
```
