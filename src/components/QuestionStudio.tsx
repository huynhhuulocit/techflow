import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Check,
  Copy,
  Database,
  Download,
  FileInput,
  FileJson,
  KeyRound,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import type {
  InterviewQuestion,
  LocalizedInterviewQuestion,
  QuestionDraft,
  SimulationKind,
} from '../content/types'
import { getInterviewTopics, interviewLevelLabels, interviewLevels } from '../content/interviewTopics'
import { useLocale } from '../i18n'
import {
  appendDrafts,
  clearDraftStore,
  cloneDraftAsNew,
  createDraftExport,
  createDraftFromInterviewQuestion,
  createEmptyDraft,
  deleteDraft,
  findBatchDuplicateWarnings,
  findDuplicateWarnings,
  formatAuthorApiError,
  formatDraftIssues,
  generateDraftSimulation,
  generateQuestionDrafts,
  MAX_IMPORT_SOURCE_BYTES,
  parseDraftJson,
  parseGameStreamMarkdown,
  questionContentHash,
  readAuthorToken,
  readDraftStore,
  simulationEditorIdentity,
  upsertDraft,
  validateQuestionDraft,
  writeAuthorToken,
  type DraftValidationIssue,
  type DraftStoreFailure,
  type SessionStorageAdapter,
  type SimulationIntegrityWarning,
  type StorageAdapter,
} from '../author'
import { SimulationPlayer } from './SimulationPlayer'
import { LocaleSwitcher } from './LocaleSwitcher'
import '../author/author.css'

type QuestionStudioSeed = InterviewQuestion | LocalizedInterviewQuestion

export type QuestionStudioProps = {
  seed?: QuestionStudioSeed | null
  onSeedConsumed?: () => void
  onBack?: () => void
  draftStorage?: StorageAdapter
  tokenStorage?: SessionStorageAdapter
}

type Notice = {
  tone: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: string[]
}

