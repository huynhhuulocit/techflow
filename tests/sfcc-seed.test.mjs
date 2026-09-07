import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(testDirectory, '..')
const seedDirectory = path.join(projectRoot, 'content', 'interview', 'seeds', 'sfcc')
const originalSourceSha256 = 'c224029124651da3d540daf8ae5e3e0a3e5df2e33b73d5d66666aaa712ccc714'
const source = (await readFile(path.join(seedDirectory, 'tl-sfcc.md'), 'utf8'))
  .replace(/^\uFEFF/u, '')
  .replace(/\r\n?/gu, '\n')
const manifest = JSON.parse(await readFile(path.join(seedDirectory, 'manifest.json'), 'utf8'))

const sourcePrompts = [...source.matchAll(/^- `([^`]+)`\s*$/gmu)].map(match => match[1])
const sourceEvidence = [...source.matchAll(/^- \[([^\]]+)\]\((https:\/\/[^)]+)\):/gmu)]
  .map(match => ({ label: match[1], url: match[2] }))

test('preserves the SFCC source and keeps it outside the published bank', async () => {
  const sourceHash = createHash('sha256').update(source, 'utf8').digest('hex')
  const [generatedVietnamese, generatedEnglish, topicCatalog] = await Promise.all([
    readFile(path.join(projectRoot, 'src', 'content', 'generated', 'gameStreamInterview.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'content', 'generated', 'gameStreamInterview.en.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'content', 'interviewTopics.ts'), 'utf8'),
  ])

  assert.equal(manifest.schemaVersion, 1)
  assert.equal(manifest.kind, 'techflow-interview-question-seed')
  assert.equal(manifest.topicSlug, 'sfcc')
  assert.equal(manifest.originalLanguage, 'en')
  assert.equal(manifest.status, 'prompt-only-not-published')
  assert.equal(manifest.source.repository, 'hermes-agent')
  assert.equal(manifest.source.relativePath, 'hermes/skills/e/references/tl-sfcc.md')
  assert.equal(sourceHash, originalSourceSha256)
  assert.equal(manifest.source.contentSha256, originalSourceSha256)
  assert.doesNotMatch(generatedVietnamese, /"id": "sfcc-/u)
  assert.doesNotMatch(generatedEnglish, /"id": "sfcc-/u)
  assert.doesNotMatch(topicCatalog, /\bslug:\s*['"]sfcc['"]/u)
})

test('maps all 15 unique prompts to the intended TechFlow levels', () => {
  assert.equal(manifest.prompts.length, 15)
  assert.deepEqual(manifest.prompts.map(prompt => prompt.text), sourcePrompts)
  assert.equal(new Set(manifest.prompts.map(prompt => prompt.id)).size, 15)
  assert.equal(new Set(manifest.prompts.map(prompt => prompt.text)).size, 15)

  const mappings = new Map(manifest.levelMapping.map(mapping => [mapping.level, mapping]))
  const expectedCounts = { junior: 4, middle: 6, senior: 5 }

  for (const [level, expectedCount] of Object.entries(expectedCounts)) {
    const prompts = manifest.prompts.filter(prompt => prompt.level === level)
    const mapping = mappings.get(level)

    assert.ok(mapping)
    assert.equal(mapping.expectedPromptCount, expectedCount)
    assert.equal(prompts.length, expectedCount)
    assert.ok(prompts.every(prompt => prompt.sourceSection === mapping.sourceSection))
    assert.deepEqual(
      prompts.map(prompt => prompt.id),
      Array.from({ length: expectedCount }, (_, index) => `sfcc-${level}-${String(index + 1).padStart(2, '0')}`),
    )
    assert.deepEqual(prompts.map(prompt => prompt.sourcePosition), Array.from({ length: expectedCount }, (_, index) => index + 1))
  }
})

test('retains the eight official links only as candidate evidence', () => {
  assert.equal(manifest.candidateEvidence.length, 8)
  assert.deepEqual(manifest.candidateEvidence, sourceEvidence)
  assert.equal(new Set(manifest.candidateEvidence.map(evidence => evidence.url)).size, 8)

  for (const evidence of manifest.candidateEvidence) {
    assert.equal(new URL(evidence.url).protocol, 'https:')
  }
})
