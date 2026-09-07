import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDirectory = path.dirname(scriptPath)
const projectRoot = path.resolve(scriptDirectory, '..')

export const defaultSourceRoot = path.join(projectRoot, 'content', 'interview', 'vi')
export const outputPath = path.join(projectRoot, 'src', 'content', 'generated', 'gameStreamInterview.ts')
export const reviewLedgerPath = path.join(projectRoot, 'src', 'content', 'interviewReviews.json')
export const englishTranslationPath = path.join(projectRoot, 'src', 'content', 'interview', 'en', 'typescript.json')
export const englishOutputPath = path.join(projectRoot, 'src', 'content', 'generated', 'gameStreamInterview.en.ts')

export const topics = [
  'docker-nginx',
  'elasticsearch',
  'jwt-oauth-oidc',
  'kafka-message-queue',
  'livekit-webrtc',
  'memory-cache',
  'mongodb',
  'nodejs-nestjs',
  'redis',
  'socketio-realtime',
  'system-design-patterns',
  'testing-observability',
  'typescript',
]

export const levels = [
  { value: 'junior', filePrefix: '01' },
  { value: 'middle', filePrefix: '02' },
  { value: 'senior', filePrefix: '03' },
]

export const expectedQuestionsPerFile = 15
export const expectedFileCount = topics.length * levels.length
export const expectedQuestionCount = expectedFileCount * expectedQuestionsPerFile
export const generatedDataMarkers = {
  start: '/*__INTERVIEW_DATA_START__*/',
  end: '/*__INTERVIEW_DATA_END__*/',
}
export const generatedEnglishDataMarkers = {
  start: '/*__INTERVIEW_EN_DATA_START__*/',
  end: '/*__INTERVIEW_EN_DATA_END__*/',
}
export const expectedEnglishTranslationCount = levels.length * expectedQuestionsPerFile

function fail(message) {
  throw new Error(`[interview-import] ${message}`)
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

function isCanonicalUtcTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) return false
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

function toPosixPath(value) {
  return value.split(path.sep).join('/')
}

function normalizeCanonicalText(value) {
  return value.replace(/^\uFEFF/u, '').replace(/\r\n?/gu, '\n')
}

export function computeInterviewQuestionContentHash(question) {
  const canonicalContent = JSON.stringify({
    version: 1,
    question: normalizeCanonicalText(question.question),
    quickAnswer: normalizeCanonicalText(question.quickAnswer),
    conceptualExplanation: normalizeCanonicalText(question.conceptualExplanation),
    productionTradeOff: normalizeCanonicalText(question.productionTradeOff),
    appliedExampleLabel: normalizeCanonicalText(question.appliedExample.label),
    appliedExampleDetail: normalizeCanonicalText(question.appliedExample.detail),
    sourceRelativePath: normalizeCanonicalText(question.source.relativePath),
    sourceAnchor: normalizeCanonicalText(question.source.anchor),
  })

  return createHash('sha256').update(canonicalContent, 'utf8').digest('hex')
}

export function computeInterviewTranslationContentHash(translation) {
  const canonicalContent = JSON.stringify({
    version: 1,
    questionId: translation.questionId,
    locale: translation.locale,
    translatedFromHash: translation.translatedFromHash,
    question: normalizeCanonicalText(translation.question),
    quickAnswer: normalizeCanonicalText(translation.quickAnswer),
    conceptualExplanation: normalizeCanonicalText(translation.conceptualExplanation),
    productionTradeOff: normalizeCanonicalText(translation.productionTradeOff),
    appliedExampleLabel: normalizeCanonicalText(translation.appliedExample.label),
    appliedExampleDetail: normalizeCanonicalText(translation.appliedExample.detail),
  })

  return createHash('sha256').update(canonicalContent, 'utf8').digest('hex')
}

