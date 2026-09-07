import { readFile } from 'node:fs/promises'
import {
  assertInterviewSnapshotInSync,
  computeInterviewQuestionContentHash,
  computeInterviewTranslationContentHash,
  englishOutputPath,
  expectedEnglishTranslationCount,
  expectedFileCount,
  expectedQuestionCount,
  expectedQuestionsPerFile,
  generatedDataMarkers,
  generatedEnglishDataMarkers,
  levels,
  outputPath,
  topics,
} from './import-gamestream-interview.mjs'

function fail(message) {
  throw new Error(`[interview-validate] ${message}`)
}

function assertExactKeys(value, expectedKeys, context) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${context} must be an object`)
  const keys = Object.keys(value).sort()
  const expected = [...expectedKeys].sort()
  if (keys.join('|') !== expected.join('|')) {
    fail(`${context} has keys [${keys.join(', ')}], expected [${expected.join(', ')}]`)
  }
}

function assertTrimmedNonEmptyString(value, context) {
  if (typeof value !== 'string' || !value.trim()) fail(`${context} must be a non-empty string`)
  if (value !== value.trim()) fail(`${context} must not have leading or trailing whitespace`)
}

function isIsoReviewDate(value) {
  if (typeof value !== 'string') return false
  if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value
}

function isHttpsUrl(value) {
  if (typeof value !== 'string' || value !== value.trim()) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function isCanonicalUtcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value
}

function extractGeneratedData(generatedSource, markers, label) {
  const start = generatedSource.indexOf(markers.start)
  const end = generatedSource.indexOf(markers.end)
  if (start < 0 || end < 0 || end <= start) fail(`${label} data markers are missing or out of order`)

  const json = generatedSource.slice(start + markers.start.length, end).trim()
  try {
    return JSON.parse(json)
  } catch (error) {
    fail(`${label} data is not valid JSON: ${error instanceof Error ? error.message : error}`)
  }
}

function extractQuestions(generatedSource) {
  return extractGeneratedData(generatedSource, generatedDataMarkers, 'generated Vietnamese question')
}

function extractEnglishQuestions(generatedSource) {
  return extractGeneratedData(generatedSource, generatedEnglishDataMarkers, 'generated English translation')
}

function validateReview(question, expectedQuestion) {
  if (question.reviewStatus === 'imported-needs-review') {
    if (Object.hasOwn(question, 'review')) fail(`${question.id} is pending review and must not contain review metadata`)
    if (expectedQuestion.reviewStatus !== 'imported-needs-review') fail(`${question.id} lost its review ledger status`)
    return
  }

  if (question.reviewStatus !== 'reviewed') fail(`${question.id}.reviewStatus is invalid: ${question.reviewStatus}`)
  if (expectedQuestion.reviewStatus !== 'reviewed') fail(`${question.id} is reviewed without a matching ledger entry`)

  assertExactKeys(question.review, ['reviewer', 'reviewedAt', 'evidence', 'contentHash'], `${question.id}.review`)
  assertTrimmedNonEmptyString(question.review.reviewer, `${question.id}.review.reviewer`)
  if (!isIsoReviewDate(question.review.reviewedAt)) {
    fail(`${question.id}.review.reviewedAt must be an ISO 8601 date or canonical UTC timestamp`)
  }
  if (!Array.isArray(question.review.evidence) || question.review.evidence.length === 0) {
    fail(`${question.id}.review.evidence must be a non-empty array of labeled HTTPS URLs`)
  }

  const evidenceSet = new Set()
  question.review.evidence.forEach((evidence, index) => {
    const context = `${question.id}.review.evidence[${index}]`
    assertExactKeys(evidence, ['label', 'url'], context)
    assertTrimmedNonEmptyString(evidence.label, `${context}.label`)
    if (!isHttpsUrl(evidence.url)) fail(`${context}.url must be a valid HTTPS URL`)
    if (evidenceSet.has(evidence.url)) fail(`${question.id}.review.evidence contains duplicate URL: ${evidence.url}`)
    evidenceSet.add(evidence.url)
  })

  const expectedHash = computeInterviewQuestionContentHash(question)
  if (!/^[a-f0-9]{64}$/u.test(question.review.contentHash)) {
    fail(`${question.id}.review.contentHash must be a lowercase 64-character SHA-256 hex value`)
  }
  if (question.review.contentHash !== expectedHash) {
    fail(`${question.id}.review.contentHash does not match canonical question content`)
  }
  if (JSON.stringify(question.review) !== JSON.stringify(expectedQuestion.review)) {
    fail(`${question.id}.review metadata does not match the review ledger`)
  }
}

function validateQuestion(question, expected, expectedQuestion) {
  const keys = [
    'id',
    'topicSlug',
    'level',
    'position',
    'question',
    'quickAnswer',
    'conceptualExplanation',
    'productionTradeOff',
    'appliedExample',
    'source',
    'reviewStatus',
  ]
  if (question?.reviewStatus === 'reviewed') keys.push('review')
  assertExactKeys(question, keys, expected.id)

  if (question.id !== expected.id) fail(`expected id ${expected.id}, found ${question.id}`)
  if (question.topicSlug !== expected.topicSlug) fail(`${expected.id} has topicSlug ${question.topicSlug}`)
  if (question.level !== expected.level) fail(`${expected.id} has level ${question.level}`)
  if (question.position !== expected.position) fail(`${expected.id} has position ${question.position}`)

  for (const field of ['question', 'quickAnswer', 'conceptualExplanation', 'productionTradeOff']) {
    assertTrimmedNonEmptyString(question[field], `${expected.id}.${field}`)
  }

  assertExactKeys(question.appliedExample, ['label', 'detail'], `${expected.id}.appliedExample`)
  if (question.appliedExample.label !== 'GameStream') fail(`${expected.id}.appliedExample.label must be GameStream`)
  assertTrimmedNonEmptyString(question.appliedExample.detail, `${expected.id}.appliedExample.detail`)

  assertExactKeys(question.source, ['relativePath', 'anchor'], `${expected.id}.source`)
  if (question.source.relativePath !== expected.relativePath) {
    fail(`${expected.id} has source path ${question.source.relativePath}; expected ${expected.relativePath}`)
  }
  if (question.source.anchor !== expected.anchor) {
    fail(`${expected.id} has source anchor ${question.source.anchor}; expected ${expected.anchor}`)
  }

  validateReview(question, expectedQuestion)
}

function validateTranslationReview(question) {
  if (question.translationStatus === 'ai-translated-needs-review') {
    if (Object.hasOwn(question, 'translationReview')) {
      fail(`${question.id} is pending translation review and must not contain translationReview metadata`)
    }
    return
  }

  if (question.translationStatus !== 'reviewed') {
    fail(`${question.id}.translationStatus is invalid: ${question.translationStatus}`)
  }
  if (!Object.hasOwn(question, 'translationReview')) {
    fail(`${question.id} is marked as a reviewed translation without translationReview metadata`)
  }

  const review = question.translationReview
  assertExactKeys(review, ['reviewer', 'reviewedAt', 'evidence', 'contentHash'], `${question.id}.translationReview`)
  assertTrimmedNonEmptyString(review.reviewer, `${question.id}.translationReview.reviewer`)
  if (!isIsoReviewDate(review.reviewedAt)) {
    fail(`${question.id}.translationReview.reviewedAt must be an ISO 8601 date or canonical UTC timestamp`)
  }
  if (!Array.isArray(review.evidence) || review.evidence.length === 0) {
    fail(`${question.id}.translationReview.evidence must be a non-empty array of labeled HTTPS URLs`)
  }

  const evidenceSet = new Set()
  review.evidence.forEach((evidence, index) => {
    const context = `${question.id}.translationReview.evidence[${index}]`
    assertExactKeys(evidence, ['label', 'url'], context)
    assertTrimmedNonEmptyString(evidence.label, `${context}.label`)
    if (!isHttpsUrl(evidence.url)) fail(`${context}.url must be a valid HTTPS URL`)
    if (evidenceSet.has(evidence.url)) fail(`${question.id}.translationReview.evidence contains duplicate URL: ${evidence.url}`)
    evidenceSet.add(evidence.url)
  })

  const expectedHash = computeInterviewTranslationContentHash({ ...question, questionId: question.id })
  if (!/^[a-f0-9]{64}$/u.test(review.contentHash)) {
    fail(`${question.id}.translationReview.contentHash must be a lowercase 64-character SHA-256 hex value`)
  }
  if (review.contentHash !== expectedHash) {
    fail(`${question.id}.translationReview.contentHash does not match canonical English translation content`)
  }
}

function validateEnglishQuestion(question, expectedQuestion, baseQuestion) {
  const keys = [
    'id',
    'topicSlug',
    'level',
    'position',
    'question',
    'quickAnswer',
    'conceptualExplanation',
    'productionTradeOff',
    'appliedExample',
    'source',
    'reviewStatus',
    'locale',
    'translatedFromHash',
    'translationProvenance',
    'translationStatus',
  ]
  if (question?.reviewStatus === 'reviewed') keys.push('review')
  if (question?.translationStatus === 'reviewed') keys.push('translationReview')
  assertExactKeys(question, keys, expectedQuestion.id)

  if (question.id !== expectedQuestion.id) fail(`expected English id ${expectedQuestion.id}, found ${question.id}`)
  if (question.topicSlug !== 'typescript') fail(`${question.id}.topicSlug must be typescript`)
  if (question.topicSlug !== baseQuestion.topicSlug) fail(`${question.id}.topicSlug differs from the canonical Vietnamese question`)
  if (question.level !== baseQuestion.level) fail(`${question.id}.level differs from the canonical Vietnamese question`)
  if (question.position !== baseQuestion.position) fail(`${question.id}.position differs from the canonical Vietnamese question`)
  if (question.locale !== 'en') fail(`${question.id}.locale must be en`)

  for (const field of ['question', 'quickAnswer', 'conceptualExplanation', 'productionTradeOff']) {
    assertTrimmedNonEmptyString(question[field], `${question.id}.${field}`)
  }
  assertExactKeys(question.appliedExample, ['label', 'detail'], `${question.id}.appliedExample`)
  if (question.appliedExample.label !== 'GameStream') fail(`${question.id}.appliedExample.label must be GameStream`)
  assertTrimmedNonEmptyString(question.appliedExample.detail, `${question.id}.appliedExample.detail`)

  assertExactKeys(question.source, ['relativePath', 'anchor'], `${question.id}.source`)
  if (JSON.stringify(question.source) !== JSON.stringify(baseQuestion.source)) {
    fail(`${question.id}.source differs from the canonical Vietnamese question`)
  }
  if (question.reviewStatus !== baseQuestion.reviewStatus) {
    fail(`${question.id}.reviewStatus differs from the canonical Vietnamese question`)
  }
  if (JSON.stringify(question.review) !== JSON.stringify(baseQuestion.review)) {
    fail(`${question.id}.review metadata differs from the canonical Vietnamese question`)
  }

  const expectedSourceHash = computeInterviewQuestionContentHash(baseQuestion)
  if (question.translatedFromHash !== expectedSourceHash) {
    fail(`${question.id}.translatedFromHash is stale; expected ${expectedSourceHash}, found ${question.translatedFromHash}`)
  }

  assertExactKeys(question.translationProvenance, ['kind', 'generatedAt', 'generator'], `${question.id}.translationProvenance`)
  if (question.translationProvenance.kind !== 'ai-translated') {
    fail(`${question.id}.translationProvenance.kind must be ai-translated`)
  }
  if (!isCanonicalUtcTimestamp(question.translationProvenance.generatedAt)) {
    fail(`${question.id}.translationProvenance.generatedAt must be a canonical UTC timestamp`)
  }
  assertTrimmedNonEmptyString(question.translationProvenance.generator, `${question.id}.translationProvenance.generator`)

  validateTranslationReview(question)

  if (JSON.stringify(question) !== JSON.stringify(expectedQuestion)) {
    fail(`${question.id} does not match the validated English translation source`)
  }
}

async function main() {
  const sourceSnapshot = await assertInterviewSnapshotInSync()
  const [generatedSource, generatedEnglishSource] = await Promise.all([
    readFile(outputPath, 'utf8'),
    readFile(englishOutputPath, 'utf8'),
  ])
  const questions = extractQuestions(generatedSource)
  const englishQuestions = extractEnglishQuestions(generatedEnglishSource)
  if (!Array.isArray(questions)) fail('generated data must be an array')
  if (questions.length !== expectedQuestionCount) {
    fail(`expected ${expectedQuestionCount} questions, found ${questions.length}`)
  }
  if (!Array.isArray(englishQuestions)) fail('generated English data must be an array')
  if (englishQuestions.length !== expectedEnglishTranslationCount) {
    fail(`expected ${expectedEnglishTranslationCount} English TypeScript translations, found ${englishQuestions.length}`)
  }

  const ids = new Set()
  const sourceReferences = new Set()
  let index = 0

  for (const topicSlug of topics) {
    for (const { value: level, filePrefix } of levels) {
      for (let position = 1; position <= expectedQuestionsPerFile; position += 1) {
        const id = `${topicSlug}-${level}-${String(position).padStart(2, '0')}`
        const expected = {
          id,
          topicSlug,
          level,
          position,
          relativePath: `${topicSlug}/${filePrefix}_${level}_${topicSlug}.md`,
          anchor: `question-${position}`,
        }
        const question = questions[index]
        validateQuestion(question, expected, sourceSnapshot.questions[index])

        if (ids.has(question.id)) fail(`duplicate question id: ${question.id}`)
        ids.add(question.id)

        const sourceReference = `${question.source.relativePath}#${question.source.anchor}`
        if (sourceReferences.has(sourceReference)) fail(`duplicate source reference: ${sourceReference}`)
        sourceReferences.add(sourceReference)
        index += 1
      }
    }
  }

  const baseQuestionsById = new Map(sourceSnapshot.questions.map(question => [question.id, question]))
  const englishIds = new Set()

  englishQuestions.forEach((question, englishIndex) => {
    const expectedQuestion = sourceSnapshot.englishQuestions[englishIndex]
    const baseQuestion = baseQuestionsById.get(question.id)
    if (!baseQuestion) fail(`unknown generated English question id: ${question.id}`)
    if (englishIds.has(question.id)) fail(`duplicate generated English question id: ${question.id}`)
    englishIds.add(question.id)
    validateEnglishQuestion(question, expectedQuestion, baseQuestion)
  })

  const expectedEnglishIds = sourceSnapshot.questions
    .filter(question => question.topicSlug === 'typescript')
    .map(question => question.id)
  const missingEnglishIds = expectedEnglishIds.filter(id => !englishIds.has(id))
  const unknownEnglishIds = [...englishIds].filter(id => !expectedEnglishIds.includes(id))
  if (missingEnglishIds.length || unknownEnglishIds.length) {
    fail(`English TypeScript ID set is invalid; missing=[${missingEnglishIds.join(', ')}], unknown=[${unknownEnglishIds.join(', ')}]`)
  }

  for (const { value: level } of levels) {
    const levelCount = englishQuestions.filter(question => question.level === level).length
    if (levelCount !== expectedQuestionsPerFile) {
      fail(`expected ${expectedQuestionsPerFile} English TypeScript ${level} translations, found ${levelCount}`)
    }
  }

  console.log(`Validated ${questions.length} questions: ${topics.length} topics × ${levels.length} levels × ${expectedQuestionsPerFile} questions.`)
  console.log(`Verified ${expectedFileCount} source files, ${sourceSnapshot.reviewedCount} review ledger entries and a byte-identical generated snapshot.`)
  console.log(`Validated ${englishQuestions.length} English TypeScript translations: ${levels.length} levels × ${expectedQuestionsPerFile} questions.`)
  console.log(`Verified ${sourceSnapshot.englishReviewedCount} translation reviews and a byte-identical English snapshot.`)
  console.log('All IDs, source references, review metadata, provenance and content hashes are valid.')
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
