import { getLessons } from '../content/lessons'
import type { Locale, SearchRelation, SearchResult } from '../content/types'

const stopWordsByLocale: Record<Locale, Set<string>> = {
  vi: new Set(['va', 'voi', 'la', 'co', 'nhu', 'the', 'nao', 'gi', 'lien', 'quan', 'hoat', 'dong', 'toi', 'muon', 'hieu']),
  en: new Set(['and', 'how', 'does', 'do', 'what', 'is', 'are', 'related', 'to', 'the', 'a', 'an', 'of', 'for', 'in']),
}

const conceptAliasesByLocale: Record<Locale, Record<string, string[]>> = {
  vi: {
    sfcc: ['sfcc', 'salesforce commerce cloud', 'b2c commerce', 'commerce cloud'],
    pwa: ['pwa', 'pwa kit', 'progressive web app'],
    typescript: ['typescript', 'type script', 'ts'],
  },
  en: {
    sfcc: ['sfcc', 'salesforce commerce cloud', 'b2c commerce', 'commerce cloud'],
    pwa: ['pwa', 'pwa kit', 'progressive web app'],
    typescript: ['typescript', 'type script', 'ts'],
  },
}

const relationsByLocale: Record<Locale, SearchRelation> = {
  vi: {
    concepts: ['SFCC', 'PWA Kit', 'TypeScript'],
    title: 'SFCC, PWA Kit và TypeScript nằm ở ba lớp khác nhau của cùng storefront',
    summary: 'SFCC/B2C Commerce giữ dữ liệu và nghiệp vụ thương mại. PWA Kit là framework React dùng để xây storefront composable, gọi dữ liệu từ SFCC qua Commerce API. TypeScript là ngôn ngữ có thể dùng trong PWA Kit để kiểm tra kiểu cho component, state và dữ liệu API. Vì vậy: SFCC là commerce backend, PWA Kit là lớp ứng dụng storefront, còn TypeScript giúp triển khai lớp storefront an toàn và dễ bảo trì hơn.',
    connections: [
      { from: 'Người mua', to: 'PWA Kit', label: 'Mở storefront' },
      { from: 'TypeScript', to: 'PWA Kit', label: 'Xây component và data layer' },
      { from: 'PWA Kit', to: 'SFCC', label: 'Gọi SCAPI' },
    ],
    suggestions: [
      'SFRA và PWA Kit khác nhau như thế nào?',
      'Luồng request từ PWA Kit đến SCAPI diễn ra ra sao?',
      'Nên tổ chức TypeScript types cho dữ liệu sản phẩm SFCC thế nào?',
      'SSR và hydration trong PWA Kit hoạt động như thế nào?',
    ],
  },
  en: {
    concepts: ['SFCC', 'PWA Kit', 'TypeScript'],
    title: 'SFCC, PWA Kit, and TypeScript occupy three layers of one storefront',
    summary: 'SFCC/B2C Commerce owns commerce data and business capabilities. PWA Kit is the React framework used to build a composable storefront that calls SFCC through Commerce APIs. TypeScript can be used within PWA Kit to type components, state, and API data. In short: SFCC is the commerce backend, PWA Kit is the storefront application layer, and TypeScript makes that layer safer to implement and maintain.',
    connections: [
      { from: 'Shopper', to: 'PWA Kit', label: 'Opens storefront' },
      { from: 'TypeScript', to: 'PWA Kit', label: 'Builds components and data layer' },
      { from: 'PWA Kit', to: 'SFCC', label: 'Calls SCAPI' },
    ],
    suggestions: [
      'How do SFRA and PWA Kit differ?',
      'How does a request travel from PWA Kit to SCAPI?',
      'How should TypeScript types for SFCC product data be organized?',
      'How do SSR and hydration work in PWA Kit?',
    ],
  },
}

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/gu, '')
  .replace(/đ/giu, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/gu, ' ')
  .replace(/\s+/gu, ' ')
  .trim()

function tokens(value: string, locale: Locale) {
  return normalize(value)
    .split(' ')
    .filter(token => token.length > 1 && !stopWordsByLocale[locale].has(token))
}

function distance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i++) {
    let previous = row[0]
    row[0] = i
    for (let j = 1; j <= right.length; j++) {
      const current = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1))
      previous = current
    }
  }
  return row[right.length]
}

const matches = (field: string, term: string) => field.includes(term)
  || (term.length >= 5 && field.split(' ').some(word => Math.abs(word.length - term.length) <= 2 && distance(word, term) <= 2))

function detectConcepts(query: string, locale: Locale) {
  const normalized = normalize(query)
  const queryTokens = tokens(normalized, locale)

  return Object.entries(conceptAliasesByLocale[locale])
    .filter(([, aliases]) => aliases.some(alias => normalized.includes(alias) || queryTokens.some(term => matches(alias, term))))
    .map(([concept]) => concept)
}

export function searchKnowledge(query: string, locale: Locale = 'vi'): {
  results: SearchResult[]
  relation: SearchRelation | null
} {
  const queryTokens = [...new Set(tokens(query, locale))]
  if (!queryTokens.length) return { results: [], relation: null }

  const results = getLessons(locale).map(lesson => {
    const fields = {
      title: normalize(lesson.title),
      tags: normalize(lesson.tags.join(' ')),
      aliases: normalize(lesson.search.aliases.join(' ')),
      concepts: normalize(lesson.search.concepts.join(' ')),
      body: normalize(`${lesson.shortAnswer} ${lesson.category}`),
    }
    const matchedTerms = queryTokens.filter(term => Object.values(fields).some(field => matches(field, term)))
    const score = queryTokens.reduce((total, term) => total
      + (matches(fields.title, term) ? 8 : 0)
      + (matches(fields.tags, term) ? 6 : 0)
      + (matches(fields.aliases, term) ? 6 : 0)
      + (matches(fields.concepts, term) ? 5 : 0)
      + (matches(fields.body, term) ? 2 : 0), 0)

    return { lesson, score, matchedTerms }
  }).filter(result => result.score > 0).sort((a, b) => b.score - a.score)

  const concepts = detectConcepts(query, locale)
  const relation = concepts.includes('sfcc') && concepts.includes('pwa') && concepts.includes('typescript')
    ? relationsByLocale[locale]
    : null

  return { results, relation }
}