async function findLevelFiles(directory, sourceRoot) {
  const files = []
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await findLevelFiles(absolutePath, sourceRoot))
    } else if (/^(01_junior|02_middle|03_senior)_.+\.md$/u.test(entry.name)) {
      files.push(toPosixPath(path.relative(sourceRoot, absolutePath)))
    }
  }

  return files.sort()
}

function parseAnswer(answer, relativePath, position) {
  const answerPattern = /^\*\*Conclusion:\*\*\s*(.*?)\s+\*\*Mechanism:\*\*\s*(.*?)\s+\*\*Trade-off:\*\*\s*(.*?)\s+\*\*GameStream:\*\*\s*(.+)$/su
  const match = answer.match(answerPattern)

  if (!match) {
    fail(`${relativePath} question ${position} must contain Conclusion, Mechanism, Trade-off and GameStream in that order`)
  }

  const [, quickAnswer, conceptualExplanation, productionTradeOff, appliedDetail] = match.map(value => value.trim())
  const fields = { quickAnswer, conceptualExplanation, productionTradeOff, appliedDetail }

  for (const [field, value] of Object.entries(fields)) {
    if (!value) fail(`${relativePath} question ${position} has an empty ${field}`)
  }

  return fields
}

function parseFile(markdown, { topicSlug, level, relativePath }) {
  const normalizedMarkdown = markdown.replace(/^\uFEFF/u, '').replace(/\r\n?/gu, '\n')
  const anchorMatches = [...normalizedMarkdown.matchAll(/^<a id="question-(\d+)"><\/a>$/gmu)]
  const headingMatches = [...normalizedMarkdown.matchAll(/^## (\d+)\. .+$/gmu)]
  const answerMatches = [...normalizedMarkdown.matchAll(/^\*\*Câu trả lời mẫu:\*\* .+$/gmu)]

  if (anchorMatches.length !== expectedQuestionsPerFile
    || headingMatches.length !== expectedQuestionsPerFile
    || answerMatches.length !== expectedQuestionsPerFile) {
    fail(`${relativePath} must have exactly ${expectedQuestionsPerFile} anchors, question headings and sample answers; found ${anchorMatches.length}/${headingMatches.length}/${answerMatches.length}`)
  }

  const blockPattern = /<a id="(question-(\d+))"><\/a>\s*\n+##\s+(\d+)\.\s+([^\n]+?)\s*\n+\*\*Câu trả lời mẫu:\*\*\s+([^\n]+)/gmu
  const blocks = [...normalizedMarkdown.matchAll(blockPattern)]

  if (blocks.length !== expectedQuestionsPerFile) {
    fail(`${relativePath} has ${blocks.length} parseable question blocks; expected ${expectedQuestionsPerFile}`)
  }

  return blocks.map((match, index) => {
    const [, anchor, anchorPositionText, headingPositionText, questionText, answerText] = match
    const anchorPosition = Number(anchorPositionText)
    const headingPosition = Number(headingPositionText)
    const position = index + 1

    if (anchorPosition !== position || headingPosition !== position) {
      fail(`${relativePath} expected question ${position}, found anchor ${anchorPosition} and heading ${headingPosition}`)
    }

    const question = questionText.trim()
    if (!question) fail(`${relativePath} question ${position} has an empty title`)

    const answer = parseAnswer(answerText.trim(), relativePath, position)

    return {
      id: `${topicSlug}-${level}-${String(position).padStart(2, '0')}`,
      topicSlug,
      level,
      position,
      question,
      quickAnswer: answer.quickAnswer,
      conceptualExplanation: answer.conceptualExplanation,
      productionTradeOff: answer.productionTradeOff,
      appliedExample: {
        label: 'GameStream',
        detail: answer.appliedDetail,
      },
      source: {
        relativePath,
        anchor,
      },
    }
  })
}

function assertNoQuestionDuplicates(questions) {
  const ids = new Set()
  const sources = new Set()

  for (const question of questions) {
    if (ids.has(question.id)) fail(`duplicate question id: ${question.id}`)
    ids.add(question.id)

    const sourceKey = `${question.source.relativePath}#${question.source.anchor}`
    if (sources.has(sourceKey)) fail(`duplicate source reference: ${sourceKey}`)
    sources.add(sourceKey)
  }
}

async function readReviewLedger() {
  let rawLedger
  try {
    rawLedger = JSON.parse(await readFile(reviewLedgerPath, 'utf8'))
  } catch (error) {
    fail(`cannot read ${path.relative(projectRoot, reviewLedgerPath)}: ${error instanceof Error ? error.message : error}`)
  }

  if (!Array.isArray(rawLedger)) fail('review ledger must be a JSON array so duplicate questionId values can be detected')
  return rawLedger
}

export function validateReviewLedger(rawLedger, questionById) {
  const reviews = new Map()

  rawLedger.forEach((entry, index) => {
    const context = `review ledger entry ${index + 1}`
    assertExactKeys(entry, ['questionId', 'reviewer', 'reviewedAt', 'evidence', 'contentHash'], context)
    assertTrimmedNonEmptyString(entry.questionId, `${context}.questionId`)
    assertTrimmedNonEmptyString(entry.reviewer, `${context}.reviewer`)

    if (reviews.has(entry.questionId)) fail(`duplicate review ledger questionId: ${entry.questionId}`)
    const question = questionById.get(entry.questionId)
    if (!question) fail(`unknown review ledger questionId: ${entry.questionId}`)

    if (!isIsoReviewDate(entry.reviewedAt)) {
      fail(`${context}.reviewedAt must be an ISO 8601 date or canonical UTC timestamp`)
    }

    if (!Array.isArray(entry.evidence) || entry.evidence.length === 0) {
      fail(`${context}.evidence must be a non-empty array of labeled HTTPS URLs`)
    }
    const evidenceSet = new Set()
    for (const [evidenceIndex, evidence] of entry.evidence.entries()) {
      const evidenceContext = `${context}.evidence[${evidenceIndex}]`
      assertExactKeys(evidence, ['label', 'url'], evidenceContext)
      assertTrimmedNonEmptyString(evidence.label, `${evidenceContext}.label`)
      if (!isHttpsUrl(evidence.url)) fail(`${evidenceContext}.url must be a valid HTTPS URL`)
      if (evidenceSet.has(evidence.url)) fail(`${context}.evidence contains duplicate URL: ${evidence.url}`)
      evidenceSet.add(evidence.url)
    }

    const expectedHash = computeInterviewQuestionContentHash(question)
    if (typeof entry.contentHash !== 'string' || !/^[a-f0-9]{64}$/u.test(entry.contentHash)) {
      fail(`${context}.contentHash must be a lowercase 64-character SHA-256 hex value; expected ${expectedHash}`)
    }
    if (entry.contentHash !== expectedHash) {
      fail(`${context}.contentHash does not match canonical question content; expected ${expectedHash}, found ${entry.contentHash}`)
    }

    reviews.set(entry.questionId, {
      reviewer: entry.reviewer,
      reviewedAt: entry.reviewedAt,
      evidence: entry.evidence.map(evidence => ({ ...evidence })),
      contentHash: entry.contentHash,
    })
  })

  return reviews
}

function validateTranslationReview(review, translation, context) {
  assertExactKeys(review, ['reviewer', 'reviewedAt', 'evidence', 'contentHash'], context)
  assertTrimmedNonEmptyString(review.reviewer, `${context}.reviewer`)
  if (!isIsoReviewDate(review.reviewedAt)) {
    fail(`${context}.reviewedAt must be an ISO 8601 date or canonical UTC timestamp`)
  }
  if (!Array.isArray(review.evidence) || review.evidence.length === 0) {
    fail(`${context}.evidence must be a non-empty array of labeled HTTPS URLs`)
  }

  const evidenceSet = new Set()
  review.evidence.forEach((evidence, index) => {
    const evidenceContext = `${context}.evidence[${index}]`
    assertExactKeys(evidence, ['label', 'url'], evidenceContext)
    assertTrimmedNonEmptyString(evidence.label, `${evidenceContext}.label`)
    if (!isHttpsUrl(evidence.url)) fail(`${evidenceContext}.url must be a valid HTTPS URL`)
    if (evidenceSet.has(evidence.url)) fail(`${context}.evidence contains duplicate URL: ${evidence.url}`)
    evidenceSet.add(evidence.url)
  })

  const expectedHash = computeInterviewTranslationContentHash(translation)
  if (typeof review.contentHash !== 'string' || !/^[a-f0-9]{64}$/u.test(review.contentHash)) {
    fail(`${context}.contentHash must be a lowercase 64-character SHA-256 hex value; expected ${expectedHash}`)
  }
  if (review.contentHash !== expectedHash) {
    fail(`${context}.contentHash does not match canonical English translation content; expected ${expectedHash}, found ${review.contentHash}`)
  }
}

export function validateEnglishTranslations(rawTranslations, questionById) {
  if (!Array.isArray(rawTranslations)) {
    fail('English TypeScript translations must be a JSON array so duplicate questionId values can be detected')
  }

  const translations = new Map()

  rawTranslations.forEach((entry, index) => {
    const context = `English translation entry ${index + 1}`
    const keys = [
      'questionId',
      'locale',
      'translatedFromHash',
      'question',
      'quickAnswer',
      'conceptualExplanation',
      'productionTradeOff',
      'appliedExample',
      'provenance',
      'translationStatus',
    ]
    if (entry?.translationStatus === 'reviewed') keys.push('translationReview')
    assertExactKeys(entry, keys, context)
    assertTrimmedNonEmptyString(entry.questionId, `${context}.questionId`)

    if (translations.has(entry.questionId)) fail(`duplicate English translation questionId: ${entry.questionId}`)
    const baseQuestion = questionById.get(entry.questionId)
    if (!baseQuestion) fail(`unknown English translation questionId: ${entry.questionId}`)
    if (baseQuestion.topicSlug !== 'typescript') {
      fail(`${context}.questionId must reference the TypeScript pilot, found topic ${baseQuestion.topicSlug}`)
    }
    if (entry.locale !== 'en') fail(`${context}.locale must be en`)

    const expectedSourceHash = computeInterviewQuestionContentHash(baseQuestion)
    if (typeof entry.translatedFromHash !== 'string' || !/^[a-f0-9]{64}$/u.test(entry.translatedFromHash)) {
      fail(`${context}.translatedFromHash must be a lowercase 64-character SHA-256 hex value; expected ${expectedSourceHash}`)
    }
    if (entry.translatedFromHash !== expectedSourceHash) {
      fail(`${context}.translatedFromHash is stale; expected ${expectedSourceHash}, found ${entry.translatedFromHash}`)
    }

    for (const field of ['question', 'quickAnswer', 'conceptualExplanation', 'productionTradeOff']) {
      assertTrimmedNonEmptyString(entry[field], `${context}.${field}`)
    }

    assertExactKeys(entry.appliedExample, ['label', 'detail'], `${context}.appliedExample`)
    if (entry.appliedExample.label !== 'GameStream') fail(`${context}.appliedExample.label must be GameStream`)
    assertTrimmedNonEmptyString(entry.appliedExample.detail, `${context}.appliedExample.detail`)

    assertExactKeys(entry.provenance, ['kind', 'generatedAt', 'generator'], `${context}.provenance`)
    if (entry.provenance.kind !== 'ai-translated') fail(`${context}.provenance.kind must be ai-translated`)
    if (!isCanonicalUtcTimestamp(entry.provenance.generatedAt)) {
      fail(`${context}.provenance.generatedAt must be a canonical UTC timestamp`)
    }
    assertTrimmedNonEmptyString(entry.provenance.generator, `${context}.provenance.generator`)

    if (entry.translationStatus === 'ai-translated-needs-review') {
      if (Object.hasOwn(entry, 'translationReview')) {
        fail(`${context} is pending review and must not contain translationReview metadata`)
      }
    } else if (entry.translationStatus === 'reviewed') {
      if (!Object.hasOwn(entry, 'translationReview')) {
        fail(`${context} is reviewed but has no translationReview metadata`)
      }
      validateTranslationReview(entry.translationReview, entry, `${context}.translationReview`)
    } else {
      fail(`${context}.translationStatus is invalid: ${entry.translationStatus}`)
    }

    translations.set(entry.questionId, entry)
  })

  const expectedTypeScriptIds = [...questionById.values()]
    .filter(question => question.topicSlug === 'typescript')
    .map(question => question.id)
  const missingIds = expectedTypeScriptIds.filter(id => !translations.has(id))
  const extraIds = [...translations.keys()].filter(id => !expectedTypeScriptIds.includes(id))

  if (translations.size !== expectedEnglishTranslationCount || missingIds.length || extraIds.length) {
    fail(`English TypeScript pilot must contain exactly ${expectedEnglishTranslationCount} translations; missing=[${missingIds.join(', ')}], unexpected=[${extraIds.join(', ')}]`)
  }

  return expectedTypeScriptIds.map(id => translations.get(id))
}

export async function loadEnglishTranslations(baseQuestions) {
  let rawSource
  try {
    rawSource = normalizeCanonicalText(await readFile(englishTranslationPath, 'utf8'))
  } catch (error) {
    fail(`cannot read ${path.relative(projectRoot, englishTranslationPath)}: ${error instanceof Error ? error.message : error}`)
  }

  let rawTranslations
  try {
    rawTranslations = JSON.parse(rawSource)
  } catch (error) {
    fail(`${path.relative(projectRoot, englishTranslationPath)} is not valid JSON: ${error instanceof Error ? error.message : error}`)
  }

  return validateEnglishTranslations(rawTranslations, new Map(baseQuestions.map(question => [question.id, question])))
}

export async function loadSourceQuestions(sourceRoot = defaultSourceRoot) {
  const resolvedSourceRoot = path.resolve(sourceRoot)
  const expectedFiles = topics.flatMap(topicSlug => levels.map(({ value, filePrefix }) =>
    `${topicSlug}/${filePrefix}_${value}_${topicSlug}.md`))
  const actualFiles = await findLevelFiles(resolvedSourceRoot, resolvedSourceRoot)

  if (actualFiles.length !== expectedFileCount) {
    fail(`expected ${expectedFileCount} level files under ${resolvedSourceRoot}, found ${actualFiles.length}`)
  }

  const actualFileSet = new Set(actualFiles)
  const unexpectedFiles = actualFiles.filter(file => !expectedFiles.includes(file))
  const missingFiles = expectedFiles.filter(file => !actualFileSet.has(file))

  if (missingFiles.length || unexpectedFiles.length) {
    fail(`source file set differs from the expected 13-topic structure; missing=[${missingFiles.join(', ')}], unexpected=[${unexpectedFiles.join(', ')}]`)
  }

  const questions = []
  for (const topicSlug of topics) {
    for (const { value: level, filePrefix } of levels) {
      const relativePath = `${topicSlug}/${filePrefix}_${level}_${topicSlug}.md`
      const markdown = await readFile(path.join(resolvedSourceRoot, ...relativePath.split('/')), 'utf8')
      questions.push(...parseFile(markdown, { topicSlug, level, relativePath }))
    }
  }

  if (questions.length !== expectedQuestionCount) {
    fail(`expected ${expectedQuestionCount} questions, parsed ${questions.length}`)
  }

  assertNoQuestionDuplicates(questions)
  return questions
}

function createGeneratedSource(questions) {
  return `// This file is generated by scripts/import-gamestream-interview.mjs.\n// Do not edit it by hand; update content/interview/vi or interviewReviews.json, then run npm run content:import.\n\nimport type { InterviewQuestion } from '../types'\n\nexport const gameStreamInterviewQuestions = ${generatedDataMarkers.start} ${JSON.stringify(questions, null, 2)} ${generatedDataMarkers.end} satisfies InterviewQuestion[]\n`
}

function createGeneratedEnglishSource(questions) {
  return `// This file is generated by scripts/import-gamestream-interview.mjs.\n// Do not edit it by hand; update interview/en/typescript.json, then run npm run content:import.\n\nimport type { LocalizedInterviewQuestion } from '../types'\n\nexport const gameStreamInterviewEnglishQuestions = ${generatedEnglishDataMarkers.start} ${JSON.stringify(questions, null, 2)} ${generatedEnglishDataMarkers.end} satisfies LocalizedInterviewQuestion[]\n`
}

export async function buildInterviewSnapshot({ sourceRoot = defaultSourceRoot, reviewLedger } = {}) {
  const baseQuestions = await loadSourceQuestions(sourceRoot)
  const questionById = new Map(baseQuestions.map(question => [question.id, question]))
  const reviews = validateReviewLedger(reviewLedger ?? await readReviewLedger(), questionById)
  const questions = baseQuestions.map(question => {
    const review = reviews.get(question.id)
    if (!review) return { ...question, reviewStatus: 'imported-needs-review' }
    return { ...question, reviewStatus: 'reviewed', review }
  })

  return {
    questions,
    reviewedCount: reviews.size,
    generatedSource: createGeneratedSource(questions),
  }
}

export async function buildEnglishInterviewSnapshot({ baseQuestions, translations } = {}) {
  if (!baseQuestions) fail('buildEnglishInterviewSnapshot requires canonical baseQuestions')
  const resolvedTranslations = translations ?? await loadEnglishTranslations(baseQuestions)
  const baseById = new Map(baseQuestions.map(question => [question.id, question]))

  const questions = resolvedTranslations.map(translation => {
    const baseQuestion = baseById.get(translation.questionId)
    if (!baseQuestion) fail(`cannot merge unknown English translation questionId: ${translation.questionId}`)

    const localizedQuestion = {
      ...baseQuestion,
      question: translation.question,
      quickAnswer: translation.quickAnswer,
      conceptualExplanation: translation.conceptualExplanation,
      productionTradeOff: translation.productionTradeOff,
      appliedExample: { ...translation.appliedExample },
      locale: 'en',
      translatedFromHash: translation.translatedFromHash,
      translationProvenance: { ...translation.provenance },
      translationStatus: translation.translationStatus,
    }

    if (translation.translationStatus === 'reviewed') {
      localizedQuestion.translationReview = {
        ...translation.translationReview,
        evidence: translation.translationReview.evidence.map(evidence => ({ ...evidence })),
      }
    }

    return localizedQuestion
  })

  return {
    questions,
    reviewedCount: resolvedTranslations.filter(translation => translation.translationStatus === 'reviewed').length,
    generatedSource: createGeneratedEnglishSource(questions),
  }
}

export async function assertInterviewSnapshotInSync(options = {}) {
  const snapshot = await buildInterviewSnapshot(options)
  const englishSnapshot = await buildEnglishInterviewSnapshot({ baseQuestions: snapshot.questions })
  let checkedInSource
  let checkedInEnglishSource
  try {
    checkedInSource = await readFile(outputPath, 'utf8')
  } catch (error) {
    fail(`cannot read generated snapshot ${path.relative(projectRoot, outputPath)}: ${error instanceof Error ? error.message : error}`)
  }
  try {
    checkedInEnglishSource = await readFile(englishOutputPath, 'utf8')
  } catch (error) {
    fail(`cannot read generated snapshot ${path.relative(projectRoot, englishOutputPath)}: ${error instanceof Error ? error.message : error}`)
  }

  if (checkedInSource !== snapshot.generatedSource) {
    fail(`generated snapshot is stale; run npm run content:import and commit ${path.relative(projectRoot, outputPath)}`)
  }
  if (checkedInEnglishSource !== englishSnapshot.generatedSource) {
    fail(`generated English snapshot is stale; run npm run content:import and commit ${path.relative(projectRoot, englishOutputPath)}`)
  }

  return {
    ...snapshot,
    englishQuestions: englishSnapshot.questions,
    englishReviewedCount: englishSnapshot.reviewedCount,
    englishGeneratedSource: englishSnapshot.generatedSource,
  }
}

function parseArguments(args) {
  let check = false
  let hashQuestionId
  let sourceRoot

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--check') {
      if (check) fail('duplicate --check option')
      check = true
    } else if (argument === '--hash') {
      if (hashQuestionId) fail('duplicate --hash option')
      const questionId = args[index + 1]
      if (!questionId || questionId.startsWith('-')) fail('--hash requires a question ID')
      hashQuestionId = questionId
      index += 1
    } else if (argument.startsWith('-')) {
      fail(`unknown option: ${argument}`)
    } else if (sourceRoot) {
      fail('expected at most one positional source directory')
    } else {
      sourceRoot = argument
    }
  }

  if (check && hashQuestionId) fail('--check and --hash cannot be used together')
  return { check, hashQuestionId, sourceRoot: sourceRoot ? path.resolve(sourceRoot) : defaultSourceRoot }
}

