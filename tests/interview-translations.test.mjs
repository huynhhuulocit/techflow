import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  computeInterviewQuestionContentHash,
  englishTranslationPath,
  expectedEnglishTranslationCount,
  loadSourceQuestions,
  validateEnglishTranslations,
} from '../scripts/import-gamestream-interview.mjs'

const baseQuestions = await loadSourceQuestions()
const questionById = new Map(baseQuestions.map(question => [question.id, question]))
const canonicalTranslations = JSON.parse((await readFile(englishTranslationPath, 'utf8'))
  .replace(/^\uFEFF/u, '')
  .replace(/\r\n?/gu, '\n'))

function cloneTranslations() {
  return structuredClone(canonicalTranslations)
}

test('accepts exactly 45 ordered TypeScript translation drafts', () => {
  const translations = validateEnglishTranslations(cloneTranslations(), questionById)

  assert.equal(translations.length, expectedEnglishTranslationCount)
  assert.equal(translations[0].questionId, 'typescript-junior-01')
  assert.equal(translations.at(-1).questionId, 'typescript-senior-15')
  assert.ok(translations.every(translation => translation.translationStatus === 'ai-translated-needs-review'))
})

test('rejects a duplicate English question ID', () => {
  const translations = cloneTranslations()
  translations[1].questionId = translations[0].questionId

  assert.throws(
    () => validateEnglishTranslations(translations, questionById),
    /duplicate English translation questionId/u,
  )
})

test('rejects an unknown English question ID', () => {
  const translations = cloneTranslations()
  translations[0].questionId = 'typescript-junior-99'

  assert.throws(
    () => validateEnglishTranslations(translations, questionById),
    /unknown English translation questionId/u,
  )
})

test('rejects a translation whose Vietnamese source hash is stale', () => {
  const translations = cloneTranslations()
  translations[0].translatedFromHash = '0'.repeat(64)
  const expectedHash = computeInterviewQuestionContentHash(questionById.get(translations[0].questionId))

  assert.throws(
    () => validateEnglishTranslations(translations, questionById),
    new RegExp(`translatedFromHash is stale; expected ${expectedHash}`, 'u'),
  )
})

test('rejects reviewed status without review metadata', () => {
  const translations = cloneTranslations()
  translations[0].translationStatus = 'reviewed'

  assert.throws(
    () => validateEnglishTranslations(translations, questionById),
    /has keys .* expected .*translationReview/u,
  )
})

test('rejects a missing English TypeScript question', () => {
  const translations = cloneTranslations().slice(1)

  assert.throws(
    () => validateEnglishTranslations(translations, questionById),
    /must contain exactly 45 translations/u,
  )
})
