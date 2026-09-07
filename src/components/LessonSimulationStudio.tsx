import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bot,
  Download,
  KeyRound,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import type {
  LessonSimulationSpec,
  RichLesson,
  SimulationKind,
} from '../content/types'
import {
  lessonContentHash,
  validateLessonSimulationBinding,
} from '../content/lessonValidation'
import { validateSimulationSpec } from '../simulation'
import {
  formatAuthorApiError,
  generateLessonSimulation,
  readAuthorToken,
  writeAuthorToken,
  type SessionStorageAdapter,
} from '../author/aiClient'
import {
  createLessonSimulationGenerateRequest,
  lessonSimulationGenerationInputHash,
} from '../author/lessonSimulationGeneration'
import { SimulationPlayer } from './SimulationPlayer'
import '../author/lessonSimulationStudio.css'

export type GenerateLessonSimulationInput = {
  lesson: RichLesson
  kind: SimulationKind
  failureScenario: string
}

export type LessonSimulationGenerator = (
  input: GenerateLessonSimulationInput,
  authorToken: string,
) => Promise<{ simulation: LessonSimulationSpec; requestId?: string }>

export type LessonSimulationStudioProps = {
  lesson: RichLesson
  activeSimulation?: LessonSimulationSpec
  localOverrideActive?: boolean
  staleStoredSimulation?: LessonSimulationSpec
  onApplyLocal: (simulation: LessonSimulationSpec) => void | Promise<void>
  onRestoreRepository?: () => void | Promise<void>
  onDiscardStale?: () => void | Promise<void>
  tokenStorage?: SessionStorageAdapter | null
  generator?: LessonSimulationGenerator
  onExport?: (filename: string, contents: string) => void
  initiallyOpen?: boolean
}

type Notice = {
  tone: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: string[]
}