async function main() {
  const { check, hashQuestionId, sourceRoot } = parseArguments(process.argv.slice(2))

  if (hashQuestionId) {
    const questions = await loadSourceQuestions(sourceRoot)
    const question = questions.find(candidate => candidate.id === hashQuestionId)
    if (!question) fail(`cannot calculate contentHash for unknown question ID: ${hashQuestionId}`)
    console.log(`${question.id} ${computeInterviewQuestionContentHash(question)}`)
    return
  }

  if (check) {
    const snapshot = await assertInterviewSnapshotInSync({ sourceRoot })
    console.log(`Snapshot is in sync with ${expectedFileCount} source files and ${snapshot.reviewedCount} review ledger entries.`)
    console.log(`English snapshot is in sync with ${snapshot.englishQuestions.length} TypeScript translations and ${snapshot.englishReviewedCount} translation reviews.`)
    console.log(`Checked ${snapshot.questions.length} Vietnamese questions and ${snapshot.englishQuestions.length} English translations without writing files.`)
    return
  }

  const snapshot = await buildInterviewSnapshot({ sourceRoot })
  const englishSnapshot = await buildEnglishInterviewSnapshot({ baseQuestions: snapshot.questions })
  await Promise.all([
    mkdir(path.dirname(outputPath), { recursive: true }),
    mkdir(path.dirname(englishOutputPath), { recursive: true }),
  ])
  await Promise.all([
    writeFile(outputPath, snapshot.generatedSource, 'utf8'),
    writeFile(englishOutputPath, englishSnapshot.generatedSource, 'utf8'),
  ])

  console.log(`Imported ${snapshot.questions.length} questions from ${expectedFileCount} files across ${topics.length} topics.`)
  console.log(`Merged ${snapshot.reviewedCount} reviewed entries from ${path.relative(projectRoot, reviewLedgerPath)}.`)
  console.log(`Generated ${path.relative(projectRoot, outputPath)}.`)
  console.log(`Imported ${englishSnapshot.questions.length} English TypeScript translations (${englishSnapshot.reviewedCount} reviewed).`)
  console.log(`Generated ${path.relative(projectRoot, englishOutputPath)}.`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
