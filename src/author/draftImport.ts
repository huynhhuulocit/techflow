import type { InterviewLevel, Locale, QuestionDraft } from '../content/types'
import { validateQuestionDraft, type DraftValidationIssue } from './draftValidation'

export type DraftImportResult =
  | { success: true; drafts: QuestionDraft[] }
  | { success: false; issues: DraftValidationIssue[] }

export type MarkdownImportDefaults = {
  locale: Locale
  topicSlug: string
  level: InterviewLevel
}

export type MarkdownImportOptions = {
  now?: Date
  idFactory?: (index: number, question: string) => string
}

export type DraftExportEnvelope = {
  schemaVersion: 1
  kind: 'techflow-question-drafts'
  exportedAt: string
  drafts: QuestionDraft[]
}

export const MAX_IMPORT_SOURCE_BYTES = 2 * 1024 * 1024
export const MAX_IMPORT_DRAFT_COUNT = 750

function sourceByteLength(source: string) {
  return new TextEncoder().encode(source).byteLength
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function defaultIdFactory(index: number) {
  const randomPart = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 10)}`
  return `draft-${randomPart}`
}

function validateBatch(entries: unknown[]): DraftImportResult {
  if (entries.length > MAX_IMPORT_DRAFT_COUNT) {
    return {
      success: false,
      issues: [{ path: 'drafts', message: `Mỗi batch hỗ trợ tối đa ${MAX_IMPORT_DRAFT_COUNT} drafts.` }],
    }
  }
  const drafts: QuestionDraft[] = []
  const issues: DraftValidationIssue[] = []
  const ids = new Set<string>()

  entries.forEach((entry, index) => {
    const validation = validateQuestionDraft(entry)
    if (!validation.success) {
      validation.issues.forEach(item => issues.push({
        path: `drafts[${index}].${item.path.replace(/^draft\.?/u, '')}`,
        message: item.message,
      }))
      return
    }
    if (ids.has(validation.data.id)) {
      issues.push({ path: `drafts[${index}].id`, message: `ID ${validation.data.id} bị trùng trong batch.` })
      return
    }
    ids.add(validation.data.id)
    drafts.push(validation.data)
  })

  if (issues.length > 0) return { success: false, issues }
  if (drafts.length === 0) {
    return { success: false, issues: [{ path: 'drafts', message: 'Không tìm thấy draft nào để import.' }] }
  }
  return { success: true, drafts }
}

export function parseDraftJson(source: string): DraftImportResult {
  if (sourceByteLength(source) > MAX_IMPORT_SOURCE_BYTES) {
    return {
      success: false,
      issues: [{ path: 'json', message: `Import không được vượt quá ${MAX_IMPORT_SOURCE_BYTES} bytes.` }],
    }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(source) as unknown
  } catch (error) {
    return {
      success: false,
      issues: [{
        path: 'json',
        message: `JSON không hợp lệ: ${error instanceof Error ? error.message : 'không thể parse'}.`,
      }],
    }
  }

  if (Array.isArray(parsed)) return validateBatch(parsed)
  if (!isRecord(parsed)) {
    return { success: false, issues: [{ path: 'json', message: 'JSON phải là một mảng hoặc envelope có trường drafts.' }] }
  }
  const envelopeKeys = Object.keys(parsed)
  const allowedEnvelopeKeys = new Set(['schemaVersion', 'kind', 'exportedAt', 'drafts'])
  const unsupportedKey = envelopeKeys.find(key => !allowedEnvelopeKeys.has(key))
  if (unsupportedKey) {
    return {
      success: false,
      issues: [{ path: unsupportedKey, message: 'Envelope có trường không được hỗ trợ.' }],
    }
  }
  if (parsed.schemaVersion !== 1) {
    return {
      success: false,
      issues: [{ path: 'schemaVersion', message: 'Chỉ hỗ trợ import schemaVersion 1.' }],
    }
  }
  if (parsed.kind !== 'techflow-question-drafts') {
    return {
      success: false,
      issues: [{ path: 'kind', message: 'Envelope kind phải là techflow-question-drafts.' }],
    }
  }
  if (typeof parsed.exportedAt !== 'string' || Number.isNaN(Date.parse(parsed.exportedAt))) {
    return {
      success: false,
      issues: [{ path: 'exportedAt', message: 'Envelope phải có exportedAt hợp lệ.' }],
    }
  }
  if (!Array.isArray(parsed.drafts)) {
    return { success: false, issues: [{ path: 'drafts', message: 'Envelope phải có drafts là một mảng.' }] }
  }
  return validateBatch(parsed.drafts)
}

type MarkerName = 'Conclusion' | 'Mechanism' | 'Trade-off' | 'GameStream'

const requiredMarkers: MarkerName[] = ['Conclusion', 'Mechanism', 'Trade-off', 'GameStream']

function cleanQuestionHeading(value: string) {
  return value
    .replace(/^\d+[.)]\s*/u, '')
    .replace(/\s+#+\s*$/u, '')
    .trim()
}

function isQuestionHeading(rawHeading: string, body: string) {
  if (/^\d+[.)]\s+/u.test(rawHeading)) return true
  return /(?:\*\*(?:Conclusion|Mechanism|Trade-off|GameStream)\s*:\*\*|^#{3,6}\s+(?:Conclusion|Mechanism|Trade-off|GameStream)\s*:?)\s*/imu.test(body)
}

function extractMarkerSections(body: string) {
  const markerPattern = /\*\*(Conclusion|Mechanism|Trade-off|GameStream)\s*:\*\*|^#{3,6}\s+(Conclusion|Mechanism|Trade-off|GameStream)\s*:?\s*$/gimu
  const matches = [...body.matchAll(markerPattern)]
  const sections = new Map<MarkerName, string>()

  matches.forEach((match, index) => {
    const marker = (match[1] ?? match[2]) as MarkerName
    if (sections.has(marker)) return
    const start = (match.index ?? 0) + match[0].length
    const end = matches[index + 1]?.index ?? body.length
    const value = body
      .slice(start, end)
      .replace(/^\s*:\s*/u, '')
      .replace(/\s*<a\s+id=[^>]+>\s*<\/a>\s*$/iu, '')
      .trim()
    sections.set(marker, value)
  })

  return sections
}

export function parseGameStreamMarkdown(
  source: string,
  defaults: MarkdownImportDefaults,
  options: MarkdownImportOptions = {},
): DraftImportResult {
  if (sourceByteLength(source) > MAX_IMPORT_SOURCE_BYTES) {
    return {
      success: false,
      issues: [{ path: 'markdown', message: `Import không được vượt quá ${MAX_IMPORT_SOURCE_BYTES} bytes.` }],
    }
  }
  const normalized = source.replace(/\r\n?/gu, '\n')
  const headingPattern = /^##\s+(.+?)\s*$/gmu
  const headings = [...normalized.matchAll(headingPattern)]
  const candidates = headings.map((heading, index) => {
    const start = (heading.index ?? 0) + heading[0].length
    const end = headings[index + 1]?.index ?? normalized.length
    return { rawHeading: heading[1].trim(), body: normalized.slice(start, end) }
  }).filter(entry => isQuestionHeading(entry.rawHeading, entry.body))

  if (candidates.length > MAX_IMPORT_DRAFT_COUNT) {
    return {
      success: false,
      issues: [{ path: 'markdown', message: `Mỗi batch hỗ trợ tối đa ${MAX_IMPORT_DRAFT_COUNT} questions.` }],
    }
  }

  if (candidates.length === 0) {
    return {
      success: false,
      issues: [{
        path: 'markdown',
        message: 'Không tìm thấy question heading cấp 2 cùng bốn phần Conclusion, Mechanism, Trade-off và GameStream.',
      }],
    }
  }

  const createdAt = (options.now ?? new Date()).toISOString()
  const idFactory = options.idFactory ?? defaultIdFactory
  const drafts: QuestionDraft[] = []
  const issues: DraftValidationIssue[] = []

  candidates.forEach((candidate, index) => {
    const question = cleanQuestionHeading(candidate.rawHeading)
    const sections = extractMarkerSections(candidate.body)
    for (const marker of requiredMarkers) {
      if (!sections.get(marker)?.trim()) {
        issues.push({
          path: `questions[${index}].${marker}`,
          message: `Câu “${question}” thiếu nội dung ${marker}.`,
        })
      }
    }
    if (requiredMarkers.some(marker => !sections.get(marker)?.trim())) return

    const draft: QuestionDraft = {
      schemaVersion: 1,
      id: idFactory(index, question),
      locale: defaults.locale,
      topicSlug: defaults.topicSlug,
      level: defaults.level,
      content: {
        question,
        quickAnswer: sections.get('Conclusion') ?? '',
        conceptualExplanation: sections.get('Mechanism') ?? '',
        productionTradeOff: sections.get('Trade-off') ?? '',
        appliedExample: {
          label: defaults.locale === 'en' ? 'GameStream example' : 'Ví dụ trong GameStream',
          detail: sections.get('GameStream') ?? '',
        },
      },
      sourceNotes: `Import từ GameStream Markdown: heading “${candidate.rawHeading}”.`,
      lifecycle: 'draft',
      reviewStatus: 'draft-needs-review',
      provenance: {
        kind: 'markdown-import',
        createdAt,
      },
    }
    const validation = validateQuestionDraft(draft)
    if (!validation.success) {
      validation.issues.forEach(item => issues.push({
        path: `questions[${index}].${item.path.replace(/^draft\.?/u, '')}`,
        message: item.message,
      }))
      return
    }
    drafts.push(validation.data)
  })

  if (issues.length > 0) return { success: false, issues }
  return validateBatch(drafts)
}

export function createDraftExport(
  drafts: readonly QuestionDraft[],
  now = new Date(),
): { success: true; json: string; envelope: DraftExportEnvelope } | { success: false; issues: DraftValidationIssue[] } {
  const validation = validateBatch([...drafts])
  if (!validation.success) return validation

  const envelope: DraftExportEnvelope = {
    schemaVersion: 1,
    kind: 'techflow-question-drafts',
    exportedAt: now.toISOString(),
    drafts: validation.drafts,
  }
  return { success: true, envelope, json: `${JSON.stringify(envelope, null, 2)}\n` }
}
