import type {
  InterviewReviewMetadata,
  LessonSimulationSpec,
  QuestionSimulationSpec,
  SimulationActor,
  SimulationInvariant,
  SimulationScalar,
  SimulationScenario,
  SimulationSpec,
  SimulationStateField,
  SimulationTransition,
} from '../content/types.ts'

export type SimulationValidationIssue = {
  path: string
  message: string
}

export type SimulationValidationResult<T extends SimulationSpec = SimulationSpec> =
  | { success: true; data: T; issues: [] }
  | { success: false; issues: SimulationValidationIssue[] }

const HASH_PATTERN = /^[a-f0-9]{64}$/u
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/u
const STATE_KEY_PATTERN = /^(?!__proto__$|prototype$|constructor$)[a-zA-Z][a-zA-Z0-9._:-]{0,63}$/u
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u
const DANGEROUS_MARKUP_PATTERN = /(?:<\s*\/?\s*(?:script|iframe|object|embed|style|img|svg|link|meta|form|input|button|a)\b|javascript\s*:|\bon(?:error|load|click|focus|mouseover)\s*=)/iu
const SHA256_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const

const QUESTION_ROOT_KEYS = [
  'schemaVersion',
  'id',
  'sourceQuestionId',
  'sourceContentHash',
  'locale',
  'kind',
  'learningObjective',
  'misconception',
  'takeaway',
  'actors',
  'scenarios',
  'invariants',
  'status',
  'generation',
  'review',
] as const

const LESSON_ROOT_KEYS = [
  'schemaVersion',
  'id',
  'source',
  'locale',
  'kind',
  'learningObjective',
  'misconception',
  'takeaway',
  'actors',
  'stateFields',
  'scenarios',
  'invariants',
  'status',
  'provenance',
  'review',
] as const

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function addIssue(issues: SimulationValidationIssue[], path: string, message: string) {
  issues.push({ path, message })
}

function exactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
  path: string,
  issues: SimulationValidationIssue[],
) {
  const allowedSet = new Set(allowed)
  const present = Object.keys(value)
  for (const key of present) {
    if (!allowedSet.has(key)) addIssue(issues, `${path}.${key}`, 'Trường không được hỗ trợ.')
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      addIssue(issues, `${path}.${key}`, 'Thiếu trường bắt buộc.')
    }
  }
}

function text(
  value: unknown,
  path: string,
  issues: SimulationValidationIssue[],
  options: { min?: number; max?: number } = {},
): value is string {
  const { min = 1, max = 2_000 } = options
  if (typeof value !== 'string') {
    addIssue(issues, path, 'Phải là chuỗi.')
    return false
  }
  const trimmed = value.trim()
  if (trimmed.length < min) addIssue(issues, path, 'Không được để trống.')
  if (value.length > max) addIssue(issues, path, `Không được vượt quá ${max} ký tự.`)
  if (DANGEROUS_MARKUP_PATTERN.test(value)) {
    addIssue(issues, path, 'Không chấp nhận HTML, script hoặc event handler.')
  }
  return true
}

function id(value: unknown, path: string, issues: SimulationValidationIssue[]): value is string {
  if (!text(value, path, issues, { max: 128 })) return false
  if (!ID_PATTERN.test(value)) addIssue(issues, path, 'ID không đúng định dạng an toàn.')
  return true
}

function hash(value: unknown, path: string, issues: SimulationValidationIssue[]): value is string {
  if (typeof value !== 'string' || !HASH_PATTERN.test(value)) {
    addIssue(issues, path, 'Phải là SHA-256 lowercase gồm 64 ký tự hex.')
    return false
  }
  return true
}

