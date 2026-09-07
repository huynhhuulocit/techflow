import type { InterviewLevel, InterviewTopic, Locale } from './types'

export const interviewLevels: InterviewLevel[] = ['junior', 'middle', 'senior']

export const interviewLevelLabels: Record<InterviewLevel, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
}

const interviewTopicsVi: InterviewTopic[] = [
  { slug: 'docker-nginx', title: 'Docker và Nginx', description: 'Container, image, networking, reverse proxy và cách vận hành workload.', aliases: ['container', 'docker compose', 'reverse proxy'] },
  { slug: 'elasticsearch', title: 'Elasticsearch', description: 'Search engine, indexing, query, mapping và distributed search.', aliases: ['elastic', 'search', 'index'] },
  { slug: 'jwt-oauth-oidc', title: 'JWT, OAuth và OIDC', description: 'Authentication, authorization, token và identity protocol.', aliases: ['authentication', 'authorization', 'oauth2', 'openid connect'] },
  { slug: 'kafka-message-queue', title: 'Kafka và Message Queue', description: 'Event streaming, asynchronous messaging và delivery semantics.', aliases: ['message broker', 'event streaming', 'queue'] },
  { slug: 'livekit-webrtc', title: 'LiveKit và WebRTC', description: 'Realtime media, peer connection, signaling và media infrastructure.', aliases: ['rtc', 'video call', 'media'] },
  { slug: 'memory-cache', title: 'Memory Cache', description: 'In-process caching, invalidation, eviction và consistency.', aliases: ['in-memory cache', 'lru', 'cache'] },
  { slug: 'mongodb', title: 'MongoDB', description: 'Document database, schema design, indexing và transaction.', aliases: ['mongo', 'document database', 'nosql'] },
  { slug: 'nodejs-nestjs', title: 'Node.js và NestJS', description: 'JavaScript backend runtime, event loop và NestJS application structure.', aliases: ['node', 'nest', 'backend'] },
  { slug: 'redis', title: 'Redis', description: 'Data structure, distributed cache, coordination và persistence.', aliases: ['key value', 'distributed cache'] },
  { slug: 'socketio-realtime', title: 'Socket.IO và Realtime', description: 'Bidirectional communication, connection lifecycle và realtime delivery.', aliases: ['websocket', 'socket io', 'real time'] },
  { slug: 'system-design-patterns', title: 'System Design và Pattern', description: 'Architecture, scalability, reliability và production design trade-off.', aliases: ['architecture', 'design pattern', 'distributed system'] },
  { slug: 'testing-observability', title: 'Testing và Observability', description: 'Test strategy, logging, metrics, tracing và production diagnosis.', aliases: ['test', 'monitoring', 'logging', 'tracing'] },
  { slug: 'typescript', title: 'TypeScript', description: 'Type system, runtime boundary, module và maintainable application code.', aliases: ['type script', 'ts', 'static typing'] },
]

const interviewTopicsEn: InterviewTopic[] = [
  { slug: 'docker-nginx', title: 'Docker and Nginx', description: 'Containers, images, networking, reverse proxies, and workload operations.', aliases: ['container', 'docker compose', 'reverse proxy'] },
  { slug: 'elasticsearch', title: 'Elasticsearch', description: 'Search engines, indexing, queries, mappings, and distributed search.', aliases: ['elastic', 'search', 'index'] },
  { slug: 'jwt-oauth-oidc', title: 'JWT, OAuth, and OIDC', description: 'Authentication, authorization, tokens, and identity protocols.', aliases: ['authentication', 'authorization', 'oauth2', 'openid connect'] },
  { slug: 'kafka-message-queue', title: 'Kafka and Message Queues', description: 'Event streaming, asynchronous messaging, and delivery semantics.', aliases: ['message broker', 'event streaming', 'queue'] },
  { slug: 'livekit-webrtc', title: 'LiveKit and WebRTC', description: 'Realtime media, peer connections, signaling, and media infrastructure.', aliases: ['rtc', 'video call', 'media'] },
  { slug: 'memory-cache', title: 'Memory Cache', description: 'In-process caching, invalidation, eviction, and consistency.', aliases: ['in-memory cache', 'lru', 'cache'] },
  { slug: 'mongodb', title: 'MongoDB', description: 'Document databases, schema design, indexing, and transactions.', aliases: ['mongo', 'document database', 'nosql'] },
  { slug: 'nodejs-nestjs', title: 'Node.js and NestJS', description: 'The JavaScript backend runtime, event loop, and NestJS application structure.', aliases: ['node', 'nest', 'backend'] },
  { slug: 'redis', title: 'Redis', description: 'Data structures, distributed caching, coordination, and persistence.', aliases: ['key value', 'distributed cache'] },
  { slug: 'socketio-realtime', title: 'Socket.IO and Realtime', description: 'Bidirectional communication, connection lifecycles, and realtime delivery.', aliases: ['websocket', 'socket io', 'real time'] },
  { slug: 'system-design-patterns', title: 'System Design and Patterns', description: 'Architecture, scalability, reliability, and production design trade-offs.', aliases: ['architecture', 'design pattern', 'distributed system'] },
  { slug: 'testing-observability', title: 'Testing and Observability', description: 'Test strategy, logging, metrics, tracing, and production diagnosis.', aliases: ['test', 'monitoring', 'logging', 'tracing'] },
  { slug: 'typescript', title: 'TypeScript', description: 'The type system, runtime boundaries, modules, and maintainable application code.', aliases: ['type script', 'ts', 'static typing'] },
]

export const interviewTopicsByLocale: Record<Locale, InterviewTopic[]> = {
  vi: interviewTopicsVi,
  en: interviewTopicsEn,
}

/** Vietnamese remains the canonical source topic list for import tooling. */
export const interviewTopics = interviewTopicsVi

export function getInterviewTopics(locale: Locale) {
  return interviewTopicsByLocale[locale]
}

export const interviewQuestionsPerLevel = 15
export const interviewQuestionCount = interviewTopics.length * interviewLevels.length * interviewQuestionsPerLevel
export const interviewQuestionCountByLocale: Record<Locale, number> = {
  vi: interviewQuestionCount,
  en: 45,
}
