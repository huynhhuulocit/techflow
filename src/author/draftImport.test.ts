import { describe, expect, it } from 'vitest'
import { createDraftExport, parseDraftJson, parseGameStreamMarkdown } from './draftImport'
import { createTestDraft } from './testFixtures'

describe('JSON draft import', () => {
  it('accepts arrays and strict TechFlow envelopes', () => {
    const draft = createTestDraft()
    expect(parseDraftJson(JSON.stringify([draft])).success).toBe(true)

    const exported = createDraftExport([draft], new Date('2026-09-07T00:00:00.000Z'))
    expect(exported.success).toBe(true)
    if (exported.success) expect(parseDraftJson(exported.json).success).toBe(true)
  })

  it('rejects the entire array when one record is invalid', () => {
    const invalid = { ...createTestDraft({ id: 'draft-test-2' }), topicSlug: '' }
    const result = parseDraftJson(JSON.stringify([createTestDraft(), invalid]))
    expect(result.success).toBe(false)
  })

  it('rejects an envelope with the wrong kind', () => {
    const result = parseDraftJson(JSON.stringify({
      schemaVersion: 1,
      kind: 'unknown',
      exportedAt: '2026-09-07T00:00:00.000Z',
      drafts: [createTestDraft()],
    }))
    expect(result.success).toBe(false)
  })
})

describe('GameStream Markdown import', () => {
  const defaults = { locale: 'vi' as const, topicSlug: 'redis', level: 'junior' as const }

  it('parses the inline GameStream marker format', () => {
    const markdown = `# Junior

## 1. Redis là gì?

**Câu trả lời mẫu:** **Conclusion:** Redis là in-memory data store. **Mechanism:** Dữ liệu được truy cập theo key. **Trade-off:** Memory đắt và cần persistence strategy. **GameStream:** Redis giữ session và hot data.

## Bảng thuật ngữ kỹ thuật

| Term | Meaning |
| --- | --- |
`
    const result = parseGameStreamMarkdown(markdown, defaults, {
      now: new Date('2026-09-07T00:00:00.000Z'),
      idFactory: () => 'draft-markdown-1',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.drafts).toHaveLength(1)
      expect(result.drafts[0].content.quickAnswer).toBe('Redis là in-memory data store.')
      expect(result.drafts[0].provenance.kind).toBe('markdown-import')
    }
  })

  it('parses section heading markers', () => {
    const markdown = `## Cache invalidation là gì?
### Conclusion
Cache invalidation loại dữ liệu cũ.
### Mechanism
Write path xóa hoặc cập nhật cache key.
### Trade-off
Có race condition và consistency window.
### GameStream
Product update xóa product cache.
`
    const result = parseGameStreamMarkdown(markdown, defaults, {
      idFactory: () => 'draft-markdown-2',
    })
    expect(result.success).toBe(true)
  })

  it('fails atomically when a required marker is missing', () => {
    const markdown = `## 1. Redis là gì?
**Conclusion:** Redis là data store. **Mechanism:** Key lookup. **GameStream:** Redis giữ hot data.`
    const result = parseGameStreamMarkdown(markdown, defaults)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues.some(issue => issue.path.endsWith('.Trade-off'))).toBe(true)
  })
})