function scalar(value: unknown): value is SimulationScalar {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function rotateRight(value: number, count: number) {
  return (value >>> count) | (value << (32 - count))
}

function sha256Utf8(value: string) {
  const input = new TextEncoder().encode(value)
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64
  const message = new Uint8Array(paddedLength)
  message.set(input)
  message[input.length] = 0x80

  const bitLength = input.length * 8
  const view = new DataView(message.buffer)
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000), false)
  view.setUint32(paddedLength - 4, bitLength >>> 0, false)

  const digest = new Uint32Array([
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ])
  const schedule = new Uint32Array(64)

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      schedule[index] = view.getUint32(offset + index * 4, false)
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(schedule[index - 15], 7) ^ rotateRight(schedule[index - 15], 18) ^ (schedule[index - 15] >>> 3)
      const s1 = rotateRight(schedule[index - 2], 17) ^ rotateRight(schedule[index - 2], 19) ^ (schedule[index - 2] >>> 10)
      schedule[index] = (schedule[index - 16] + s0 + schedule[index - 7] + s1) >>> 0
    }

    let [a, b, c, d, e, f, g, h] = digest
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
      const choice = (e & f) ^ (~e & g)
      const temp1 = (h + sum1 + choice + SHA256_CONSTANTS[index] + schedule[index]) >>> 0
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
      const majority = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (sum0 + majority) >>> 0
      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    digest[0] = (digest[0] + a) >>> 0
    digest[1] = (digest[1] + b) >>> 0
    digest[2] = (digest[2] + c) >>> 0
    digest[3] = (digest[3] + d) >>> 0
    digest[4] = (digest[4] + e) >>> 0
    digest[5] = (digest[5] + f) >>> 0
    digest[6] = (digest[6] + g) >>> 0
    digest[7] = (digest[7] + h) >>> 0
  }

  return [...digest].map((part) => part.toString(16).padStart(8, '0')).join('')
}

function canonicalSnapshot(value: Record<string, SimulationScalar>) {
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, value[key]]),
  )
}

/**
 * Canonical review payload for a simulation.
 *
 * Array order is preserved because actor, scenario, transition, highlight and
 * invariant order affects the lesson. Snapshot keys are sorted because object
 * insertion order does not. `status` and `review` are deliberately excluded so
 * applying review metadata does not invalidate the content being attested to.
 * Every other schema field, including source binding and authored/AI provenance,
 * is serialized in an explicit order. Missing response IDs are encoded as null.
 */
export function canonicalSimulationReviewContent(spec: SimulationSpec) {
  const actors = spec.actors.map((entry) => ({
    id: entry.id,
    label: entry.label,
    role: entry.role,
    iconToken: entry.iconToken,
  }))
  const scenarios = spec.scenarios.map((entry) => ({
    id: entry.id,
    label: entry.label,
    kind: entry.kind,
    initialSnapshot: canonicalSnapshot(entry.initialSnapshot),
    transitions: entry.transitions.map((transitionEntry) => ({
      id: transitionEntry.id,
      actorId: transitionEntry.actorId,
      event: transitionEntry.event,
      explanation: transitionEntry.explanation,
      snapshot: canonicalSnapshot(transitionEntry.snapshot),
      highlights: [...transitionEntry.highlights],
    })),
    terminalState: entry.terminalState,
    terminalSummary: entry.terminalSummary,
  }))
  const invariants = spec.invariants.map((entry) => ({
    id: entry.id,
    label: entry.label,
    stateKey: entry.stateKey,
    operator: entry.operator,
    expected: entry.expected,
  }))

  if (spec.schemaVersion === 1) {
    return JSON.stringify({
      schemaVersion: spec.schemaVersion,
      id: spec.id,
      sourceQuestionId: spec.sourceQuestionId,
      sourceContentHash: spec.sourceContentHash,
      locale: spec.locale,
      kind: spec.kind,
      learningObjective: spec.learningObjective,
      misconception: spec.misconception,
      takeaway: spec.takeaway,
      actors,
      scenarios,
      invariants,
      generation: {
        model: spec.generation.model,
        promptVersion: spec.generation.promptVersion,
        generatedAt: spec.generation.generatedAt,
        responseId: spec.generation.responseId ?? null,
        inputHash: spec.generation.inputHash,
      },
    })
  }

  return JSON.stringify({
    schemaVersion: spec.schemaVersion,
    id: spec.id,
    source: {
      kind: spec.source.kind,
      slug: spec.source.slug,
      contentHash: spec.source.contentHash,
    },
    locale: spec.locale,
    kind: spec.kind,
    learningObjective: spec.learningObjective,
    misconception: spec.misconception,
    takeaway: spec.takeaway,
    actors,
    stateFields: spec.stateFields.map((entry) => ({
      key: entry.key,
      label: entry.label,
      description: entry.description,
    })),
    scenarios,
    invariants,
    provenance: spec.provenance.kind === 'authored'
      ? {
          kind: spec.provenance.kind,
          author: spec.provenance.author,
          createdAt: spec.provenance.createdAt,
        }
      : {
          kind: spec.provenance.kind,
          model: spec.provenance.model,
          promptVersion: spec.provenance.promptVersion,
          generatedAt: spec.provenance.generatedAt,
          responseId: spec.provenance.responseId ?? null,
          inputHash: spec.provenance.inputHash,
        },
  })
}

