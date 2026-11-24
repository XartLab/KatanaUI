// SPDX-License-Identifier: MIT
// RuleBuilder 的文案类型（单独成文件：rule-builder.tsx 与 rule-value.tsx 都要它，免得两个文件互相引）。包里不带语言，全由调用方传。
import type { RuleIssue, RuleMode } from './rule-model.ts'

/** Texts of RuleBuilder (the package ships no text). */
export type RuleBuilderLabels = {
  /** Heading of the conditions part, such as WHEN. */
  when: string
  /** Heading of the actions part, such as THEN. */
  actions: string
  /** Chip over the actions that run when the conditions hold, such as "If true". */
  ifTrue: string
  /** Chip over the actions that run when they do not. */
  ifFalse: string
  /** Accessible name of the one-line readback of the rule. */
  readback: string
  /** Visible word of each combine mode, such as And and Or. */
  mode: Record<RuleMode, string>
  /** Accessible name of the combine button, such as (current, next) => `Combine with ${current}; switch to ${next}`. */
  switchMode: (current: string, next: string) => string
  /** Title of a nested group, such as (n) => `Group · ${n} conditions`. */
  group: (conditions: number) => string
  addCondition: string
  addGroup: string
  addAction: string
  /** Accessible names of the controls of a row. */
  field: string
  operator: string
  value: string
  min: string
  max: string
  action: string
  /** Visible word between the two bounds of a range, such as "to". */
  rangeTo: string
  /** Name of the button that swaps a number for another field (pressed when it is a field). */
  refToggle: string
  /** Name of the select of the other field. */
  refField: string
  /** Placeholder of the select of the other field. */
  refPlaceholder: string
  /** Placeholder of an enum value select. */
  valuePlaceholder: string
  /** Text and name of the add button of a multi-value. */
  addValue: string
  /** Placeholder and name of the search box of the multi-value list. */
  searchValue: string
  /** Shown when the search finds nothing. */
  noValue: string
  /** Name of the remove button of a chip, such as (label) => `Remove ${label}`. */
  removeValue: (label: string) => string
  /** Name of the lock icon of a locked condition. */
  locked: string
  /** Mark on an action that only produces a draft. */
  draft: string
  /** Name of the drag handle, such as (summary) => `Move: ${summary}`; the hint is read with it. */
  handle: (summary: string) => string
  /** Name of the delete button of a row. */
  remove: (summary: string) => string
  /** Read with the handle: the keys that move and remove a row. */
  hint: string
  undo: string
  redo: string
  /** Status line when the rule has problems, such as (n) => `${n} issues`. */
  issueCount: (count: number) => string
  /** Status line when it has none. */
  valid: string
  /** Why a row is wrong, in words. */
  issue: (issue: RuleIssue) => string
  /** Live lines. */
  added: (summary: string) => string
  removed: (summary: string) => string
  /** After a move: the row, its new position (from 1) and how many rows the list has. */
  moved: (summary: string, position: number, total: number) => string
  modeChanged: (mode: string) => string
  undone: string
  redone: string
  dragCancelled: string
}