const copy = {
  vi: {
    eyebrow: 'LOCAL AUTHOR TOOL',
    title: 'AI Simulation Studio',
    currentRepository: 'Đang dùng bản trong repository',
    currentLocal: 'Đang dùng local override',
    noCurrent: 'Bài học chưa có simulation đang áp dụng',
    open: 'Tạo lại bằng AI',
    openEmpty: 'Tạo simulation bằng AI',
    close: 'Đóng AI Simulation Studio',
    restore: 'Khôi phục bản repository',
    restoreConfirm: 'Xác nhận xóa local override',
    restoreWarning: 'Local override sẽ bị xóa khỏi browser. Hãy Export local override trước nếu cần giữ bản recovery.',
    exportLocal: 'Export local override',
    intro: 'AI chỉ tạo preview local cần technical review. Generate không thay đổi simulation đang áp dụng.',
    disclosure: 'Lesson content, actors, mechanism và yêu cầu failure bên dưới có thể được gửi tới external AI provider. Không nhập secrets hoặc dữ liệu nhạy cảm.',
    token: 'Author Token',
    tokenPlaceholder: 'Khớp TECHFLOW_AUTHOR_TOKEN',
    saveToken: 'Giữ token trong tab',
    clearToken: 'Xóa token',
    tokenSaved: 'Author Token được giữ trong sessionStorage của tab này.',
    tokenCleared: 'Đã xóa Author Token khỏi tab.',
    kind: 'Kiểu mô phỏng',
    failure: 'Failure/what-if cần mô phỏng (không bắt buộc)',
    failurePlaceholder: 'Ví dụ: personalized HTML bị dùng lại qua shared cache…',
    generate: 'Generate preview',
    regenerate: 'Generate lại',
    generating: 'Đang generate preview…',
    generated: 'Đã tạo preview mới. Bản đang áp dụng chưa thay đổi.',
    previewEyebrow: 'AI DRAFT · GENERATED-NEEDS-REVIEW',
    previewTitle: 'Preview simulation cần review',
    previewHelp: 'Kiểm tra actors, state transitions, terminal state và invariants trước khi Apply locally.',
    settingsChanged: 'Generation settings đã thay đổi. Preview cũ vẫn được giữ để so sánh, nhưng cần Generate lại trước khi Apply hoặc Export.',
    apply: 'Apply locally',
    applied: 'Đã apply local override. Đây chưa phải nội dung đã publish hoặc technical review.',
    export: 'Export JSON',
    exported: 'Đã chuẩn bị file JSON từ preview hợp lệ.',
    discard: 'Bỏ preview',
    discarded: 'Đã bỏ preview. Simulation đang áp dụng không thay đổi.',
    restored: 'Đã khôi phục simulation từ repository.',
    stale: 'Đã bỏ qua kết quả AI trả về trễ vì lesson hoặc generation settings đã thay đổi. Preview trước đó vẫn được giữ nguyên.',
    sourceChanged: 'Lesson source hoặc locale đã thay đổi. Preview không còn đúng binding nên đã được gỡ.',
    staleStoredTitle: 'Local override đã stale',
    staleStoredBody: 'Bản local vẫn được giữ để recovery nhưng không được phát vì source lesson đã thay đổi.',
    exportStale: 'Export stale JSON',
    discardStale: 'Xóa local draft stale',
    discardStaleConfirm: 'Xác nhận xóa draft stale',
    discardStaleWarning: 'Draft stale sẽ bị xóa khỏi browser và không thể khôi phục nếu chưa Export JSON.',
    staleDiscarded: 'Đã xóa local override stale.',
    staleDiscardFailed: 'Không thể xóa local override stale.',
    invalid: 'AI output không đạt schema v2 hoặc source binding. Preview trước đó vẫn được giữ nguyên.',
    applyFailed: 'Không thể apply local override. Preview vẫn được giữ để kiểm tra hoặc export.',
    restoreFailed: 'Không thể khôi phục bản repository.',
    missingGenerator: 'Lesson simulation generator chưa sẵn sàng trong local Author API.',
    kinds: { sequence: 'Sequence', flow: 'Flow', state: 'State machine' },
  },
  en: {
    eyebrow: 'LOCAL AUTHOR TOOL',
    title: 'AI Simulation Studio',
    currentRepository: 'Using the repository version',
    currentLocal: 'Using a local override',
    noCurrent: 'This lesson has no active simulation',
    open: 'Regenerate with AI',
    openEmpty: 'Generate simulation with AI',
    close: 'Close AI Simulation Studio',
    restore: 'Restore repository version',
    restoreConfirm: 'Confirm local override deletion',
    restoreWarning: 'The local override will be deleted from this browser. Export it first if you need a recovery copy.',
    exportLocal: 'Export local override',
    intro: 'AI creates only a local preview that requires technical review. Generate does not change the active simulation.',
    disclosure: 'Lesson content, actors, mechanism, and the failure request below may be sent to an external AI provider. Do not enter secrets or sensitive data.',
    token: 'Author Token',
    tokenPlaceholder: 'Must match TECHFLOW_AUTHOR_TOKEN',
    saveToken: 'Keep token in this tab',
    clearToken: 'Clear token',
    tokenSaved: 'The Author Token is stored in this tab sessionStorage.',
    tokenCleared: 'Author Token cleared from this tab.',
    kind: 'Simulation kind',
    failure: 'Failure/what-if to simulate (optional)',
    failurePlaceholder: 'For example: personalized HTML is reused through a shared cache…',
    generate: 'Generate preview',
    regenerate: 'Regenerate',
    generating: 'Generating preview…',
    generated: 'A new preview was generated. The active simulation is unchanged.',
    previewEyebrow: 'AI DRAFT · GENERATED-NEEDS-REVIEW',
    previewTitle: 'Simulation preview requiring review',
    previewHelp: 'Check actors, state transitions, terminal states, and invariants before applying locally.',
    settingsChanged: 'Generation settings changed. The previous preview remains visible for comparison, but you must regenerate before Apply or Export.',
    apply: 'Apply locally',
    applied: 'The local override is active. It has not been published or technically reviewed.',
    export: 'Export JSON',
    exported: 'A JSON file was prepared from the valid preview.',
    discard: 'Discard preview',
    discarded: 'The preview was discarded. The active simulation is unchanged.',
    restored: 'The repository simulation was restored.',
    stale: 'A late AI result was ignored because the lesson or generation settings changed. The previous preview was preserved.',
    sourceChanged: 'The lesson source or locale changed. The preview no longer matched its binding and was removed.',
    staleStoredTitle: 'The local override is stale',
    staleStoredBody: 'The local copy is preserved for recovery but cannot play because the lesson source changed.',
    exportStale: 'Export stale JSON',
    discardStale: 'Delete stale local draft',
    discardStaleConfirm: 'Confirm stale draft deletion',
    discardStaleWarning: 'The stale draft will be deleted from this browser and cannot be recovered unless you export it first.',
    staleDiscarded: 'The stale local override was removed.',
    staleDiscardFailed: 'The stale local override could not be removed.',
    invalid: 'The AI output failed schema v2 or source-binding validation. The previous preview was preserved.',
    applyFailed: 'The local override could not be applied. The preview remains available for review or export.',
    restoreFailed: 'The repository simulation could not be restored.',
    missingGenerator: 'The lesson simulation generator is not available in the local Author API yet.',
    kinds: { sequence: 'Sequence', flow: 'Flow', state: 'State machine' },
  },
} as const