export function simulationSourceContentHash(spec: SimulationSpec) {
  return spec.schemaVersion === 1 ? spec.sourceContentHash : spec.source.contentHash
}

export function simulationReviewHash(spec: SimulationSpec) {
  return sha256Utf8(canonicalSimulationReviewContent(spec))
}

function invariantPasses(
  entry: SimulationInvariant,
  terminalSnapshot: Record<string, SimulationScalar>,
) {
  const actual = terminalSnapshot[entry.stateKey]
  if (actual === undefined) return false

  switch (entry.operator) {
    case 'eq': return actual === entry.expected
    case 'neq': return actual !== entry.expected
    case 'gte': return typeof actual === 'number' && typeof entry.expected === 'number' && actual >= entry.expected
    case 'lte': return typeof actual === 'number' && typeof entry.expected === 'number' && actual <= entry.expected
    case 'includes': return typeof actual === 'string' && typeof entry.expected === 'string' && actual.includes(entry.expected)
  }
}

function snapshot(
  value: unknown,
  path: string,
  issues: SimulationValidationIssue[],
): Record<string, SimulationScalar> | undefined {
  if (!isObject(value)) {
    addIssue(issues, path, 'Snapshot phải là object phẳng.')
    return undefined
  }
  const entries = Object.entries(value)
  if (entries.length === 0) addIssue(issues, path, 'Snapshot cần ít nhất một state key.')
  if (entries.length > 24) addIssue(issues, path, 'Snapshot chỉ hỗ trợ tối đa 24 state keys.')
  const parsed: Record<string, SimulationScalar> = {}
  for (const [key, entryValue] of entries) {
    if (!STATE_KEY_PATTERN.test(key)) {
      addIssue(issues, `${path}.${key}`, 'State key không đúng định dạng an toàn.')
      continue
    }
    if (!scalar(entryValue)) {
      addIssue(issues, `${path}.${key}`, 'State value chỉ được là string, number, boolean hoặc null.')
      continue
    }
    if (typeof entryValue === 'number' && !Number.isFinite(entryValue)) {
      addIssue(issues, `${path}.${key}`, 'Số phải hữu hạn.')
      continue
    }
    if (typeof entryValue === 'string') text(entryValue, `${path}.${key}`, issues, { min: 0, max: 500 })
    parsed[key] = entryValue
  }
  return parsed
}

function actor(value: unknown, index: number, issues: SimulationValidationIssue[]): SimulationActor | undefined {
  const path = `simulation.actors[${index}]`
  if (!isObject(value)) {
    addIssue(issues, path, 'Actor phải là object.')
    return undefined
  }
  exactKeys(value, ['id', 'label', 'role', 'iconToken'], ['id', 'label', 'role', 'iconToken'], path, issues)
  const validId = id(value.id, `${path}.id`, issues)
  text(value.label, `${path}.label`, issues, { max: 80 })
  text(value.role, `${path}.role`, issues, { max: 200 })
  const iconTokens = ['client', 'server', 'database', 'queue', 'cache', 'service', 'runtime']
  if (!iconTokens.includes(String(value.iconToken))) addIssue(issues, `${path}.iconToken`, 'Icon token không hợp lệ.')
  return validId ? value as unknown as SimulationActor : undefined
}

