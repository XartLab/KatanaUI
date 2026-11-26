// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { clampPercent, fileKind, parseLink, summarize, toneOfStatus, type ImportItem } from './file-import-model.ts'

describe('fileKind', () => {
  it('按扩展名认类型，大小写不分', () => {
    expect(fileKind('Alpha_Report.PDF')).toBe('pdf')
    expect(fileKind('factors_2026.csv')).toBe('sheet')
    expect(fileKind('backtest_result.parquet')).toBe('data')
    expect(fileKind('notes.md')).toBe('text')
  })
  it('链接、没有扩展名、不认识的', () => {
    expect(fileKind('https://example.com/a.pdf')).toBe('link')
    expect(fileKind('README')).toBe('other')
    expect(fileKind('archive.zip')).toBe('other')
  })
})

describe('toneOfStatus', () => {
  it('完成 ok、失败 danger、其余 neutral', () => {
    expect(toneOfStatus('done')).toBe('ok')
    expect(toneOfStatus('failed')).toBe('danger')
    expect(toneOfStatus('uploading')).toBe('neutral')
    expect(toneOfStatus('queued')).toBe('neutral')
  })
})

describe('clampPercent', () => {
  it('取整、夹住、NaN 当 0', () => {
    expect(clampPercent(37.6)).toBe(38)
    expect(clampPercent(-5)).toBe(0)
    expect(clampPercent(140)).toBe(100)
    expect(clampPercent(Number.NaN)).toBe(0)
  })
})

describe('summarize', () => {
  it('各状态计数', () => {
    const item = (id: string, status: ImportItem['status']): ImportItem => ({ id, name: id, status })
    expect(summarize([item('a', 'done'), item('b', 'uploading'), item('c', 'failed'), item('d', 'done')])).toEqual({
      queued: 0,
      uploading: 1,
      done: 2,
      failed: 1,
      total: 4,
    })
    expect(summarize([]).total).toBe(0)
  })
})

describe('parseLink', () => {
  it('http 与 https 合法，去掉首尾空白', () => {
    expect(parseLink('  https://example.com/report.pdf ')).toBe('https://example.com/report.pdf')
    expect(parseLink('http://a.b')).toBe('http://a.b')
  })
  it('空、带空白的、别的协议、不是链接都不合法', () => {
    expect(parseLink('')).toBeNull()
    expect(parseLink('   ')).toBeNull()
    expect(parseLink('https://a.b/ c')).toBeNull()
    expect(parseLink('javascript:alert(1)')).toBeNull()
    expect(parseLink('ftp://a.b/x')).toBeNull()
    expect(parseLink('example.com')).toBeNull()
  })
})
