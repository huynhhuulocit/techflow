import type { QuestionDraft } from '../content/types'
import { validateSimulationSpec } from '../simulation'

export type DraftValidationIssue = {
  path: string
  message: string
}

export type DraftValidationResult =
  | { success: true; data: QuestionDraft; issues: [] }
  | { success: false; issues: DraftValidationIssue[] }

const DRAFT_KEYS = [
  'schemaVersion',
  'id',
  'locale',
  'topicSlug',
  'level',
  'content',
  'sourceNotes',
  'lifecycle',
  'reviewStatus',
  'provenance',
  'simulation',
] as const

const CONTENT_KEYS = [
  'question',
  'quickAnswer',
  'conceptualExplanation',
  'productionTradeOff',
  'appliedExample',
] as const

const PROVENANCE_KEYS = [
  'kind',
  'createdAt',
  'model',
  'promptVersion',
  'responseId',
  'inputHash',
  'sourceQuestion',
] as const

const SAFE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/u
const SAFE_TOPIC_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/u
const HASH_PATTERN = /^[a-f0-9]{64}$/u
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u
const DANGEROUS_MARKUP_PATTERN = /(?:<\s*\/?\s*(?:script|iframe|object|embed|style|img|svg|link|meta|form|input|button|a)\b|javascript\s*:|\bon(?:error|load|click|focus|mouseover)\s*=)/iu

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function issue(issues: DraftValidationIssue[], path: string, message: string) {
  issues.push({ path, message })
}

function validateKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
  path: string,
  issues: DraftValidationIssue[],
) {
  const allowedKeys = new Set(allowed)
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) issue(issues, `${path}.${key}`, 'Trường không được hỗ trợ.')
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      issue(issues, `${path}.${key}`, 'Thiếu trường bắt buộc.')
    }
  }
}

function validateText(
  value: unknown,
  path: string,
  issues: DraftValidationIssue[],
  options: { min?: number; max: number; allowMarkup?: boolean },
) {
  const { min = 1, max, allowMarkup = false } = options
  if (typeof value !== 'string') {
    issue(issues, path, 'Phải là chuỗi.')
    return false
  }
  if (value.trim().length < min) issue(issues, path, min === 0 ? 'Giá trị không hợp lệ.' : 'Không được để trống.')
  if (value.length > max) issue(issues, path, `Không được vượt quá ${max} ký tự.`)
  if (!allowMarkup && DANGEROUS_MARKUP_PATTERN.test(value)) {
    issue(issues, path, 'Không chấp nhận HTML, script hoặc event handler.')
  }
  return true
}

function validateContent(value: unknown, path: string, issues: DraftValidationIssue[]) {
  if (!isRecord(value)) {
    issue(issues, path, 'Nội dung câu hỏi phải là object.')
    return
  }
  validateKeys(value, CONTENT_KEYS, CONTENT_KEYS, path, issues)
  validateText(value.question, `${path}.question`, issues, { max: 300 })
  validateText(value.quickAnswer, `${path}.quickAnswer`, issues, { max: 1_200 })
  validateText(value.conceptualExplanation, `${path}.conceptualExplanation`, issues, { max: 2_400 })
  validateText(value.productionTradeOff, `${path}.productionTradeOff`, issues, { max: 1_800 })

  if (!isRecord(value.appliedExample)) {
    issue(issues, `${path}.appliedExample`, 'Ví dụ áp dụng phải là object.')
    return
  }
  validateKeys(
    value.appliedExample,
    ['label', 'detail'],
    ['label', 'detail'],
    `${path}.appliedExample`,
    issues,
  )
  validateText(value.appliedExample.label, `${path}.appliedExample.label`, issues, { max: 80 })
  validateText(value.appliedExample.detail, `${path}.appliedExample.detail`, issues, { max: 1_800 })
}