function transition(
  value: unknown,
  scenarioIndex: number,
  index: number,
  actorIds: Set<string>,
  expectedStateKeys: Set<string>,
  previousSnapshot: Record<string, SimulationScalar> | undefined,
  issues: SimulationValidationIssue[],
): SimulationTransition | undefined {
  const path = `simulation.scenarios[${scenarioIndex}].transitions[${index}]`
  if (!isObject(value)) {
    addIssue(issues, path, 'Transition phải là object.')
    return undefined
  }
  exactKeys(
    value,
    ['id', 'actorId', 'event', 'explanation', 'snapshot', 'highlights'],
    ['id', 'actorId', 'event', 'explanation', 'snapshot', 'highlights'],
    path,
    issues,
  )
  id(value.id, `${path}.id`, issues)
  if (!id(value.actorId, `${path}.actorId`, issues) || !actorIds.has(value.actorId)) {
    addIssue(issues, `${path}.actorId`, 'Actor reference không tồn tại.')
  }
  text(value.event, `${path}.event`, issues, { max: 180 })
  text(value.explanation, `${path}.explanation`, issues, { max: 1_000 })
  const parsedSnapshot = snapshot(value.snapshot, `${path}.snapshot`, issues)
  if (parsedSnapshot) {
    const actualKeys = new Set(Object.keys(parsedSnapshot))
    if (actualKeys.size !== expectedStateKeys.size
      || [...expectedStateKeys].some((key) => !actualKeys.has(key))) {
      addIssue(issues, `${path}.snapshot`, 'Mỗi transition phải cung cấp full snapshot với cùng state keys ban đầu.')
    }
    const changesState = previousSnapshot !== undefined
      && Object.keys(parsedSnapshot).some((key) => !Object.is(parsedSnapshot[key], previousSnapshot[key]))
    const hasHighlight = Array.isArray(value.highlights) && value.highlights.length > 0
    if (!changesState && !hasHighlight) {
      addIssue(issues, path, 'Transition phải thay đổi state hoặc highlight một actor/state key có ý nghĩa.')
    }
  }
  if (!Array.isArray(value.highlights)) {
    addIssue(issues, `${path}.highlights`, 'Highlights phải là mảng reference.')
  } else {
    if (value.highlights.length > 8) addIssue(issues, `${path}.highlights`, 'Tối đa 8 highlights.')
    const seen = new Set<string>()
    value.highlights.forEach((highlight, highlightIndex) => {
      const highlightPath = `${path}.highlights[${highlightIndex}]`
      if (typeof highlight !== 'string') {
        addIssue(issues, highlightPath, 'Highlight reference phải là chuỗi.')
        return
      }
      if (seen.has(highlight)) addIssue(issues, highlightPath, 'Highlight reference bị trùng.')
      seen.add(highlight)
      if (!actorIds.has(highlight) && !expectedStateKeys.has(highlight)) {
        addIssue(issues, highlightPath, 'Highlight phải trỏ tới actor hoặc state key tồn tại.')
      }
    })
  }
  return value as unknown as SimulationTransition
}

function scenario(
  value: unknown,
  index: number,
  actorIds: Set<string>,
  transitionIds: Set<string>,
  issues: SimulationValidationIssue[],
): SimulationScenario | undefined {
  const path = `simulation.scenarios[${index}]`
  if (!isObject(value)) {
    addIssue(issues, path, 'Scenario phải là object.')
    return undefined
  }
  exactKeys(
    value,
    ['id', 'label', 'kind', 'initialSnapshot', 'transitions', 'terminalState', 'terminalSummary'],
    ['id', 'label', 'kind', 'initialSnapshot', 'transitions', 'terminalState', 'terminalSummary'],
    path,
    issues,
  )
  id(value.id, `${path}.id`, issues)
  text(value.label, `${path}.label`, issues, { max: 100 })
  const kinds = ['happy-path', 'failure', 'what-if']
  if (!kinds.includes(String(value.kind))) addIssue(issues, `${path}.kind`, 'Scenario kind không hợp lệ.')
  const initial = snapshot(value.initialSnapshot, `${path}.initialSnapshot`, issues)
  const stateKeys = new Set(Object.keys(initial ?? {}))
  if (!Array.isArray(value.transitions)) {
    addIssue(issues, `${path}.transitions`, 'Transitions phải là mảng.')
  } else {
    if (value.transitions.length < 1 || value.transitions.length > 24) {
      addIssue(issues, `${path}.transitions`, 'Mỗi scenario cần 1 đến 24 transitions.')
    }
    let previousSnapshot = initial
    value.transitions.forEach((entry, transitionIndex) => {
      const parsed = transition(entry, index, transitionIndex, actorIds, stateKeys, previousSnapshot, issues)
      if (!parsed) return
      previousSnapshot = parsed.snapshot
      if (transitionIds.has(parsed.id)) {
        addIssue(issues, `${path}.transitions[${transitionIndex}].id`, 'Transition ID bị trùng trong simulation.')
      }
      transitionIds.add(parsed.id)
    })
  }
  const terminalStates = ['success', 'degraded', 'failed']
  if (!terminalStates.includes(String(value.terminalState))) {
    addIssue(issues, `${path}.terminalState`, 'Terminal state không hợp lệ.')
  } else if (value.kind === 'happy-path' && value.terminalState !== 'success') {
    addIssue(issues, `${path}.terminalState`, 'Happy path phải kết thúc ở success.')
  } else if (value.kind === 'failure' && value.terminalState === 'success') {
    addIssue(issues, `${path}.terminalState`, 'Failure scenario phải kết thúc ở degraded hoặc failed.')
  }
  text(value.terminalSummary, `${path}.terminalSummary`, issues, { max: 1_000 })
  return value as unknown as SimulationScenario
}