function browserSessionStorage(): SessionStorageAdapter | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function downloadJson(filename: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function safeFilenameSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/gu, '-').replace(/^-+|-+$/gu, '') || 'lesson'
}

function callbackError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? `${fallback} ${error.message}` : fallback
}

type CandidateValidation =
  | { success: true; simulation: LessonSimulationSpec }
  | { success: false; issues: string[] }

type CandidateRequest = Pick<GenerateLessonSimulationInput, 'kind' | 'failureScenario'>

type PreviewCandidate = {
  simulation: LessonSimulationSpec
  request: CandidateRequest
}

function validateCandidate(
  lesson: RichLesson,
  input: unknown,
  expectedRequest: CandidateRequest,
): CandidateValidation {
  const validation = validateSimulationSpec(input)
  if (!validation.success) {
    return {
      success: false,
      issues: validation.issues.slice(0, 8).map(issue => `${issue.path}: ${issue.message}`),
    }
  }

  const simulation = validation.data
  if (
    simulation.schemaVersion !== 2
    || simulation.status !== 'generated-needs-review'
    || simulation.provenance.kind !== 'ai-generated'
    || simulation.review !== undefined
  ) {
    return {
      success: false,
      issues: ['simulation: expected an unreviewed, AI-generated lesson simulation using schemaVersion 2.'],
    }
  }

  const generationRequest = createLessonSimulationGenerateRequest({
    lesson,
    kind: expectedRequest.kind,
    failureScenario: expectedRequest.failureScenario,
  })
  const expectedActorIds = lesson.content.actors.map(actor => actor.id)
  const generatedActorIds = simulation.actors.map(actor => actor.id)
  const actorTopologyMatches = expectedActorIds.length === generatedActorIds.length
    && expectedActorIds.every((actorId, index) => actorId === generatedActorIds[index])
  if (
    simulation.kind !== expectedRequest.kind
    || simulation.provenance.inputHash !== lessonSimulationGenerationInputHash(generationRequest)
    || !actorTopologyMatches
  ) {
    return {
      success: false,
      issues: ['simulation: kind, AI input hash, or actor topology does not match the exact generation request.'],
    }
  }

  const binding = validateLessonSimulationBinding({ ...lesson, simulation } as RichLesson)
  if (!binding.success) {
    return {
      success: false,
      issues: binding.issues.slice(0, 8).map(issue => `${issue.path}: ${issue.message}`),
    }
  }

  return { success: true, simulation }
}

function validateStaleCandidateForExport(input: unknown): CandidateValidation {
  const validation = validateSimulationSpec(input)
  if (!validation.success) {
    return {
      success: false,
      issues: validation.issues.slice(0, 8).map(issue => `${issue.path}: ${issue.message}`),
    }
  }

  const simulation = validation.data
  if (
    simulation.schemaVersion !== 2
    || simulation.status !== 'generated-needs-review'
    || simulation.provenance.kind !== 'ai-generated'
    || simulation.review !== undefined
  ) {
    return {
      success: false,
      issues: ['simulation: expected an unreviewed, AI-generated lesson simulation using schemaVersion 2.'],
    }
  }
  return { success: true, simulation }
}