const copy = {
  vi: {
    back: 'Quay lại',
    eyebrow: 'LOCAL AUTHOR WORKSPACE',
    title: 'Question Studio',
    intro: 'Soạn, import và thử nghiệm câu hỏi dưới dạng draft. Nội dung chỉ được publish sau evidence và technical review.',
    drafts: 'Draft của bạn',
    localOnly: 'Lưu cục bộ trong browser này',
    newDraft: 'Draft mới',
    noDrafts: 'Chưa có draft đã lưu.',
    unsaved: 'Chưa lưu',
    saved: 'Đã lưu',
    aiDraft: 'AI draft · cần review',
    manualDraft: 'Manual draft · cần review',
    openDraft: 'Mở draft',
    duplicateDraft: 'Nhân bản draft',
    deleteDraft: 'Xóa draft',
    exportJson: 'Export JSON',
    importTitle: 'Import draft',
    importHelp: 'Nhận JSON array/envelope hoặc GameStream Markdown. Cả batch chỉ được lưu khi tất cả records hợp lệ.',
    importFormat: 'Định dạng',
    auto: 'Tự nhận diện',
    json: 'JSON',
    markdown: 'GameStream Markdown',
    chooseFile: 'Chọn file JSON hoặc Markdown',
    pasteImport: 'Dán nội dung import',
    importAction: 'Import atomically',
    recoveryDownload: 'Tải dữ liệu lỗi để khôi phục',
    resetStorage: 'Xóa storage lỗi và bắt đầu lại',
    storageBlocked: 'TechFlow không tự ghi đè dữ liệu storage bị lỗi.',
    metadata: 'Metadata',
    locale: 'Ngôn ngữ nội dung',
    topic: 'Topic',
    level: 'Level',
    question: 'Câu hỏi',
    quick: 'Trả lời nhanh · Conclusion',
    mechanism: 'Hiểu cơ chế · Mechanism',
    tradeoff: 'Production trade-off',
    exampleLabel: 'Nhãn ví dụ',
    example: 'Ví dụ áp dụng · GameStream',
    sourceNotes: 'Source notes',
    sourceNotesHelp: 'Ghi evidence, link hoặc giới hạn ngữ cảnh. Không nhập API key, token, dữ liệu cá nhân hay secrets.',
    save: 'Lưu draft',
    duplicateWarning: 'Cảnh báo câu hỏi trùng hoặc gần trùng',
    exact: 'Trùng chính xác',
    near: 'Gần trùng',
    aiTitle: 'AI authoring (local opt-in)',
    aiIntro: 'AI chỉ tạo draft cần review. API key ở server; Author Token chỉ được giữ trong sessionStorage của tab này.',
    authorToken: 'Author Token',
    tokenPlaceholder: 'Khớp TECHFLOW_AUTHOR_TOKEN',
    saveToken: 'Giữ token trong tab',
    clearToken: 'Xóa token',
    externalWarning: 'Tùy thao tác, external AI provider có thể nhận generation brief, source notes, tiêu đề câu hỏi hiện có, nội dung draft bốn lớp và failure scenario. Không nhập secrets hoặc dữ liệu nhạy cảm.',
    brief: 'Generation brief',
    briefPlaceholder: 'Mục tiêu, phạm vi và điều câu hỏi cần đánh giá…',
    count: 'Số draft',
    generateQuestions: 'Tạo question drafts',
    generatingQuestions: 'Đang tạo question drafts…',
    simulationTitle: 'Simulation draft',
    simulationIntro: 'Tạo một mechanism simulation từ draft hiện tại. Kết quả vẫn là AI draft và bị gỡ khi nguồn hoặc generation settings thay đổi.',
    simulationKind: 'Kiểu mô phỏng',
    failureScenario: 'Failure/what-if cần mô phỏng',
    failurePlaceholder: 'Ví dụ: cache miss, broker unavailable, token expired…',
    generateSimulation: 'Tạo simulation draft',
    generatingSimulation: 'Đang tạo simulation…',
    simulationPreview: 'Preview simulation cần review',
    simulationStale: 'Đã bỏ qua kết quả AI trả về trễ vì draft hoặc generation settings đã thay đổi. Nội dung hiện tại được giữ nguyên; hãy generate lại khi sẵn sàng.',
    validationErrors: 'Draft chưa hợp lệ',
    leaveUnsaved: 'Draft hiện tại có thay đổi chưa lưu. Bỏ các thay đổi này?',
    confirmDelete: 'Xóa draft này khỏi local storage?',
    confirmReset: 'Xóa dữ liệu storage lỗi? Hành động này không thể hoàn tác nếu bạn chưa tải bản recovery.',
    confirmDuplicateBatch: 'Batch có câu hỏi trùng hoặc gần trùng. Vẫn lưu toàn bộ batch?',
    aiDuplicateHeld: 'AI output chưa được lưu vì có duplicate. Output được giữ trong vùng Import JSON để bạn kiểm tra hoặc export.',
    importTooLarge: `File import vượt giới hạn ${Math.round(MAX_IMPORT_SOURCE_BYTES / 1024 / 1024)} MB.`,
    noImport: 'Hãy dán nội dung hoặc chọn file trước khi import.',
    loading: 'Đang đọc local drafts…',
  },
  en: {
    back: 'Back',
    eyebrow: 'LOCAL AUTHOR WORKSPACE',
    title: 'Question Studio',
    intro: 'Author, import, and test questions as drafts. Content is published only after evidence and technical review.',
    drafts: 'Your drafts',
    localOnly: 'Stored locally in this browser',
    newDraft: 'New draft',
    noDrafts: 'No saved drafts yet.',
    unsaved: 'Unsaved',
    saved: 'Saved',
    aiDraft: 'AI draft · review required',
    manualDraft: 'Manual draft · review required',
    openDraft: 'Open draft',
    duplicateDraft: 'Duplicate draft',
    deleteDraft: 'Delete draft',
    exportJson: 'Export JSON',
    importTitle: 'Import drafts',
    importHelp: 'Accepts a JSON array/envelope or GameStream Markdown. The batch is saved only when every record is valid.',
    importFormat: 'Format',
    auto: 'Auto detect',
    json: 'JSON',
    markdown: 'GameStream Markdown',
    chooseFile: 'Choose a JSON or Markdown file',
    pasteImport: 'Paste import content',
    importAction: 'Import atomically',
    recoveryDownload: 'Download corrupt data for recovery',
    resetStorage: 'Clear corrupt storage and start over',
    storageBlocked: 'TechFlow will not overwrite corrupt storage automatically.',
    metadata: 'Metadata',
    locale: 'Content language',
    topic: 'Topic',
    level: 'Level',
    question: 'Question',
    quick: 'Quick answer · Conclusion',
    mechanism: 'Conceptual explanation · Mechanism',
    tradeoff: 'Production trade-off',
    exampleLabel: 'Example label',
    example: 'Applied example · GameStream',
    sourceNotes: 'Source notes',
    sourceNotesHelp: 'Record evidence, links, or context limits. Never enter API keys, tokens, personal data, or secrets.',
    save: 'Save draft',
    duplicateWarning: 'Exact or near-duplicate warning',
    exact: 'Exact duplicate',
    near: 'Near duplicate',
    aiTitle: 'AI authoring (local opt-in)',
    aiIntro: 'AI only creates drafts that require review. The API key stays on the server; the Author Token stays in this tab sessionStorage only.',
    authorToken: 'Author Token',
    tokenPlaceholder: 'Must match TECHFLOW_AUTHOR_TOKEN',
    saveToken: 'Keep token in this tab',
    clearToken: 'Clear token',
    externalWarning: 'Depending on the action, the external AI provider may receive the generation brief, source notes, existing question titles, the four-layer draft content, and failure scenario. Do not include secrets or sensitive data.',
    brief: 'Generation brief',
    briefPlaceholder: 'Goal, scope, and what the question should assess…',
    count: 'Draft count',
    generateQuestions: 'Generate question drafts',
    generatingQuestions: 'Generating question drafts…',
    simulationTitle: 'Simulation draft',
    simulationIntro: 'Generate a mechanism simulation from the current draft. The output remains an AI draft and is removed when its source or generation settings change.',
    simulationKind: 'Simulation kind',
    failureScenario: 'Failure/what-if to simulate',
    failurePlaceholder: 'For example: cache miss, broker unavailable, token expired…',
    generateSimulation: 'Generate simulation draft',
    generatingSimulation: 'Generating simulation…',
    simulationPreview: 'Simulation preview requiring review',
    simulationStale: 'A late AI result was discarded because the draft or generation settings changed. Your current content was preserved; generate again when ready.',
    validationErrors: 'Draft is not valid',
    leaveUnsaved: 'The current draft has unsaved changes. Discard them?',
    confirmDelete: 'Delete this draft from local storage?',
    confirmReset: 'Clear the corrupt storage data? This cannot be undone unless you downloaded the recovery copy.',
    confirmDuplicateBatch: 'This batch contains exact or near duplicates. Save the entire batch anyway?',
    aiDuplicateHeld: 'AI output was not saved because duplicates were found. It is preserved in the JSON import area for review or export.',
    importTooLarge: `The import file exceeds the ${Math.round(MAX_IMPORT_SOURCE_BYTES / 1024 / 1024)} MB limit.`,
    noImport: 'Paste content or choose a file before importing.',
    loading: 'Loading local drafts…',
  },
} as const