function invariant(
  value: unknown,
  index: number,
  stateKeys: Set<string>,
  issues: SimulationValidationIssue[],
): SimulationInvariant | undefined {
  const path = `simulation.invariants[${index}]`
  if (!isObject(value)) {
    addIssue(issues, path, 'Invariant phải là object.')
    return undefined
  }
  exactKeys(value, ['id', 'label', 'stateKey', 'operator', 'expected'], ['id', 'label', 'stateKey', 'operator', 'expected'], path, issues)
  id(value.id, `${path}.id`, issues)
  text(value.label, `${path}.label`, issues, { max: 180 })
  if (typeof value.stateKey !== 'string' || !stateKeys.has(value.stateKey)) {
    addIssue(issues, `${path}.stateKey`, 'Invariant phải trỏ tới state key có trong mọi scenario.')
  }
  const operators = ['eq', 'neq', 'gte', 'lte', 'includes']
  if (!operators.includes(String(value.operator))) addIssue(issues, `${path}.operator`, 'Operator không hợp lệ.')
  if (!scalar(value.expected)) {
    addIssue(issues, `${path}.expected`, 'Expected chỉ được là scalar value.')
  } else {
    if (typeof value.expected === 'number' && !Number.isFinite(value.expected)) {
      addIssue(issues, `${path}.expected`, 'Số phải hữu hạn.')
    }
    if (['gte', 'lte'].includes(String(value.operator)) && typeof value.expected !== 'number') {
      addIssue(issues, `${path}.expected`, 'Operator gte/lte yêu cầu expected là number.')
    }
    if (value.operator === 'includes' && typeof value.expected !== 'string') {
      addIssue(issues, `${path}.expected`, 'Operator includes yêu cầu expected là string.')
    }
    if (typeof value.expected === 'string') text(value.expected, `${path}.expected`, issues, { min: 0, max: 500 })
  }
  return value as unknown as SimulationInvariant
}

function stateField(
  value: unknown,
  index: number,
  issues: SimulationValidationIssue[],
): SimulationStateField | undefined {
  const path = `simulation.stateFields[${index}]`
  if (!isObject(value)) {
    addIssue(issues, path, 'State field phải là object.')
    return undefined
  }
  exactKeys(value, ['key', 'label', 'description'], ['key', 'label', 'description'], path, issues)
  if (typeof value.key !== 'string' || !STATE_KEY_PATTERN.test(value.key)) {
    addIssue(issues, `${path}.key`, 'State field key không đúng định dạng an toàn.')
  }
  text(value.label, `${path}.label`, issues, { max: 100 })
  text(value.description, `${path}.description`, issues, { max: 300 })
  return value as unknown as SimulationStateField
}

function validIsoTimestamp(value: unknown, path: string, issues: SimulationValidationIssue[]) {
  if (!text(value, path, issues, { max: 40 })
    || !ISO_DATE_PATTERN.test(String(value))
    || Number.isNaN(Date.parse(String(value)))) {
    addIssue(issues, path, 'Phải là ISO UTC timestamp hợp lệ.')
    return false
  }
  return true
}

function generationMetadata(
  value: Record<string, unknown>,
  path: string,
  issues: SimulationValidationIssue[],
  includeKind = false,
) {
  const allowed = includeKind
    ? ['kind', 'model', 'promptVersion', 'generatedAt', 'responseId', 'inputHash']
    : ['model', 'promptVersion', 'generatedAt', 'responseId', 'inputHash']
  const required = includeKind
    ? ['kind', 'model', 'promptVersion', 'generatedAt', 'inputHash']
    : ['model', 'promptVersion', 'generatedAt', 'inputHash']
  exactKeys(value, allowed, required, path, issues)
  if (includeKind && value.kind !== 'ai-generated') {
    addIssue(issues, `${path}.kind`, 'AI provenance kind phải là ai-generated.')
  }
  text(value.model, `${path}.model`, issues, { max: 120 })
  text(value.promptVersion, `${path}.promptVersion`, issues, { max: 80 })
  validIsoTimestamp(value.generatedAt, `${path}.generatedAt`, issues)
  if (value.responseId !== undefined) id(value.responseId, `${path}.responseId`, issues)
  hash(value.inputHash, `${path}.inputHash`, issues)
}

