// SPDX-License-Identifier: MIT
/**
 * Sprite and font data of ArcadePixel: the 5x7 pixel font, the ready-made sprites and the text-to-grid builder.
 * 像素屏的数据（G3，体检 §7：精灵数据与渲染分开）：字形、现成精灵、把文字排成格子；纯数据与纯函数，不碰画布与 React。
 * 取自 SmoothUI arcade-pixel（MIT，Copyright (c) Eduardo Calvo，出处见 arcade-pixel.tsx 文件头）。
 */

/**
 * 5x7 pixel font glyphs expressed as readable row strings ("#" = lit pixel,
 * "." = blank pixel). Converted to numeric grids in PIXEL_FONT_5X7 below.
 */
const FONT_GLYPH_ROWS: Record<string, string[]> = {
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  ',': ['.....', '.....', '.....', '.....', '..#..', '..#..', '.#...'],
  ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '.': ['.....', '.....', '.....', '.....', '.....', '..#..', '..#..'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  '4': ['#...#', '#...#', '#...#', '#####', '....#', '....#', '....#'],
  '5': ['#####', '#....', '#....', '####.', '....#', '....#', '####.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '..#..', '..#..', '..#..'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '#...#', '.###.'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
}

/** Glyph grid dimensions. */
const FONT_COLUMNS = 5
const FONT_ROWS = 7
/** Blank columns inserted between characters when building a text grid. */
const CHARACTER_SPACING_COLUMNS = 1
export const CHARACTER_UNIT_WIDTH = FONT_COLUMNS + CHARACTER_SPACING_COLUMNS

const BLANK_CELL_CHARACTERS = new Set(['.', ' '])

/**
 * Row strings accept "." or " " for an unlit cell, "#" for palette index 1, and
 * a digit for any other palette index, so sprites can be multi-colour.
 */
const characterToCellValue = (character: string): number => {
  if (BLANK_CELL_CHARACTERS.has(character)) {
    return 0
  }
  const parsed = Number.parseInt(character, 10)
  return Number.isNaN(parsed) ? 1 : parsed
}

const rowsToGrid = (rows: string[]): number[][] => rows.map((row) => Array.from(row, characterToCellValue))

/** Numeric 5x7 pixel font map (0 = blank, 1 = lit), keyed by uppercase character. */
const PIXEL_FONT_5X7: Record<string, number[][]> = Object.fromEntries(
  Object.entries(FONT_GLYPH_ROWS).map(([character, rows]) => [character, rowsToGrid(rows)]),
)

/**
 * Ready-made sprites so the `sprite` path is usable without hand-authoring a
 * grid. `alien` and `alienAlt` are the two frames of a space-invader style
 * marcher: alternate them on a timer to animate it.
 */
export const ARCADE_SPRITES: Record<string, number[][]> = {
  alien: rowsToGrid([
    '..#.....#..',
    '...#...#...',
    '..#######..',
    '.##.###.##.',
    '###########',
    '#.#######.#',
    '#.#.....#.#',
    '...##.##...',
  ]),
  alienAlt: rowsToGrid([
    '..#.....#..',
    '#..#...#..#',
    '#.#######.#',
    '###.###.###',
    '###########',
    '.#########.',
    '..#.....#..',
    '.##.....##.',
  ]),
  arrow: rowsToGrid([
    '....#....',
    '....##...',
    '....###..',
    '########.',
    '#########',
    '########.',
    '....###..',
    '....##...',
    '....#....',
  ]),
  heart: rowsToGrid([
    '.###.###.',
    '#22######',
    '#2#######',
    '#########',
    '.#######.',
    '..#####..',
    '...###...',
    '....#....',
  ]),
}

const BLANK_GLYPH_GRID = rowsToGrid(Array.from({ length: FONT_ROWS }, () => '.'.repeat(FONT_COLUMNS)))

const getGlyphGrid = (character: string): number[][] => PIXEL_FONT_5X7[character.toUpperCase()] ?? BLANK_GLYPH_GRID

const buildTextGrid = (text: string): number[][] => {
  const characters = text.length > 0 ? Array.from(text) : [' ']
  const rows: number[][] = Array.from({ length: FONT_ROWS }, () => [] as number[])

  for (const [index, character] of characters.entries()) {
    const glyph = getGlyphGrid(character)
    for (let rowIndex = 0; rowIndex < FONT_ROWS; rowIndex++) {
      rows[rowIndex].push(...glyph[rowIndex])
      if (index < characters.length - 1) {
        rows[rowIndex].push(0)
      }
    }
  }

  return rows
}

/** The grid to draw: the sprite when given, otherwise the text through the 5x7 font, otherwise one blank glyph. */
export const resolveGrid = (sprite?: number[][], text?: string): number[][] => {
  if (sprite && sprite.length > 0) {
    return sprite
  }
  if (typeof text === 'string') {
    return buildTextGrid(text)
  }
  return BLANK_GLYPH_GRID
}
