import type { QuestionDraft } from '../content/types'

export type DuplicateWarning = {
  kind: 'exact' | 'near'
  draftId: string
  question: string
  similarity: number
}

export function normalizeQuestionTitle(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/đ/giu, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

function levenshtein(left: string, right: string) {
  if (left === right) return 0
  if (!left.length) return right.length
  if (!right.length) return left.length

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost,
      )
    }
    previous = current
  }
  return previous[right.length]
}

function editSimilarity(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length)
  return maxLength === 0 ? 1 : 1 - (levenshtein(left, right) / maxLength)
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = new Set(left.split(' ').filter(Boolean))
  const rightTokens = new Set(right.split(' ').filter(Boolean))
  const union = new Set([...leftTokens, ...rightTokens])
  if (union.size === 0) return 1
  let intersection = 0
  leftTokens.forEach(token => {
    if (rightTokens.has(token)) intersection += 1
  })
  return intersection / union.size
}

export function questionSimilarity(leftQuestion: string, rightQuestion: string) {
  const left = normalizeQuestionTitle(leftQuestion)
  const right = normalizeQuestionTitle(rightQuestion)
  if (left === right) return 1
  if (Math.min(left.length, right.length) < 8) return 0
  return Math.max(editSimilarity(left, right), tokenSimilarity(left, right))
}

export function findDuplicateWarnings(
  candidate: QuestionDraft,
  existing: readonly QuestionDraft[],
  nearThreshold = 0.82,
): DuplicateWarning[] {
  const normalizedCandidate = normalizeQuestionTitle(candidate.content.question)
  if (!normalizedCandidate) return []

  return existing
    .filter(draft => draft.id !== candidate.id && draft.locale === candidate.locale)
    .map(draft => {
      const normalizedExisting = normalizeQuestionTitle(draft.content.question)
      const similarity = questionSimilarity(normalizedCandidate, normalizedExisting)
      if (normalizedCandidate === normalizedExisting) {
        return {
          kind: 'exact' as const,
          draftId: draft.id,
          question: draft.content.question,
          similarity: 1,
        }
      }
      if (similarity >= nearThreshold) {
        return {
          kind: 'near' as const,
          draftId: draft.id,
          question: draft.content.question,
          similarity,
        }
      }
      return null
    })
    .filter((warning): warning is DuplicateWarning => warning !== null)
    .sort((left, right) => right.similarity - left.similarity)
}

export function findBatchDuplicateWarnings(
  imported: readonly QuestionDraft[],
  existing: readonly QuestionDraft[] = [],
) {
  return imported.flatMap((draft, index) => findDuplicateWarnings(
    draft,
    [...existing, ...imported.slice(0, index)],
  ).map(warning => ({ draftId: draft.id, duplicate: warning })))
}