function reviewMetadata(
  value: unknown,
  path: string,
  issues: SimulationValidationIssue[],
): InterviewReviewMetadata | undefined {
  if (!isObject(value)) {
    addIssue(issues, path, 'Review metadata phải là object.')
    return undefined
  }
  exactKeys(value, ['reviewer', 'reviewedAt', 'evidence', 'contentHash'], ['reviewer', 'reviewedAt', 'evidence', 'contentHash'], path, issues)
  text(value.reviewer, `${path}.reviewer`, issues, { max: 120 })
  if (!text(value.reviewedAt, `${path}.reviewedAt`, issues, { max: 40 })
    || !ISO_DATE_PATTERN.test(String(value.reviewedAt))
    || Number.isNaN(Date.parse(String(value.reviewedAt)))) {
    addIssue(issues, `${path}.reviewedAt`, 'Phải là ISO UTC timestamp hợp lệ.')
  }
  hash(value.contentHash, `${path}.contentHash`, issues)
  if (!Array.isArray(value.evidence) || value.evidence.length < 1 || value.evidence.length > 10) {
    addIssue(issues, `${path}.evidence`, 'Reviewed simulation cần 1 đến 10 evidence entries.')
  } else {
    value.evidence.forEach((entry, index) => {
      const entryPath = `${path}.evidence[${index}]`
      if (!isObject(entry)) {
        addIssue(issues, entryPath, 'Evidence phải là object.')
        return
      }
      exactKeys(entry, ['label', 'url'], ['label', 'url'], entryPath, issues)
      text(entry.label, `${entryPath}.label`, issues, { max: 160 })
      if (!text(entry.url, `${entryPath}.url`, issues, { max: 1_000 })) return
      try {
        const url = new URL(String(entry.url))
        if (url.protocol !== 'https:') addIssue(issues, `${entryPath}.url`, 'Evidence URL phải dùng HTTPS.')
      } catch {
        addIssue(issues, `${entryPath}.url`, 'Evidence URL không hợp lệ.')
      }
    })
  }
  return value as unknown as InterviewReviewMetadata
}

