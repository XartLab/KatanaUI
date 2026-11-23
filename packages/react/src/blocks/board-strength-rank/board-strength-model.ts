// SPDX-License-Identifier: MIT
/**
 * Data types and ranking helpers of BoardStrengthRank.
 * 板块强度排名（#11）的数据形状与纯函数：按调用方给的强度从高到低排名次，跟调用方给的上一期名次比出升降。强度怎么算不在这里。
 */

/** One board (sector or theme) with the caller's strength. 一个板块：调用方算好的强度与强度走势。 */
export type BoardStrength = {
  id: string
  name: string
  /** Strength now, in the caller's own measure. 当前强度（口径由调用方定）。 */
  strength: number
  /** Strength history, oldest first, for the inline line. 强度走势，从旧到新。 */
  series?: readonly number[]
  /** Rank in the previous period (1 is strongest); omit for a newcomer. 上一期名次，新上榜不给。 */
  prevRank?: number
  /** Limit-up count in the board today. 板块内涨停只数。 */
  limitUps?: number
  /** Board change, already a percentage. 板块涨跌幅，百分数。 */
  change?: number
}

/** A ranked board: rank 1 is strongest; move is prevRank − rank (positive climbed), null for a newcomer. */
export type RankedBoard = BoardStrength & { rank: number; move: number | null }

/** Boards sorted by strength (highest first, ties keep the caller's order) with rank and move. 按强度排名。 */
export function rankBoards(boards: readonly BoardStrength[]): RankedBoard[] {
  return boards
    .map((board, index) => ({ board, index }))
    .toSorted((a, b) => b.board.strength - a.board.strength || a.index - b.index)
    .map(({ board }, index) => ({
      ...board,
      rank: index + 1,
      move: board.prevRank === undefined ? null : board.prevRank - (index + 1),
    }))
}
