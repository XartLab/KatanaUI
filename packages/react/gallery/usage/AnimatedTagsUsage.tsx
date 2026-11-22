// SPDX-License-Identifier: MIT
import { AnimatedTags } from '../../src/index'

export function AnimatedTagsUsage() {
  return (
    <AnimatedTags
      tags={['Semiconductors', 'AI compute', 'Banks']}
      defaultSelected={['Banks']}
      labels={{
        selected: 'Following',
        available: 'Available',
        empty: 'Nothing followed yet',
        remove: (tag) => `Remove ${tag}`,
        add: (tag) => `Follow ${tag}`,
      }}
    />
  )
}