export function validateSimulationSpec(input: QuestionSimulationSpec): SimulationValidationResult<QuestionSimulationSpec>
export function validateSimulationSpec(input: LessonSimulationSpec): SimulationValidationResult<LessonSimulationSpec>
export function validateSimulationSpec(input: SimulationSpec): SimulationValidationResult
export function validateSimulationSpec(input: unknown): SimulationValidationResult
export function validateSimulationSpec(input: unknown): SimulationValidationResult {
  const issues: SimulationValidationIssue[] = []
  if (!isObject(input)) {
    return { success: false, issues: [{ path: 'simulation', message: 'Simulation phải là object.' }] }
  }

  const isQuestionSpec = input.schemaVersion === 1
  const isLessonSpec = input.schemaVersion === 2
  if (isQuestionSpec) {
    exactKeys(
      input,
      QUESTION_ROOT_KEYS,
      QUESTION_ROOT_KEYS.filter((key) => key !== 'review'),
      'simulation',
      issues,
    )
  } else if (isLessonSpec) {
    exactKeys(
      input,
      LESSON_ROOT_KEYS,
      LESSON_ROOT_KEYS.filter((key) => key !== 'review'),
      'simulation',
      issues,
    )
  } else {
    addIssue(issues, 'simulation.schemaVersion', 'Chỉ hỗ trợ schemaVersion 1 hoặc 2.')
  }

  id(input.id, 'simulation.id', issues)
  if (isQuestionSpec) {
    id(input.sourceQuestionId, 'simulation.sourceQuestionId', issues)
    hash(input.sourceContentHash, 'simulation.sourceContentHash', issues)
  } else if (isLessonSpec) {
    if (!isObject(input.source)) {
      addIssue(issues, 'simulation.source', 'Lesson simulation source phải là object.')
    } else {
      exactKeys(input.source, ['kind', 'slug', 'contentHash'], ['kind', 'slug', 'contentHash'], 'simulation.source', issues)
      if (input.source.kind !== 'lesson') {
        addIssue(issues, 'simulation.source.kind', 'Lesson simulation source kind phải là lesson.')
      }
      id(input.source.slug, 'simulation.source.slug', issues)
      hash(input.source.contentHash, 'simulation.source.contentHash', issues)
    }
  }
  if (!['vi', 'en'].includes(String(input.locale))) addIssue(issues, 'simulation.locale', 'Locale phải là vi hoặc en.')
  if (!['sequence', 'flow', 'state'].includes(String(input.kind))) addIssue(issues, 'simulation.kind', 'Simulation kind không hợp lệ.')
  text(input.learningObjective, 'simulation.learningObjective', issues, { max: 500 })
  text(input.misconception, 'simulation.misconception', issues, { max: 500 })
  text(input.takeaway, 'simulation.takeaway', issues, { max: 500 })

  const actorIds = new Set<string>()
  if (!Array.isArray(input.actors)) {
    addIssue(issues, 'simulation.actors', 'Actors phải là mảng.')
  } else {
    if (input.actors.length < 2 || input.actors.length > 6) {
      addIssue(issues, 'simulation.actors', 'Simulation cần 2 đến 6 actors.')
    }
    input.actors.forEach((entry, index) => {
      const parsed = actor(entry, index, issues)
      if (!parsed) return
      if (actorIds.has(parsed.id)) addIssue(issues, `simulation.actors[${index}].id`, 'Actor ID bị trùng.')
      actorIds.add(parsed.id)
    })
  }

  const scenarios: SimulationScenario[] = []
  const scenarioIds = new Set<string>()
  const transitionIds = new Set<string>()
  if (!Array.isArray(input.scenarios)) {
    addIssue(issues, 'simulation.scenarios', 'Scenarios phải là mảng.')
  } else {
    if (input.scenarios.length < 1 || input.scenarios.length > 4) {
      addIssue(issues, 'simulation.scenarios', 'Simulation cần 1 đến 4 scenarios.')
    }
    input.scenarios.forEach((entry, index) => {
      const parsed = scenario(entry, index, actorIds, transitionIds, issues)
      if (!parsed) return
      scenarios.push(parsed)
      if (scenarioIds.has(parsed.id)) addIssue(issues, `simulation.scenarios[${index}].id`, 'Scenario ID bị trùng.')
      scenarioIds.add(parsed.id)
    })
    const happyPaths = scenarios.filter((entry) => entry.kind === 'happy-path')
    if (happyPaths.length !== 1) addIssue(issues, 'simulation.scenarios', 'Simulation phải có đúng một happy path.')
  }

  const commonStateKeys = scenarios.length > 0
    ? new Set(Object.keys(scenarios[0].initialSnapshot ?? {}).filter((key) => (
      scenarios.every((entry) => Object.prototype.hasOwnProperty.call(entry.initialSnapshot ?? {}, key))
    )))
    : new Set<string>()

  if (isLessonSpec) {
    const referenceStateKeys = scenarios.length > 0
      ? new Set(Object.keys(scenarios[0].initialSnapshot ?? {}))
      : new Set<string>()
    scenarios.forEach((entry, scenarioIndex) => {
      const scenarioStateKeys = new Set(Object.keys(entry.initialSnapshot ?? {}))
      if (scenarioStateKeys.size !== referenceStateKeys.size
        || [...referenceStateKeys].some((key) => !scenarioStateKeys.has(key))) {
        addIssue(
          issues,
          `simulation.scenarios[${scenarioIndex}].initialSnapshot`,
          'Mọi lesson scenario phải dùng cùng một tập state keys.',
        )
      }
    })

    const fieldKeys = new Set<string>()
    if (!Array.isArray(input.stateFields)) {
      addIssue(issues, 'simulation.stateFields', 'Lesson simulation cần state field metadata.')
    } else {
      if (input.stateFields.length < 1 || input.stateFields.length > 24) {
        addIssue(issues, 'simulation.stateFields', 'Lesson simulation cần 1 đến 24 state fields.')
      }
      input.stateFields.forEach((entry, index) => {
        const parsed = stateField(entry, index, issues)
        if (!parsed) return
        if (fieldKeys.has(parsed.key)) {
          addIssue(issues, `simulation.stateFields[${index}].key`, 'State field key bị trùng.')
        }
        fieldKeys.add(parsed.key)
      })
      if (fieldKeys.size !== referenceStateKeys.size
        || [...referenceStateKeys].some((key) => !fieldKeys.has(key))) {
        addIssue(
          issues,
          'simulation.stateFields',
          'State field metadata phải mô tả đúng mọi snapshot key.',
        )
      }
    }
  }

  const invariantIds = new Set<string>()
  const invariants: SimulationInvariant[] = []
  if (!Array.isArray(input.invariants)) {
    addIssue(issues, 'simulation.invariants', 'Invariants phải là mảng.')
  } else {
    if (input.invariants.length < 1 || input.invariants.length > 8) {
      addIssue(issues, 'simulation.invariants', 'Simulation cần 1 đến 8 invariants.')
    }
    input.invariants.forEach((entry, index) => {
      const parsed = invariant(entry, index, commonStateKeys, issues)
      if (!parsed) return
      invariants.push(parsed)
      if (invariantIds.has(parsed.id)) addIssue(issues, `simulation.invariants[${index}].id`, 'Invariant ID bị trùng.')
      invariantIds.add(parsed.id)
    })
  }

  const allowedStatuses = isLessonSpec
    ? ['draft-needs-review', 'generated-needs-review', 'reviewed']
    : ['generated-needs-review', 'reviewed']
  if (!allowedStatuses.includes(String(input.status))) {
    addIssue(issues, 'simulation.status', 'Review status không hợp lệ.')
  } else if (input.status !== 'reviewed' && input.review !== undefined) {
    addIssue(issues, 'simulation.review', 'Simulation chưa review không được phép có review metadata.')
  } else if (input.status === 'reviewed') {
    if (input.review === undefined) addIssue(issues, 'simulation.review', 'Reviewed simulation bắt buộc có review metadata.')
    else reviewMetadata(input.review, 'simulation.review', issues)
  }

  if (isQuestionSpec) {
    if (!isObject(input.generation)) {
      addIssue(issues, 'simulation.generation', 'Generation metadata phải là object.')
    } else {
      generationMetadata(input.generation, 'simulation.generation', issues)
    }
  } else if (isLessonSpec) {
    if (!isObject(input.provenance)) {
      addIssue(issues, 'simulation.provenance', 'Lesson simulation provenance phải là object.')
    } else if (input.provenance.kind === 'authored') {
      exactKeys(
        input.provenance,
        ['kind', 'author', 'createdAt'],
        ['kind', 'author', 'createdAt'],
        'simulation.provenance',
        issues,
      )
      text(input.provenance.author, 'simulation.provenance.author', issues, { max: 120 })
      validIsoTimestamp(input.provenance.createdAt, 'simulation.provenance.createdAt', issues)
      if (input.status === 'generated-needs-review') {
        addIssue(issues, 'simulation.status', 'Authored provenance không thể dùng generated-needs-review.')
      }
    } else if (input.provenance.kind === 'ai-generated') {
      generationMetadata(input.provenance, 'simulation.provenance', issues, true)
      if (input.status === 'draft-needs-review') {
        addIssue(issues, 'simulation.status', 'AI provenance phải dùng generated-needs-review hoặc reviewed.')
      }
    } else {
      addIssue(issues, 'simulation.provenance.kind', 'Provenance kind không hợp lệ.')
    }
  }

  if (issues.length === 0) {
    scenarios.forEach((entry, scenarioIndex) => {
      const terminalTransitionIndex = entry.transitions.length - 1
      const terminalSnapshot = entry.transitions[terminalTransitionIndex].snapshot
      if (entry.kind === 'happy-path') {
        invariants.forEach((invariantEntry) => {
          if (invariantPasses(invariantEntry, terminalSnapshot)) return
          addIssue(
            issues,
            `simulation.scenarios[${scenarioIndex}].transitions[${terminalTransitionIndex}].snapshot.${invariantEntry.stateKey}`,
            `Happy-path terminal snapshot không thỏa invariant "${invariantEntry.id}".`,
          )
        })
        return
      }
      if (entry.kind === 'failure' && invariants.every((invariantEntry) => (
        invariantPasses(invariantEntry, terminalSnapshot)
      ))) {
        addIssue(
          issues,
          `simulation.scenarios[${scenarioIndex}].transitions[${terminalTransitionIndex}].snapshot`,
          'Failure terminal snapshot phải vi phạm ít nhất một invariant để chứng minh failure bằng machine state.',
        )
      }
    })
  }

  if (issues.length === 0 && input.status === 'reviewed' && isObject(input.review)) {
    const expectedReviewHash = simulationReviewHash(input as unknown as SimulationSpec)
    if (input.review.contentHash !== expectedReviewHash) {
      addIssue(
        issues,
        'simulation.review.contentHash',
        'Review contentHash không khớp canonical simulation content hiện tại.',
      )
    }
  }

  if (issues.length > 0) return { success: false, issues }
  return { success: true, data: input as unknown as SimulationSpec, issues: [] }
}
