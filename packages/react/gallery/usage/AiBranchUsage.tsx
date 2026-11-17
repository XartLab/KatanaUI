// SPDX-License-Identifier: MIT
import {
  AiBranch,
  AiBranchMessages,
  AiBranchNext,
  AiBranchPage,
  AiBranchPrevious,
  AiBranchSelector,
} from '../../src/index'

export function AiBranchUsage() {
  return (
    <AiBranch>
      <AiBranchMessages>
        <p>第一个回答</p>
        <p>第二个回答</p>
      </AiBranchMessages>
      <AiBranchSelector from="assistant">
        <AiBranchPrevious label="上一个回答" />
        <AiBranchPage format={(at, total) => `${at} / ${total}`} />
        <AiBranchNext label="下一个回答" />
      </AiBranchSelector>
    </AiBranch>
  )
}