function browserStorage(kind: 'local' | 'session') {
  if (typeof window === 'undefined') return null
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function downloadText(filename: string, value: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([value], { type: `${type};charset=utf-8` }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function draftStatus(draft: QuestionDraft, labels: typeof copy.vi | typeof copy.en) {
  return draft.reviewStatus === 'generated-needs-review' ? labels.aiDraft : labels.manualDraft
}

function withCurrentDraft(saved: readonly QuestionDraft[], current: QuestionDraft) {
  const index = saved.findIndex(draft => draft.id === current.id)
  if (index < 0) return [current, ...saved]
  const merged = [...saved]
  merged[index] = current
  return merged
}

function storageErrorMessage(failure: DraftStoreFailure, locale: 'vi' | 'en') {
  if (locale === 'vi') return failure.message
  switch (failure.code) {
    case 'corrupt-data': return 'Local draft storage is corrupt. TechFlow will not overwrite it automatically.'
    case 'unsupported-version': return 'This local draft schema version is not supported. TechFlow will not overwrite it automatically.'
    case 'quota-exceeded': return 'Local storage is full. The form draft is still available; export it or remove older drafts before retrying.'
    case 'duplicate-id': return 'A draft ID is duplicated. No data was changed.'
    case 'invalid-draft': return 'The draft does not match the supported schema. No data was changed.'
    default: return 'Local storage is unavailable. The form draft has not been saved.'
  }
}

function validationMessages(issues: DraftValidationIssue[], locale: 'vi' | 'en', limit = 12) {
  if (locale === 'vi') return formatDraftIssues(issues, limit)
  const visible = issues.slice(0, limit).map(issue => {
    let message = 'Invalid or unsupported value.'
    if (/Thiếu trường bắt buộc/u.test(issue.message)) message = 'Required field is missing.'
    else if (/Không được để trống/u.test(issue.message)) message = 'Must not be blank.'
    else if (/vượt quá/u.test(issue.message)) message = 'Exceeds the allowed length.'
    else if (/bị trùng/u.test(issue.message)) message = 'Duplicate value.'
    else if (/schemaVersion/u.test(issue.message)) message = 'Unsupported schema version.'
    return `${issue.path}: ${message}`
  })
  if (issues.length > limit) visible.push(`…and ${issues.length - limit} more errors.`)
  return visible
}

function integrityMessage(warning: SimulationIntegrityWarning, locale: 'vi' | 'en') {
  if (locale === 'vi') return warning.message
  switch (warning.code) {
    case 'source-id-mismatch': return `Draft ${warning.draftId}: simulation removed because its source ID did not match.`
    case 'locale-mismatch': return `Draft ${warning.draftId}: simulation removed because its locale did not match.`
    case 'content-hash-mismatch': return `Draft ${warning.draftId}: simulation removed because the question content changed.`
  }
}

function withoutSimulation(draft: QuestionDraft) {
  const next = { ...draft }
  delete next.simulation
  return next
}

export function QuestionStudio({
  seed,
  onSeedConsumed,
  onBack,
  draftStorage,
  tokenStorage,
}: QuestionStudioProps) {
  const { locale: uiLocale } = useLocale()
  const labels = copy[uiLocale]
  const formId = useId()
  const resolvedDraftStorage = useMemo(() => draftStorage ?? browserStorage('local'), [draftStorage])
  const resolvedTokenStorage = useMemo(() => tokenStorage ?? browserStorage('session'), [tokenStorage])
  const [drafts, setDrafts] = useState<QuestionDraft[]>([])
  const [editor, setEditor] = useState<QuestionDraft>(() => createEmptyDraft({ locale: uiLocale }))
  const [dirty, setDirty] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [storageFailure, setStorageFailure] = useState<DraftStoreFailure | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [validationDetails, setValidationDetails] = useState<string[]>([])
  const [importFormat, setImportFormat] = useState<'auto' | 'json' | 'markdown'>('auto')
  const [importSource, setImportSource] = useState('')
  const [authorToken, setAuthorToken] = useState('')
  const [generationBrief, setGenerationBrief] = useState('')
  const [generationCount, setGenerationCount] = useState(1)
  const [simulationKind, setSimulationKind] = useState<SimulationKind>('sequence')
  const [failureScenario, setFailureScenario] = useState('')
  const [questionGenerationPending, setQuestionGenerationPending] = useState(false)
  const [simulationGenerationPending, setSimulationGenerationPending] = useState(false)
  const editorRef = useRef(editor)
  const simulationKindRef = useRef(simulationKind)
  const failureScenarioRef = useRef(failureScenario)
  const initialSeedRef = useRef(seed)
  const handledSeed = useRef<string | null>(null)
  const uiLocaleRef = useRef(uiLocale)

  const replaceEditor = useCallback((next: QuestionDraft) => {
    editorRef.current = next
    setEditor(next)
  }, [])

  useEffect(() => {
    uiLocaleRef.current = uiLocale
  }, [uiLocale])

  useEffect(() => {
    if (!resolvedDraftStorage) {
      const loadLocale = uiLocaleRef.current
      setStorageFailure({
        ok: false,
        code: 'storage-unavailable',
        message: loadLocale === 'vi'
          ? 'Browser đang chặn local storage. Draft trên form vẫn dùng được nhưng chưa thể lưu.'
          : 'The browser is blocking local storage. You can edit the form, but drafts cannot be saved.',
      })
      setLoaded(true)
      return
    }

    const result = readDraftStore(resolvedDraftStorage)
    if (!result.ok) {
      setStorageFailure(result)
      setLoaded(true)
      return
    }
    setDrafts(result.value.drafts)
    // React StrictMode replays effects in development. Never let that second
    // storage read replace an initial Question Bank seed.
    if (result.value.drafts[0] && !initialSeedRef.current) replaceEditor(result.value.drafts[0])
    if (result.warnings.length) {
      const loadLocale = uiLocaleRef.current
      setNotice({
        tone: 'warning',
        message: loadLocale === 'vi'
          ? 'Đã gỡ simulation stale khi đọc local drafts.'
          : 'Stale simulations were removed while loading local drafts.',
        details: result.warnings.map(warning => integrityMessage(warning, loadLocale)),
      })
    }
    setLoaded(true)
  }, [replaceEditor, resolvedDraftStorage])

  useEffect(() => {
    if (!resolvedTokenStorage) return
    setAuthorToken(readAuthorToken(resolvedTokenStorage))
  }, [resolvedTokenStorage])

  useEffect(() => {
    if (!seed) return
    const seedKey = `${seed.id}:${questionContentHash(seed)}`
    if (handledSeed.current === seedKey) return
    handledSeed.current = seedKey
    const seededDraft = createDraftFromInterviewQuestion(seed)
    replaceEditor(seededDraft)
    setDirty(true)
    setValidationDetails([])
    setNotice({
      tone: 'info',
      message: uiLocale === 'vi'
        ? 'Đã tạo một draft chưa lưu từ Question Bank. Bản gốc không bị thay đổi.'
        : 'Created an unsaved draft from the Question Bank. The source question is unchanged.',
    })
    onSeedConsumed?.()
  }, [onSeedConsumed, replaceEditor, seed, uiLocale])

  const topics = getInterviewTopics(editor.locale)
  const duplicates = useMemo(() => findDuplicateWarnings(editor, drafts), [drafts, editor])
  const isCurrentSaved = !dirty && drafts.some(draft => draft.id === editor.id)
  const storageLocked = storageFailure?.code === 'corrupt-data' || storageFailure?.code === 'unsupported-version'
  const aiPending = questionGenerationPending || simulationGenerationPending

  const setEditorChanged = (next: QuestionDraft, simulationWasInvalidated = false) => {
    replaceEditor(next)
    setDirty(true)
    setValidationDetails([])
    if (simulationWasInvalidated) {
      setNotice({
        tone: 'warning',
        message: uiLocale === 'vi'
          ? 'Simulation đã bị gỡ vì nguồn generation của draft thay đổi. Hãy generate lại sau khi hoàn tất chỉnh sửa.'
          : 'The simulation was removed because its draft generation source changed. Generate it again after editing.',
      })
    }
  }

  const setGenerationBoundDraftChanged = (next: QuestionDraft) => {
    const hadSimulation = Boolean(editor.simulation)
    setEditorChanged(withoutSimulation(next), hadSimulation)
  }

  const changeContent = (field: 'question' | 'quickAnswer' | 'conceptualExplanation' | 'productionTradeOff', value: string) => {
    setGenerationBoundDraftChanged({
      ...editor,
      content: { ...editor.content, [field]: value },
    })
  }

  const changeExample = (field: 'label' | 'detail', value: string) => {
    setGenerationBoundDraftChanged({
      ...editor,
      content: {
        ...editor.content,
        appliedExample: { ...editor.content.appliedExample, [field]: value },
      },
    })
  }

  const chooseDraft = (draft: QuestionDraft) => {
    if (dirty && draft.id !== editor.id && !window.confirm(labels.leaveUnsaved)) return
    replaceEditor(draft)
    setDirty(false)
    setValidationDetails([])
    setNotice(null)
  }

  const startNewDraft = () => {
    if (dirty && !window.confirm(labels.leaveUnsaved)) return
    replaceEditor(createEmptyDraft({ locale: uiLocale }))
    setDirty(true)
    setValidationDetails([])
    setNotice(null)
  }

  const saveDraft = () => {
    const validation = validateQuestionDraft(editor)
    if (!validation.success) {
      setValidationDetails(validationMessages(validation.issues, uiLocale))
      setNotice({ tone: 'error', message: labels.validationErrors })
      return
    }
    if (!resolvedDraftStorage) {
      setNotice({
        tone: 'error',
        message: storageFailure ? storageErrorMessage(storageFailure, uiLocale) : (uiLocale === 'vi' ? 'Local storage không khả dụng.' : 'Local storage is unavailable.'),
      })
      return
    }
    const result = upsertDraft(resolvedDraftStorage, validation.data)
    if (!result.ok) {
      setStorageFailure(result)
      setNotice({ tone: 'error', message: storageErrorMessage(result, uiLocale) })
      return
    }
    const savedDraft = result.value.drafts.find(draft => draft.id === validation.data.id) ?? validation.data
    setDrafts(result.value.drafts)
    replaceEditor(savedDraft)
    setStorageFailure(null)
    setDirty(false)
    setNotice({
      tone: result.warnings.length ? 'warning' : 'success',
      message: result.warnings.length
        ? (uiLocale === 'vi' ? 'Draft đã lưu sau khi gỡ simulation stale.' : 'Draft saved after removing a stale simulation.')
        : (uiLocale === 'vi' ? 'Đã lưu draft vào browser.' : 'Draft saved in this browser.'),
      details: result.warnings.map(warning => integrityMessage(warning, uiLocale)),
    })
  }

  const duplicateCurrent = () => {
    const cloned = cloneDraftAsNew(editor)
    replaceEditor(cloned)
    setDirty(true)
    setValidationDetails([])
    setNotice({
      tone: 'info',
      message: uiLocale === 'vi' ? 'Đã tạo bản sao chưa lưu.' : 'Created an unsaved copy.',
    })
  }

  const removeCurrent = () => {
    const exists = drafts.some(draft => draft.id === editor.id)
    if (!exists) {
      startNewDraft()
      return
    }
    if (!window.confirm(labels.confirmDelete) || !resolvedDraftStorage) return
    const result = deleteDraft(resolvedDraftStorage, editor.id)
    if (!result.ok) {
      setStorageFailure(result)
      setNotice({ tone: 'error', message: storageErrorMessage(result, uiLocale) })
      return
    }
    setDrafts(result.value.drafts)
    replaceEditor(result.value.drafts[0] ?? createEmptyDraft({ locale: uiLocale }))
    setDirty(false)
    setNotice({ tone: 'success', message: uiLocale === 'vi' ? 'Đã xóa draft.' : 'Draft deleted.' })
  }

  const exportDrafts = () => {
    const currentValidation = validateQuestionDraft(editor)
    const exportable = currentValidation.success ? withCurrentDraft(drafts, currentValidation.data) : drafts
    const result = createDraftExport(exportable)
    if (!result.success) {
      setValidationDetails(validationMessages(result.issues, uiLocale))
      setNotice({ tone: 'error', message: labels.validationErrors })
      return
    }
    const date = new Date().toISOString().slice(0, 10)
    downloadText(`techflow-question-drafts-${date}.json`, result.json)
    setNotice({
      tone: currentValidation.success ? 'success' : 'warning',
      message: currentValidation.success
        ? (uiLocale === 'vi' ? `Đã export ${exportable.length} draft, gồm cả nội dung hợp lệ trên form.` : `Exported ${exportable.length} drafts, including valid form content.`)
        : (uiLocale === 'vi' ? 'Draft trên form chưa hợp lệ nên chỉ export các draft đã lưu.' : 'The form draft is invalid, so only saved drafts were exported.'),
    })
  }

  const importDrafts = () => {
    if (!importSource.trim()) {
      setNotice({ tone: 'error', message: labels.noImport })
      return
    }
    if (!resolvedDraftStorage || storageLocked) {
      setNotice({ tone: 'error', message: storageFailure ? storageErrorMessage(storageFailure, uiLocale) : labels.storageBlocked })
      return
    }

    const detectedFormat = importFormat === 'auto'
      ? ['[', '{'].includes(importSource.trimStart().charAt(0)) ? 'json' : 'markdown'
      : importFormat
    const parsed = detectedFormat === 'json'
      ? parseDraftJson(importSource)
      : parseGameStreamMarkdown(importSource, {
          locale: editor.locale,
          topicSlug: editor.topicSlug,
          level: editor.level,
        })

    if (!parsed.success) {
      setValidationDetails(validationMessages(parsed.issues, uiLocale))
      setNotice({
        tone: 'error',
        message: uiLocale === 'vi'
          ? 'Import thất bại. Không có dữ liệu nào được thay đổi.'
          : 'Import failed. No data was changed.',
      })
      return
    }

    const duplicateMatches = findBatchDuplicateWarnings(parsed.drafts, drafts)
    if (duplicateMatches.length > 0 && !window.confirm(labels.confirmDuplicateBatch)) {
      setNotice({
        tone: 'warning',
        message: uiLocale === 'vi'
          ? 'Đã hủy import trước khi ghi storage. Nội dung import vẫn được giữ trên form.'
          : 'Import was cancelled before storage changed. The import content remains in the form.',
      })
      return
    }
    const result = appendDrafts(resolvedDraftStorage, parsed.drafts)
    if (!result.ok) {
      setStorageFailure(result)
      setNotice({ tone: 'error', message: storageErrorMessage(result, uiLocale) })
      return
    }

    setDrafts(result.value.drafts)
    setImportSource('')
    setValidationDetails([])
    setNotice({
      tone: duplicateMatches.length || result.warnings.length ? 'warning' : 'success',
      message: uiLocale === 'vi'
        ? `Đã import atomically ${parsed.drafts.length} draft.`
        : `Atomically imported ${parsed.drafts.length} drafts.`,
      details: [
        ...result.warnings.map(warning => integrityMessage(warning, uiLocale)),
        ...duplicateMatches.slice(0, 5).map(match => uiLocale === 'vi'
          ? `${match.duplicate.kind === 'exact' ? 'Trùng' : 'Gần trùng'}: “${match.duplicate.question}”.`
          : `${match.duplicate.kind === 'exact' ? 'Duplicate' : 'Near duplicate'}: “${match.duplicate.question}”.`),
      ],
    })
  }

  const readImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (file.size > MAX_IMPORT_SOURCE_BYTES) {
        setNotice({ tone: 'error', message: labels.importTooLarge })
        return
      }
      setImportSource(await file.text())
      if (importFormat === 'auto') {
        if (file.name.toLowerCase().endsWith('.json')) setImportFormat('json')
        if (file.name.toLowerCase().endsWith('.md')) setImportFormat('markdown')
      }
    } catch {
      setNotice({
        tone: 'error',
        message: uiLocale === 'vi' ? 'Không thể đọc file đã chọn.' : 'Could not read the selected file.',
      })
    } finally {
      event.target.value = ''
    }
  }

  const resetCorruptStorage = () => {
    if (!resolvedDraftStorage || !window.confirm(labels.confirmReset)) return
    const result = clearDraftStore(resolvedDraftStorage)
    if (!result.ok) {
      setNotice({ tone: 'error', message: storageErrorMessage(result, uiLocale) })
      return
    }
    setStorageFailure(null)
    setDrafts([])
    replaceEditor(createEmptyDraft({ locale: uiLocale }))
    setDirty(true)
    setNotice({
      tone: 'success',
      message: uiLocale === 'vi' ? 'Đã xóa storage lỗi. Bạn có thể bắt đầu draft mới.' : 'Corrupt storage was cleared. You can start a new draft.',
    })
  }

  const persistAuthorToken = () => {
    if (!resolvedTokenStorage) {
      setNotice({
        tone: 'warning',
        message: uiLocale === 'vi' ? 'Session storage không khả dụng; token chỉ được giữ trong memory của form.' : 'Session storage is unavailable; the token remains in form memory only.',
      })
      return
    }
    const result = writeAuthorToken(resolvedTokenStorage, authorToken)
    setNotice(result.ok
      ? { tone: 'success', message: uiLocale === 'vi' ? 'Token chỉ được giữ trong tab hiện tại.' : 'The token is stored in this tab only.' }
      : { tone: 'warning', message: uiLocale === 'vi' ? result.message : 'Session storage is blocked. The token remains in form memory only.' })
  }

  const clearAuthorToken = () => {
    setAuthorToken('')
    if (resolvedTokenStorage) writeAuthorToken(resolvedTokenStorage, '')
    setNotice({ tone: 'info', message: uiLocale === 'vi' ? 'Đã xóa Author Token khỏi tab.' : 'Author Token cleared from this tab.' })
  }

  const requestQuestionDrafts = async () => {
    if (!resolvedDraftStorage || storageLocked) {
      setNotice({ tone: 'error', message: storageFailure ? storageErrorMessage(storageFailure, uiLocale) : labels.storageBlocked })
      return
    }
    setQuestionGenerationPending(true)
    setNotice(null)
    try {
      const result = await generateQuestionDrafts({
        locale: editor.locale,
        topicSlug: editor.topicSlug,
        level: editor.level,
        count: generationCount,
        brief: generationBrief,
        sourceNotes: editor.sourceNotes,
        avoidTitles: withCurrentDraft(drafts, editor).map(draft => draft.content.question).filter(Boolean).slice(0, 30),
      }, authorToken)
      const duplicateMatches = findBatchDuplicateWarnings(result.drafts, drafts)
      if (duplicateMatches.length > 0 && !window.confirm(labels.confirmDuplicateBatch)) {
        const portable = createDraftExport(result.drafts)
        if (portable.success) {
          setImportSource(portable.json)
          setImportFormat('json')
        }
        setNotice({
          tone: 'warning',
          message: labels.aiDuplicateHeld,
          details: duplicateMatches.slice(0, 5).map(match => `${match.duplicate.kind === 'exact' ? labels.exact : labels.near}: “${match.duplicate.question}”.`),
        })
        return
      }
      const stored = appendDrafts(resolvedDraftStorage, result.drafts)
      if (!stored.ok) {
        setStorageFailure(stored)
        setNotice({
          tone: 'error',
          message: `${storageErrorMessage(stored, uiLocale)} ${uiLocale === 'vi' ? 'AI output không thay thế draft đang mở.' : 'AI output did not replace the open draft.'}`,
        })
        return
      }
      setDrafts(stored.value.drafts)
      setNotice({
        tone: duplicateMatches.length ? 'warning' : 'success',
        message: uiLocale === 'vi'
          ? `Đã lưu ${result.drafts.length} AI draft mới. Draft đang mở không bị thay đổi.`
          : `Saved ${result.drafts.length} new AI drafts. The open draft was not changed.`,
        details: duplicateMatches.slice(0, 5).map(match => `${match.duplicate.kind === 'exact' ? labels.exact : labels.near}: “${match.duplicate.question}”.`),
      })
    } catch (error) {
      setNotice({ tone: 'error', message: formatAuthorApiError(error, uiLocale) })
    } finally {
      setQuestionGenerationPending(false)
    }
  }

  const requestSimulation = async () => {
    const validation = validateQuestionDraft(editor)
    if (!validation.success) {
      setValidationDetails(validationMessages(validation.issues, uiLocale))
      setNotice({ tone: 'error', message: labels.validationErrors })
      return
    }
    const submittedInput = {
      draft: {
        id: validation.data.id,
        locale: validation.data.locale,
        topicSlug: validation.data.topicSlug,
        level: validation.data.level,
        content: validation.data.content,
        sourceNotes: validation.data.sourceNotes,
      },
      kind: simulationKind,
      failureScenario,
    }
    const submittedEditorIdentity = simulationEditorIdentity({
      ...submittedInput,
      draft: editor,
    })
    setSimulationGenerationPending(true)
    setNotice(null)
    try {
      const { simulation } = await generateDraftSimulation(submittedInput, authorToken)
      const latestEditor = editorRef.current
      const latestEditorIdentity = simulationEditorIdentity({
        draft: latestEditor,
        kind: simulationKindRef.current,
        failureScenario: failureScenarioRef.current,
      })
      if (latestEditorIdentity !== submittedEditorIdentity) {
        setNotice({ tone: 'warning', message: copy[uiLocaleRef.current].simulationStale })
        return
      }
      replaceEditor({ ...latestEditor, simulation })
      setDirty(true)
      setNotice({
        tone: 'warning',
        message: uiLocaleRef.current === 'vi'
          ? 'Simulation AI draft đã được gắn vào form nhưng chưa lưu và chưa được review.'
          : 'The AI simulation draft is attached to the form, but it is unsaved and unreviewed.',
      })
    } catch (error) {
      setNotice({ tone: 'error', message: formatAuthorApiError(error, uiLocale) })
    } finally {
      setSimulationGenerationPending(false)
    }
  }

  return (
    <main className="question-studio">
      <header className="question-studio__header">
        <div>
          {onBack && (
            <button type="button" className="question-studio__back" onClick={() => {
              if (dirty && !window.confirm(labels.leaveUnsaved)) return
              onBack()
            }}>
              <ArrowLeft size={17} aria-hidden="true" /> {labels.back}
            </button>
          )}
          <span className="question-studio__eyebrow">{labels.eyebrow}</span>
          <h1>{labels.title}</h1>
          <p>{labels.intro}</p>
        </div>
        <div className="question-studio__header-actions">
          <LocaleSwitcher compact />
          <div className="question-studio__header-badge">
            <Database size={17} aria-hidden="true" />
            <span>{drafts.length}</span> {labels.drafts.toLowerCase()}
          </div>
        </div>
      </header>

      {!loaded && <p className="question-studio__loading" role="status">{labels.loading}</p>}

      <div className="question-studio__layout">
        <aside className="question-studio__rail" aria-labelledby={`${formId}-draft-list-title`}>
          <div className="question-studio__rail-heading">
            <div>
              <h2 id={`${formId}-draft-list-title`}>{labels.drafts}</h2>
              <p>{labels.localOnly}</p>
            </div>
            <button type="button" className="question-studio__icon-action" onClick={startNewDraft} aria-label={labels.newDraft} title={labels.newDraft}>
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="question-studio__draft-list">
            {drafts.length === 0 && <p className="question-studio__empty">{labels.noDrafts}</p>}
            {drafts.map(draft => (
              <button
                type="button"
                key={draft.id}
                className={draft.id === editor.id ? 'active' : ''}
                onClick={() => chooseDraft(draft)}
                aria-label={`${labels.openDraft}: ${draft.content.question}`}
                aria-current={draft.id === editor.id ? 'true' : undefined}
              >
                <span lang={draft.locale}>{draft.content.question || labels.newDraft}</span>
                <small>{draft.topicSlug} · {interviewLevelLabels[draft.level]}</small>
                <em>{draftStatus(draft, labels)}</em>
              </button>
            ))}
          </div>

          <div className="question-studio__rail-actions">
            <button type="button" onClick={startNewDraft}><Plus size={16} aria-hidden="true" /> {labels.newDraft}</button>
            <button type="button" onClick={exportDrafts}><Download size={16} aria-hidden="true" /> {labels.exportJson}</button>
          </div>

          <details className="question-studio__import">
            <summary><Upload size={16} aria-hidden="true" /> {labels.importTitle}</summary>
            <p>{labels.importHelp}</p>
            <label>
              {labels.importFormat}
              <select value={importFormat} onChange={event => setImportFormat(event.target.value as typeof importFormat)}>
                <option value="auto">{labels.auto}</option>
                <option value="json">{labels.json}</option>
                <option value="markdown">{labels.markdown}</option>
              </select>
            </label>
            <label className="question-studio__file-input">
              <FileInput size={16} aria-hidden="true" /> {labels.chooseFile}
              <input type="file" accept=".json,.md,application/json,text/markdown,text/plain" onChange={readImportFile} />
            </label>
            <label>
              {labels.pasteImport}
              <textarea rows={8} maxLength={MAX_IMPORT_SOURCE_BYTES} value={importSource} onChange={event => setImportSource(event.target.value)} />
            </label>
            <button type="button" className="question-studio__primary" onClick={importDrafts} disabled={storageLocked}>
              <FileJson size={16} aria-hidden="true" /> {labels.importAction}
            </button>
          </details>
        </aside>

        <section className="question-studio__workspace" aria-labelledby={`${formId}-editor-title`}>
          {storageFailure && (
            <aside className="question-studio__storage-error" role="alert">
              <AlertTriangle size={21} aria-hidden="true" />
              <div>
                <strong>{labels.storageBlocked}</strong>
                <p>{storageErrorMessage(storageFailure, uiLocale)}</p>
                {storageFailure.rawValue && (
                  <div>
                    <button type="button" onClick={() => downloadText('techflow-author-storage-recovery.txt', storageFailure.rawValue ?? '', 'text/plain')}>
                      <Download size={15} aria-hidden="true" /> {labels.recoveryDownload}
                    </button>
                    <button type="button" onClick={resetCorruptStorage}>
                      <Trash2 size={15} aria-hidden="true" /> {labels.resetStorage}
                    </button>
                  </div>
                )}
              </div>
            </aside>
          )}

          {notice && (
            <div className={`question-studio__notice question-studio__notice--${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
              {notice.tone === 'success' ? <Check size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
              <div>
                <p>{notice.message}</p>
                {notice.details && notice.details.length > 0 && <ul>{notice.details.map((detail, index) => <li key={index}>{detail}</li>)}</ul>}
              </div>
            </div>
          )}

          <form onSubmit={event => { event.preventDefault(); saveDraft() }}>
            <div className="question-studio__editor-heading">
              <div>
                <span>{isCurrentSaved ? labels.saved : labels.unsaved}</span>
                <h2 id={`${formId}-editor-title`} lang={editor.locale}>{editor.content.question || labels.newDraft}</h2>
                <code>{editor.id}</code>
              </div>
              <div>
                <button type="button" onClick={duplicateCurrent}><Copy size={16} aria-hidden="true" /> {labels.duplicateDraft}</button>
                <button type="button" className="question-studio__danger" onClick={removeCurrent}><Trash2 size={16} aria-hidden="true" /> {labels.deleteDraft}</button>
                <button type="submit" className="question-studio__primary" disabled={storageLocked}><Save size={16} aria-hidden="true" /> {labels.save}</button>
              </div>
            </div>

            <fieldset className="question-studio__meta-grid">
              <legend>{labels.metadata}</legend>
              <label>
                {labels.locale}
                <select value={editor.locale} onChange={event => {
                   const locale = event.target.value as QuestionDraft['locale']
                   const nextTopics = getInterviewTopics(locale)
                   setGenerationBoundDraftChanged({
                     ...editor,
                     locale,
                     topicSlug: nextTopics.some(topic => topic.slug === editor.topicSlug) ? editor.topicSlug : nextTopics[0].slug,
                   })
                }}>
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label>
                {labels.topic}
                <select value={editor.topicSlug} onChange={event => setGenerationBoundDraftChanged({ ...editor, topicSlug: event.target.value })}>
                  {topics.map(topic => <option key={topic.slug} value={topic.slug}>{topic.title}</option>)}
                </select>
              </label>
              <label>
                {labels.level}
                <select value={editor.level} onChange={event => setGenerationBoundDraftChanged({ ...editor, level: event.target.value as QuestionDraft['level'] })}>
                  {interviewLevels.map(level => <option key={level} value={level}>{interviewLevelLabels[level]}</option>)}
                </select>
              </label>
            </fieldset>

            <div className="question-studio__fields">
              <label>
                <span>{labels.question}<small>{editor.content.question.length}/300</small></span>
                <textarea required rows={2} maxLength={300} lang={editor.locale} value={editor.content.question} onChange={event => changeContent('question', event.target.value)} />
              </label>
              <label>
                <span>{labels.quick}<small>{editor.content.quickAnswer.length}/1200</small></span>
                <textarea required rows={4} maxLength={1200} lang={editor.locale} value={editor.content.quickAnswer} onChange={event => changeContent('quickAnswer', event.target.value)} />
              </label>
              <label>
                <span>{labels.mechanism}<small>{editor.content.conceptualExplanation.length}/2400</small></span>
                <textarea required rows={6} maxLength={2400} lang={editor.locale} value={editor.content.conceptualExplanation} onChange={event => changeContent('conceptualExplanation', event.target.value)} />
              </label>
              <label>
                <span>{labels.tradeoff}<small>{editor.content.productionTradeOff.length}/1800</small></span>
                <textarea required rows={5} maxLength={1800} lang={editor.locale} value={editor.content.productionTradeOff} onChange={event => changeContent('productionTradeOff', event.target.value)} />
              </label>
              <div className="question-studio__example-fields">
                <label>
                  <span>{labels.exampleLabel}<small>{editor.content.appliedExample.label.length}/80</small></span>
                  <input required maxLength={80} lang={editor.locale} value={editor.content.appliedExample.label} onChange={event => changeExample('label', event.target.value)} />
                </label>
                <label>
                  <span>{labels.example}<small>{editor.content.appliedExample.detail.length}/1800</small></span>
                  <textarea required rows={5} maxLength={1800} lang={editor.locale} value={editor.content.appliedExample.detail} onChange={event => changeExample('detail', event.target.value)} />
                </label>
              </div>
              <label>
                <span>{labels.sourceNotes}<small>{editor.sourceNotes.length}/8000</small></span>
                <textarea rows={5} maxLength={8000} lang={editor.locale} aria-describedby={`${formId}-source-notes-help`} value={editor.sourceNotes} onChange={event => setGenerationBoundDraftChanged({ ...editor, sourceNotes: event.target.value })} />
                <small id={`${formId}-source-notes-help`} className="question-studio__field-help">{labels.sourceNotesHelp}</small>
              </label>
            </div>

            {validationDetails.length > 0 && (
              <div className="question-studio__validation" role="alert">
                <strong>{labels.validationErrors}</strong>
                <ul>{validationDetails.map((detail, index) => <li key={index}>{detail}</li>)}</ul>
              </div>
            )}

            {duplicates.length > 0 && (
              <aside className="question-studio__duplicates" aria-label={labels.duplicateWarning}>
                <AlertTriangle size={19} aria-hidden="true" />
                <div>
                  <strong>{labels.duplicateWarning}</strong>
                  <ul>{duplicates.slice(0, 5).map(match => (
                    <li key={match.draftId}>
                      <span>{match.kind === 'exact' ? labels.exact : `${labels.near} · ${Math.round(match.similarity * 100)}%`}</span>
                      {match.question}
                    </li>
                  ))}</ul>
                </div>
              </aside>
            )}
          </form>

          <section className="question-studio__ai" aria-labelledby={`${formId}-ai-title`}>
            <header>
              <span><Bot size={20} aria-hidden="true" /></span>
              <div><h2 id={`${formId}-ai-title`}>{labels.aiTitle}</h2><p>{labels.aiIntro}</p></div>
            </header>
            <div className="question-studio__token-row">
              <label>
                {labels.authorToken}
                <input type="password" autoComplete="off" spellCheck={false} placeholder={labels.tokenPlaceholder} value={authorToken} onChange={event => setAuthorToken(event.target.value)} />
              </label>
              <button type="button" onClick={persistAuthorToken}><KeyRound size={16} aria-hidden="true" /> {labels.saveToken}</button>
              <button type="button" onClick={clearAuthorToken}>{labels.clearToken}</button>
            </div>
            <p className="question-studio__external-warning"><AlertTriangle size={17} aria-hidden="true" /> {labels.externalWarning}</p>

            <div className="question-studio__ai-grid">
              <div>
                <label>
                  {labels.brief}
                  <textarea maxLength={1000} rows={4} placeholder={labels.briefPlaceholder} value={generationBrief} onChange={event => setGenerationBrief(event.target.value)} />
                </label>
                <label>
                  {labels.count}
                  <select value={generationCount} onChange={event => setGenerationCount(Number(event.target.value))}>
                    <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
                  </select>
                </label>
                <button type="button" className="question-studio__primary" disabled={aiPending} onClick={requestQuestionDrafts}>
                  <Sparkles size={16} aria-hidden="true" /> {questionGenerationPending ? labels.generatingQuestions : labels.generateQuestions}
                </button>
              </div>
              <div>
                <h3>{labels.simulationTitle}</h3>
                <p>{labels.simulationIntro}</p>
                <label>
                  {labels.simulationKind}
                  <select value={simulationKind} onChange={event => {
                    const kind = event.target.value as SimulationKind
                    simulationKindRef.current = kind
                    setSimulationKind(kind)
                  }}>
                    <option value="sequence">Sequence</option><option value="flow">Flow</option><option value="state">State</option>
                  </select>
                </label>
                <label>
                  {labels.failureScenario}
                  <textarea maxLength={800} rows={3} placeholder={labels.failurePlaceholder} value={failureScenario} onChange={event => {
                    failureScenarioRef.current = event.target.value
                    setFailureScenario(event.target.value)
                  }} />
                </label>
                <button type="button" className="question-studio__primary" disabled={aiPending} onClick={requestSimulation}>
                  <Sparkles size={16} aria-hidden="true" /> {simulationGenerationPending ? labels.generatingSimulation : labels.generateSimulation}
                </button>
              </div>
            </div>
          </section>

          {editor.simulation && (
            <section className="question-studio__simulation-preview" aria-labelledby={`${formId}-simulation-preview`}>
              <h2 id={`${formId}-simulation-preview`}>{labels.simulationPreview}</h2>
              <div lang={editor.locale}>
                <SimulationPlayer spec={editor.simulation} />
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  )
}

export default QuestionStudio