function validateProvenance(value: unknown, path: string, issues: DraftValidationIssue[]) {
  if (!isRecord(value)) {
    issue(issues, path, 'Provenance phải là object.')
    return
  }
  validateKeys(value, PROVENANCE_KEYS, ['kind', 'createdAt'], path, issues)
  if (!['manual', 'json-import', 'markdown-import', 'question-bank-copy', 'ai-generated'].includes(String(value.kind))) {
    issue(issues, `${path}.kind`, 'Loại provenance không hợp lệ.')
  }
  if (
    !validateText(value.createdAt, `${path}.createdAt`, issues, { max: 40 })
    || !ISO_UTC_PATTERN.test(String(value.createdAt))
    || Number.isNaN(Date.parse(String(value.createdAt)))
  ) {
    issue(issues, `${path}.createdAt`, 'Phải là ISO UTC timestamp hợp lệ.')
  }
  if (value.model !== undefined) validateText(value.model, `${path}.model`, issues, { max: 120 })
  if (value.promptVersion !== undefined) validateText(value.promptVersion, `${path}.promptVersion`, issues, { max: 80 })
  if (value.responseId !== undefined) validateText(value.responseId, `${path}.responseId`, issues, { max: 160 })
  if (value.inputHash !== undefined && (typeof value.inputHash !== 'string' || !HASH_PATTERN.test(value.inputHash))) {
    issue(issues, `${path}.inputHash`, 'Input hash phải là SHA-256 lowercase gồm 64 ký tự hex.')
  }
  if (value.sourceQuestion !== undefined) {
    if (!isRecord(value.sourceQuestion)) {
      issue(issues, `${path}.sourceQuestion`, 'Source question phải là object.')
    } else {
      validateKeys(
        value.sourceQuestion,
        ['questionId', 'locale', 'contentHash'],
        ['questionId', 'locale', 'contentHash'],
        `${path}.sourceQuestion`,
        issues,
      )
      if (
        !validateText(value.sourceQuestion.questionId, `${path}.sourceQuestion.questionId`, issues, { max: 120 })
        || !SAFE_ID_PATTERN.test(String(value.sourceQuestion.questionId))
      ) {
        issue(issues, `${path}.sourceQuestion.questionId`, 'Source question ID không hợp lệ.')
      }
      if (!['vi', 'en'].includes(String(value.sourceQuestion.locale))) {
        issue(issues, `${path}.sourceQuestion.locale`, 'Source locale phải là vi hoặc en.')
      }
      if (typeof value.sourceQuestion.contentHash !== 'string' || !HASH_PATTERN.test(value.sourceQuestion.contentHash)) {
        issue(issues, `${path}.sourceQuestion.contentHash`, 'Source content hash phải là SHA-256 lowercase gồm 64 ký tự hex.')
      }
    }
  }
  if (value.kind === 'question-bank-copy' && value.sourceQuestion === undefined) {
    issue(issues, `${path}.sourceQuestion`, 'Question Bank copy phải giữ source question metadata.')
  }
  if (value.kind !== 'question-bank-copy' && value.sourceQuestion !== undefined) {
    issue(issues, `${path}.sourceQuestion`, 'Chỉ question-bank-copy được có source question metadata.')
  }
}

function normalizeDraft(draft: QuestionDraft): QuestionDraft {
  return {
    ...draft,
    id: draft.id.trim(),
    topicSlug: draft.topicSlug.trim(),
    content: {
      question: draft.content.question.trim(),
      quickAnswer: draft.content.quickAnswer.trim(),
      conceptualExplanation: draft.content.conceptualExplanation.trim(),
      productionTradeOff: draft.content.productionTradeOff.trim(),
      appliedExample: {
        label: draft.content.appliedExample.label.trim(),
        detail: draft.content.appliedExample.detail.trim(),
      },
    },
    sourceNotes: draft.sourceNotes.trim(),
    provenance: {
      ...draft.provenance,
      model: draft.provenance.model?.trim(),
      promptVersion: draft.provenance.promptVersion?.trim(),
      responseId: draft.provenance.responseId?.trim(),
      sourceQuestion: draft.provenance.sourceQuestion
        ? { ...draft.provenance.sourceQuestion, questionId: draft.provenance.sourceQuestion.questionId.trim() }
        : undefined,
    },
  }
}

