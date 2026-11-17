// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, MeasuredSkeleton, ToggleGroup, ToggleGroupItem } from '../../src/index'

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
        variant="sm"
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