function validateLocalCandidateForExport(
  lesson: RichLesson,
  input: unknown,
): CandidateValidation {
  const validation = validateStaleCandidateForExport(input)
  if (!validation.success) return validation
  const binding = validateLessonSimulationBinding({
    ...lesson,
    simulation: validation.simulation,
  } as RichLesson)
  return binding.success
    ? validation
    : {
        success: false,
        issues: binding.issues.slice(0, 8).map(issue => `${issue.path}: ${issue.message}`),
      }
}

const defaultGenerator: LessonSimulationGenerator = generateLessonSimulation

export function LessonSimulationStudio({
  lesson,
  activeSimulation,
  localOverrideActive = false,
  staleStoredSimulation,
  onApplyLocal,
  onRestoreRepository,
  onDiscardStale,
  tokenStorage,
  generator = defaultGenerator,
  onExport,
  initiallyOpen = false,
}: LessonSimulationStudioProps) {
  const labels = copy[lesson.locale]
  const instanceId = useId()
  const regionId = `${instanceId}-panel`
  const tokenId = `${instanceId}-token`
  const kindId = `${instanceId}-kind`
  const failureId = `${instanceId}-failure`
  const resolvedTokenStorage = useMemo(
    () => tokenStorage === undefined ? browserSessionStorage() : tokenStorage,
    [tokenStorage],
  )
  const [open, setOpen] = useState(initiallyOpen)
  const [authorToken, setAuthorToken] = useState(() => (
    resolvedTokenStorage ? readAuthorToken(resolvedTokenStorage) : ''
  ))
  const [kind, setKind] = useState<SimulationKind>(activeSimulation?.kind ?? 'flow')
  const [failureScenario, setFailureScenario] = useState('')
  const [candidate, setCandidate] = useState<PreviewCandidate | null>(null)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [restoreConfirmation, setRestoreConfirmation] = useState(false)
  const [staleDiscardConfirmation, setStaleDiscardConfirmation] = useState(false)
  const requestSequenceRef = useRef(0)
  const generationSettingsRevisionRef = useRef(0)
  const sourceIdentity = `${lesson.locale}:${lesson.slug}:${lessonContentHash(lesson)}`
  const previousSourceIdentityRef = useRef(sourceIdentity)
  const previewHeadingRef = useRef<HTMLHeadingElement>(null)
  const generateButtonRef = useRef<HTMLButtonElement>(null)
  const studioToggleButtonRef = useRef<HTMLButtonElement>(null)
  const candidateMatchesCurrentSettings = !candidate
    || (candidate.request.kind === kind
      && candidate.request.failureScenario === failureScenario.trim())

  useEffect(() => {
    if (previousSourceIdentityRef.current !== sourceIdentity) {
      requestSequenceRef.current += 1
      generationSettingsRevisionRef.current += 1
      setPending(false)
      setCandidate(null)
      setNotice({ tone: 'warning', message: labels.sourceChanged })
      setKind(activeSimulation?.kind ?? 'flow')
      setFailureScenario('')
      setRestoreConfirmation(false)
      setStaleDiscardConfirmation(false)
    }
    previousSourceIdentityRef.current = sourceIdentity
  }, [activeSimulation?.kind, labels.sourceChanged, sourceIdentity])

  useEffect(() => {
    if (!candidate) return
    previewHeadingRef.current?.focus()
  }, [candidate])

  const saveToken = () => {
    if (!resolvedTokenStorage) {
      setNotice({
        tone: 'warning',
        message: lesson.locale === 'vi'
          ? 'Browser đang chặn sessionStorage. Token chỉ được giữ trong ô nhập hiện tại.'
          : 'The browser is blocking sessionStorage. The token remains only in the current input.',
      })
      return
    }
    const result = writeAuthorToken(resolvedTokenStorage, authorToken)
    setNotice(result.ok
      ? { tone: 'success', message: labels.tokenSaved }
      : { tone: 'warning', message: result.message })
  }

  const clearToken = () => {
    setAuthorToken('')
    if (resolvedTokenStorage) writeAuthorToken(resolvedTokenStorage, '')
    setNotice({ tone: 'info', message: labels.tokenCleared })
  }

  const handleGenerate = async () => {
    if (!generator) {
      setNotice({ tone: 'error', message: labels.missingGenerator })
      return
    }

    const requestSettingsRevision = generationSettingsRevisionRef.current
    const requestSequence = requestSequenceRef.current + 1
    requestSequenceRef.current = requestSequence
    setPending(true)
    setNotice(null)

    try {
      const candidateRequest = {
        kind,
        failureScenario: failureScenario.trim(),
      } satisfies CandidateRequest
      const result = await generator({
        lesson,
        ...candidateRequest,
      }, authorToken)

      if (
        requestSequenceRef.current !== requestSequence
        || generationSettingsRevisionRef.current !== requestSettingsRevision
      ) {
        setNotice({ tone: 'warning', message: labels.stale })
        return
      }

      const validation = validateCandidate(lesson, result.simulation, candidateRequest)
      if (!validation.success) {
        setNotice({ tone: 'error', message: labels.invalid, details: validation.issues })
        return
      }

      setCandidate({ simulation: validation.simulation, request: candidateRequest })
      setNotice({ tone: 'success', message: labels.generated })
    } catch (error) {
      if (requestSequenceRef.current !== requestSequence) return
      if (generationSettingsRevisionRef.current !== requestSettingsRevision) {
        setNotice({ tone: 'warning', message: labels.stale })
        return
      }
      setNotice({ tone: 'error', message: formatAuthorApiError(error, lesson.locale) })
    } finally {
      if (requestSequenceRef.current === requestSequence) setPending(false)
    }
  }

  const handleApply = async () => {
    if (!candidate) return
    if (!candidateMatchesCurrentSettings) {
      setNotice({ tone: 'warning', message: labels.settingsChanged })
      return
    }
    const validation = validateCandidate(lesson, candidate.simulation, candidate.request)
    if (!validation.success) {
      setNotice({ tone: 'error', message: labels.invalid, details: validation.issues })
      return
    }
    try {
      await onApplyLocal(validation.simulation)
      setNotice({ tone: 'success', message: labels.applied })
    } catch (error) {
      setNotice({ tone: 'error', message: callbackError(error, labels.applyFailed) })
    }
  }

  const handleRestore = async () => {
    if (!onRestoreRepository) return
    try {
      await onRestoreRepository()
      setRestoreConfirmation(false)
      setNotice({ tone: 'success', message: labels.restored })
      globalThis.setTimeout(() => studioToggleButtonRef.current?.focus(), 0)
    } catch (error) {
      setNotice({ tone: 'error', message: callbackError(error, labels.restoreFailed) })
    }
  }

  const handleExport = () => {
    if (!candidate) return
    if (!candidateMatchesCurrentSettings) {
      setNotice({ tone: 'warning', message: labels.settingsChanged })
      return
    }
    const validation = validateCandidate(lesson, candidate.simulation, candidate.request)
    if (!validation.success) {
      setNotice({ tone: 'error', message: labels.invalid, details: validation.issues })
      return
    }

    const filename = `techflow-${safeFilenameSegment(lesson.slug)}-${lesson.locale}-simulation.json`
    const contents = `${JSON.stringify(validation.simulation, null, 2)}\n`
    if (onExport) onExport(filename, contents)
    else downloadJson(filename, contents)
    setNotice({ tone: 'success', message: labels.exported })
  }

  const handleDiscard = () => {
    requestSequenceRef.current += 1
    setPending(false)
    setCandidate(null)
    setNotice({ tone: 'info', message: labels.discarded })
    globalThis.setTimeout(() => generateButtonRef.current?.focus(), 0)
  }

  const handleExportStale = () => {
    if (!staleStoredSimulation) return
    const validation = validateStaleCandidateForExport(staleStoredSimulation)
    if (!validation.success) {
      setNotice({ tone: 'error', message: labels.invalid, details: validation.issues })
      return
    }
    const filename = `techflow-${safeFilenameSegment(validation.simulation.source.slug)}-${validation.simulation.locale}-stale-simulation.json`
    const contents = `${JSON.stringify(validation.simulation, null, 2)}\n`
    if (onExport) onExport(filename, contents)
    else downloadJson(filename, contents)
    setNotice({ tone: 'success', message: labels.exported })
  }

  const handleExportLocal = () => {
    if (!localOverrideActive || !activeSimulation) return
    const validation = validateLocalCandidateForExport(lesson, activeSimulation)
    if (!validation.success) {
      setNotice({ tone: 'error', message: labels.invalid, details: validation.issues })
      return
    }
    const filename = `techflow-${safeFilenameSegment(lesson.slug)}-${lesson.locale}-local-simulation.json`
    const contents = `${JSON.stringify(validation.simulation, null, 2)}\n`
    if (onExport) onExport(filename, contents)
    else downloadJson(filename, contents)
    setNotice({ tone: 'success', message: labels.exported })
  }

  const requestRestore = async () => {
    if (!restoreConfirmation) {
      setRestoreConfirmation(true)
      setNotice({ tone: 'warning', message: labels.restoreWarning })
      return
    }
    await handleRestore()
  }

  const handleDiscardStale = async () => {
    if (!onDiscardStale) return
    if (!staleDiscardConfirmation) {
      setStaleDiscardConfirmation(true)
      setNotice({ tone: 'warning', message: labels.discardStaleWarning })
      return
    }
    try {
      await onDiscardStale()
      setStaleDiscardConfirmation(false)
      setNotice({ tone: 'info', message: labels.staleDiscarded })
      globalThis.setTimeout(() => studioToggleButtonRef.current?.focus(), 0)
    } catch (error) {
      setNotice({ tone: 'error', message: callbackError(error, labels.staleDiscardFailed) })
    }
  }

  const currentLabel = staleStoredSimulation
    ? labels.staleStoredTitle
    : localOverrideActive
      ? labels.currentLocal
      : activeSimulation
        ? labels.currentRepository
        : labels.noCurrent

  return (
    <section className="lesson-simulation-studio" aria-labelledby={`${instanceId}-title`}>
      <header className="lesson-simulation-studio__toolbar">
        <div>
          <span className="lesson-simulation-studio__eyebrow"><Bot size={14} aria-hidden="true" /> {labels.eyebrow}</span>
          <h2 id={`${instanceId}-title`}>{labels.title}</h2>
          <p>{currentLabel}</p>
        </div>
        <div className="lesson-simulation-studio__toolbar-actions">
          {localOverrideActive && onRestoreRepository && (
            <>
              <button type="button" className="lesson-simulation-studio__secondary" onClick={handleExportLocal}>
                <Download size={16} aria-hidden="true" /> {labels.exportLocal}
              </button>
              <button type="button" className="lesson-simulation-studio__secondary" onClick={requestRestore}>
                <RotateCcw size={16} aria-hidden="true" /> {restoreConfirmation ? labels.restoreConfirm : labels.restore}
              </button>
            </>
          )}
          <button
            ref={studioToggleButtonRef}
            type="button"
            className="lesson-simulation-studio__primary"
            aria-expanded={open}
            aria-controls={regionId}
            onClick={() => setOpen(value => !value)}
          >
            {open ? <X size={16} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            {open ? labels.close : activeSimulation ? labels.open : labels.openEmpty}
          </button>
        </div>
      </header>

      {notice && (
        <div
          className={`lesson-simulation-studio__notice lesson-simulation-studio__notice--${notice.tone}`}
          role={notice.tone === 'error' ? 'alert' : 'status'}
          aria-live={notice.tone === 'error' ? 'assertive' : 'polite'}
        >
          <p>{notice.message}</p>
          {notice.details?.length ? (
            <ul>{notice.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
          ) : null}
        </div>
      )}

      {open && (
        <div id={regionId} className="lesson-simulation-studio__panel" aria-busy={pending}>
          <p className="lesson-simulation-studio__intro">{labels.intro}</p>
          <p className="lesson-simulation-studio__disclosure">
            <AlertTriangle size={17} aria-hidden="true" />
            <span>{labels.disclosure}</span>
          </p>

          <div className="lesson-simulation-studio__token-row">
            <label htmlFor={tokenId}>
              {labels.token}
              <input
                id={tokenId}
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={labels.tokenPlaceholder}
                value={authorToken}
                onChange={event => setAuthorToken(event.target.value)}
              />
            </label>
            <button type="button" className="lesson-simulation-studio__secondary" onClick={saveToken}>
              <KeyRound size={16} aria-hidden="true" /> {labels.saveToken}
            </button>
            <button type="button" className="lesson-simulation-studio__quiet" onClick={clearToken}>{labels.clearToken}</button>
          </div>

          <div className="lesson-simulation-studio__settings">
            <label htmlFor={kindId}>
              {labels.kind}
              <select
                id={kindId}
                value={kind}
                onChange={event => {
                  generationSettingsRevisionRef.current += 1
                  setKind(event.target.value as SimulationKind)
                }}
              >
                {(['sequence', 'flow', 'state'] as const).map(value => (
                  <option key={value} value={value}>{labels.kinds[value]}</option>
                ))}
              </select>
            </label>
            <label htmlFor={failureId}>
              {labels.failure}
              <textarea
                id={failureId}
                rows={3}
                maxLength={800}
                placeholder={labels.failurePlaceholder}
                value={failureScenario}
                onChange={event => {
                  generationSettingsRevisionRef.current += 1
                  setFailureScenario(event.target.value)
                }}
              />
            </label>
          </div>

          <button
            ref={generateButtonRef}
            type="button"
            className="lesson-simulation-studio__primary lesson-simulation-studio__generate"
            disabled={pending}
            onClick={handleGenerate}
          >
            <Sparkles size={17} aria-hidden="true" />
            {pending ? labels.generating : candidate ? labels.regenerate : labels.generate}
          </button>

          {staleStoredSimulation && (
            <section className="lesson-simulation-studio__stale" aria-labelledby={`${instanceId}-stale-title`}>
              <AlertTriangle size={19} aria-hidden="true" />
              <div>
                <h3 id={`${instanceId}-stale-title`}>{labels.staleStoredTitle}</h3>
                <p>{labels.staleStoredBody}</p>
                <div>
                  <button type="button" className="lesson-simulation-studio__secondary" onClick={handleExportStale}>
                    <Download size={16} aria-hidden="true" /> {labels.exportStale}
                  </button>
                  {onDiscardStale && (
                    <button type="button" className="lesson-simulation-studio__quiet lesson-simulation-studio__danger" onClick={handleDiscardStale}>
                      <Trash2 size={16} aria-hidden="true" /> {staleDiscardConfirmation ? labels.discardStaleConfirm : labels.discardStale}
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {candidate && (
            <section className="lesson-simulation-studio__preview" aria-labelledby={`${instanceId}-preview-title`}>
              <header>
                <div>
                  <span>{labels.previewEyebrow}</span>
                  <h3 id={`${instanceId}-preview-title`} ref={previewHeadingRef} tabIndex={-1}>{labels.previewTitle}</h3>
                  <p>{labels.previewHelp}</p>
                </div>
              </header>

              {!candidateMatchesCurrentSettings && (
                <div className="lesson-simulation-studio__notice lesson-simulation-studio__notice--warning" role="status">
                  <p>{labels.settingsChanged}</p>
                </div>
              )}

              <SimulationPlayer spec={candidate.simulation} />

              <div className="lesson-simulation-studio__preview-actions">
                <button type="button" className="lesson-simulation-studio__primary" disabled={!candidateMatchesCurrentSettings} onClick={handleApply}>
                  {labels.apply}
                </button>
                <button type="button" className="lesson-simulation-studio__secondary" disabled={pending} onClick={handleGenerate}>
                  <Sparkles size={16} aria-hidden="true" /> {pending ? labels.generating : labels.regenerate}
                </button>
                <button type="button" className="lesson-simulation-studio__secondary" disabled={!candidateMatchesCurrentSettings} onClick={handleExport}>
                  <Download size={16} aria-hidden="true" /> {labels.export}
                </button>
                <button type="button" className="lesson-simulation-studio__quiet lesson-simulation-studio__danger" onClick={handleDiscard}>
                  <Trash2 size={16} aria-hidden="true" /> {labels.discard}
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  )
}

export default LessonSimulationStudio