export function validateQuestionDraft(input: unknown): DraftValidationResult {
  const issues: DraftValidationIssue[] = []
  if (!isRecord(input)) {
    return { success: false, issues: [{ path: 'draft', message: 'Draft phải là object.' }] }
  }

  validateKeys(input, DRAFT_KEYS, DRAFT_KEYS.filter(key => key !== 'simulation'), 'draft', issues)
  if (input.schemaVersion !== 1) issue(issues, 'draft.schemaVersion', 'Chỉ hỗ trợ schemaVersion 1.')

  if (!validateText(input.id, 'draft.id', issues, { max: 120 }) || !SAFE_ID_PATTERN.test(String(input.id))) {
    issue(issues, 'draft.id', 'ID không đúng định dạng an toàn.')
  }
  if (!['vi', 'en'].includes(String(input.locale))) issue(issues, 'draft.locale', 'Locale phải là vi hoặc en.')
  if (
    !validateText(input.topicSlug, 'draft.topicSlug', issues, { max: 80 })
    || !SAFE_TOPIC_PATTERN.test(String(input.topicSlug))
  ) {
    issue(issues, 'draft.topicSlug', 'Topic slug chỉ gồm chữ thường, số và dấu gạch ngang.')
  }
  if (!['junior', 'middle', 'senior'].includes(String(input.level))) {
    issue(issues, 'draft.level', 'Level phải là junior, middle hoặc senior.')
  }

  validateContent(input.content, 'draft.content', issues)
  validateText(input.sourceNotes, 'draft.sourceNotes', issues, { min: 0, max: 8_000 })
  if (input.lifecycle !== 'draft') issue(issues, 'draft.lifecycle', 'Author Studio chỉ chấp nhận lifecycle draft.')
  if (!['draft-needs-review', 'generated-needs-review'].includes(String(input.reviewStatus))) {
    issue(issues, 'draft.reviewStatus', 'Review status của draft không hợp lệ.')
  }
  validateProvenance(input.provenance, 'draft.provenance', issues)

  if (isRecord(input.provenance)) {
    if (input.reviewStatus === 'generated-needs-review' && input.provenance.kind !== 'ai-generated') {
      issue(issues, 'draft.provenance.kind', 'Generated draft phải có provenance ai-generated.')
    }
    if (input.provenance.kind === 'ai-generated' && input.reviewStatus !== 'generated-needs-review') {
      issue(issues, 'draft.reviewStatus', 'AI-generated content phải giữ trạng thái generated-needs-review.')
    }
  }

  if (input.simulation !== undefined) {
    const simulation = validateSimulationSpec(input.simulation)
    if (!simulation.success) {
      simulation.issues.forEach(entry => issue(issues, `draft.${entry.path}`, entry.message))
    } else if (simulation.data.schemaVersion !== 1) {
      issue(
        issues,
        'draft.simulation.schemaVersion',
        'Question Studio chỉ chấp nhận question-bound simulation schemaVersion 1.',
      )
    } else if (simulation.data.status !== 'generated-needs-review') {
      issue(
        issues,
        'draft.simulation.status',
        'Question Studio chưa hỗ trợ canonical review hash; attached simulation phải giữ trạng thái generated-needs-review.',
      )
    }
  }

  if (issues.length > 0) return { success: false, issues }
  return { success: true, data: normalizeDraft(input as unknown as QuestionDraft), issues: [] }
}

export function formatDraftIssues(issues: DraftValidationIssue[], limit = 6) {
  const visible = issues.slice(0, limit).map(entry => `${entry.path}: ${entry.message}`)
  if (issues.length > limit) visible.push(`…và ${issues.length - limit} lỗi khác.`)
  return visible
}
