export {
  AUTHOR_TOKEN_SESSION_KEY,
  AuthorApiError,
  formatAuthorApiError,
  generateDraftSimulation,
  generateLessonSimulation,
  generateQuestionDrafts,
  readAuthorToken,
  writeAuthorToken,
} from './aiClient'
export type {
  GenerateLessonSimulationInput,
  GenerateQuestionsInput,
  GenerateSimulationInput,
  SessionStorageAdapter,
} from './aiClient'
export {
  appendDrafts,
  AUTHOR_DRAFT_SCHEMA_VERSION,
  AUTHOR_DRAFT_STORAGE_KEY,
  clearDraftStore,
  deleteDraft,
  readDraftStore,
  replaceDrafts,
  upsertDraft,
  writeDraftStore,
} from './draftStore'
export type {
  DraftStoreEnvelope,
  DraftStoreErrorCode,
  DraftStoreFailure,
  DraftStoreMutationResult,
  DraftStoreReadResult,
  StorageAdapter,
} from './draftStore'
export { cloneDraftAsNew, createDraftFromInterviewQuestion, createEmptyDraft } from './draftFactory'
export {
  createDraftExport,
  MAX_IMPORT_DRAFT_COUNT,
  MAX_IMPORT_SOURCE_BYTES,
  parseDraftJson,
  parseGameStreamMarkdown,
} from './draftImport'
export type {
  DraftExportEnvelope,
  DraftImportResult,
  MarkdownImportDefaults,
  MarkdownImportOptions,
} from './draftImport'
export {
  findBatchDuplicateWarnings,
  findDuplicateWarnings,
  normalizeQuestionTitle,
  questionSimilarity,
} from './duplicateDetection'
export type { DuplicateWarning } from './duplicateDetection'
export { formatDraftIssues, validateQuestionDraft } from './draftValidation'
export type { DraftValidationIssue, DraftValidationResult } from './draftValidation'
export {
  canonicalQuestionContent,
  canonicalSimulationGenerationInput,
  dropStaleDraftSimulation,
  questionContentHash,
  sha256Utf8,
  simulationEditorIdentity,
  simulationGenerationInputHash,
} from './questionContentHash'
export type { SimulationGenerationInputShape, SimulationIntegrityWarning } from './questionContentHash'
export {
  canonicalLessonSimulationGenerateRequest,
  createLessonSimulationGenerateRequest,
  LESSON_SIMULATION_PROMPT_VERSION,
  lessonSimulationEditorIdentity,
  lessonSimulationGenerationInputHash,
} from './lessonSimulationGeneration'
export type {
  LessonSimulationGenerateRequest,
  LessonSimulationGenerationInput,
} from './lessonSimulationGeneration'
export {
  getLessonSimulationDraft,
  LESSON_SIMULATION_DRAFT_SCHEMA_VERSION,
  LESSON_SIMULATION_DRAFT_STORAGE_KEY,
  MAX_LESSON_SIMULATION_DRAFTS,
  readLessonSimulationDraftStore,
  removeLessonSimulationDraft,
  resetLessonSimulationDraftStore,
  upsertLessonSimulationDraft,
} from './lessonSimulationDraftStore'
export type {
  LessonSimulationDraftEntry,
  LessonSimulationDraftEnvelope,
  LessonSimulationDraftLookupResult,
  LessonSimulationDraftStoreErrorCode,
  LessonSimulationDraftStoreFailure,
  LessonSimulationDraftStoreMutationResult,
  LessonSimulationDraftStoreReadResult,
  LessonSimulationStorageAdapter,
  LessonSimulationResetStorageAdapter,
} from './lessonSimulationDraftStore'
