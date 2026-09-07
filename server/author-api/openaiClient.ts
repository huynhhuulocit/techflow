import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import {
  GeneratedQuestionBatchSchema,
  GeneratedSimulationSchema,
  type GeneratedQuestionBatch,
  type GeneratedSimulation,
  type QuestionGenerateRequest,
  type SimulationGenerateRequest,
} from './schemas.ts'
import {
  buildQuestionInput,
  buildQuestionInstructions,
  buildSimulationInput,
  buildSimulationInstructions,
} from './prompts.ts'

export type OpenAiConfig = {
  apiKey: string
  model: string
}

export class AiUpstreamError extends Error {
  constructor(
    message: string,
    readonly code: 'rate_limited' | 'timeout' | 'invalid_output' | 'upstream_error',
    readonly retryAfterSeconds?: number,
  ) {
    super(message)
  }
}

type ResponsesClient = Pick<OpenAI, 'responses'>

function createClient(config: OpenAiConfig): ResponsesClient {
  return new OpenAI({
    apiKey: config.apiKey,
    maxRetries: 0,
    timeout: 30_000,
  })
}

function mapUpstreamError(error: unknown): never {
  if (error instanceof OpenAI.APIError && error.status === 429) {
    const retryAfter = Number(error.headers?.get('retry-after'))
    throw new AiUpstreamError(
      'The AI provider is rate limited. Try again later.',
      'rate_limited',
      Number.isFinite(retryAfter) ? retryAfter : 30,
    )
  }

  if (error instanceof OpenAI.APIConnectionTimeoutError || (error instanceof Error && error.name === 'AbortError')) {
    throw new AiUpstreamError('The AI request timed out.', 'timeout')
  }

  if (error instanceof AiUpstreamError) throw error
  throw new AiUpstreamError('The AI provider could not complete the request.', 'upstream_error')
}

export async function generateQuestionBatch(
  config: OpenAiConfig,
  input: QuestionGenerateRequest,
  client: ResponsesClient = createClient(config),
): Promise<{ output: GeneratedQuestionBatch; responseId: string }> {
  try {
    const response = await client.responses.parse({
      model: config.model,
      instructions: buildQuestionInstructions(input.locale),
      input: buildQuestionInput(input),
      store: false,
      max_output_tokens: 5_000,
      text: { format: zodTextFormat(GeneratedQuestionBatchSchema, 'techflow_question_batch_v1') },
    })

    if (response.status !== 'completed' || !response.output_parsed) {
      throw new AiUpstreamError('The AI response was incomplete or refused.', 'invalid_output')
    }

    return { output: response.output_parsed, responseId: response.id }
  } catch (error) {
    mapUpstreamError(error)
  }
}

export async function generateSimulation(
  config: OpenAiConfig,
  input: SimulationGenerateRequest,
  client: ResponsesClient = createClient(config),
): Promise<{ output: GeneratedSimulation; responseId: string }> {
  try {
    const response = await client.responses.parse({
      model: config.model,
      instructions: buildSimulationInstructions(input.draft.locale),
      input: buildSimulationInput(input),
      store: false,
      max_output_tokens: 6_000,
      text: { format: zodTextFormat(GeneratedSimulationSchema, 'techflow_simulation_v1') },
    })

    if (response.status !== 'completed' || !response.output_parsed) {
      throw new AiUpstreamError('The AI response was incomplete or refused.', 'invalid_output')
    }

    return { output: response.output_parsed, responseId: response.id }
  } catch (error) {
    mapUpstreamError(error)
  }
}
