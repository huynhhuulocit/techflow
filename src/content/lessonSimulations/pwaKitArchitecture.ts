import type {
  LessonSimulationSpec,
  Locale,
  SimulationScalar,
} from '../types'

type PwaKitStateKey =
  | 'phase'
  | 'cacheResult'
  | 'documentSource'
  | 'htmlVisible'
  | 'reactHydrated'
  | 'commerceDataState'
  | 'personalizationScope'
  | 'basketState'
  | 'privacyBoundaryIntact'
  | 'basketOwner'

type PwaKitSnapshot = Record<PwaKitStateKey, SimulationScalar>

const baseSnapshot: PwaKitSnapshot = {
  phase: 'idle',
  cacheResult: 'unchecked',
  documentSource: 'none',
  htmlVisible: false,
  reactHydrated: false,
  commerceDataState: 'not-requested',
  personalizationScope: 'public-cache-safe',
  basketState: 'not-started',
  privacyBoundaryIntact: true,
  basketOwner: 'b2c-commerce',
}

/** Every frame is materialized as the same complete ten-key state contract. */
function snapshot(overrides: Partial<PwaKitSnapshot> = {}): PwaKitSnapshot {
  return { ...baseSnapshot, ...overrides }
}

function localized(locale: Locale, vi: string, en: string) {
  return locale === 'vi' ? vi : en
}

export function createPwaKitArchitectureSimulation(
  locale: Locale,
  sourceContentHash: string,
): LessonSimulationSpec {
  const text = (vi: string, en: string) => localized(locale, vi, en)

  return {
    schemaVersion: 2,
    id: 'lesson.pwa-kit-architecture',
    source: {
      kind: 'lesson',
      slug: 'pwa-kit-architecture',
      contentHash: sourceContentHash,
    },
    locale,
    kind: 'flow',
    learningObjective: text(
      'Theo dõi một PDP request qua cache miss, cache hit và basket mutation; đồng thời nhận ra failure khi personalized output bị tái sử dụng qua shared cache.',
      'Trace a PDP request through a cache miss, a cache hit, and a basket mutation, then recognize the failure caused by reusing personalized output through a shared cache.',
    ),
    misconception: text(
      'PWA Kit xử lý toàn bộ commerce backend, và HTML đã hiển thị nghĩa là storefront đã interactive.',
      'PWA Kit handles the entire commerce backend, and visible HTML means the storefront is already interactive.',
    ),
    takeaway: text(
      'Cache hit có thể bỏ qua app server cho document response, nhưng browser vẫn phải hydrate; Add to Cart vẫn đi qua Commerce APIs đến basket do B2C Commerce sở hữu.',
      'A cache hit can bypass the app server for the document response, but the browser must still hydrate; Add to Cart still reaches the B2C Commerce-owned basket through Commerce APIs.',
    ),
    actors: [
      {
        id: 'browser',
        label: 'Shopper Browser',
        role: text(
          'Gửi request, hiển thị HTML, hydrate React và xử lý tương tác.',
          'Sends requests, displays HTML, hydrates React, and handles interactions.',
        ),
        iconToken: 'client',
      },
      {
        id: 'managed-runtime',
        label: 'Managed Runtime / CDN',
        role: text(
          'Host storefront, định tuyến request và phục vụ response cache-safe.',
          'Hosts the storefront, routes requests, and serves cache-safe responses.',
        ),
        iconToken: 'runtime',
      },
      {
        id: 'pwa-app-server',
        label: 'PWA Kit App Server',
        role: text(
          'Load route data và server-side render React khi document cache miss.',
          'Loads route data and server-side renders React when the document cache misses.',
        ),
        iconToken: 'server',
      },
      {
        id: 'commerce-api',
        label: 'SLAS + Commerce APIs',
        role: text(
          'Authorize Shopper API access và tạo integration boundary.',
          'Authorizes Shopper API access and forms the integration boundary.',
        ),
        iconToken: 'service',
      },
      {
        id: 'b2c-commerce',
        label: 'B2C Commerce',
        role: text(
          'Sở hữu commerce data và basket mutation.',
          'Owns commerce data and basket mutations.',
        ),
        iconToken: 'service',
      },
    ],
    stateFields: [
      {
        key: 'phase',
        label: text('Giai đoạn', 'Phase'),
        description: text('Bước hiện tại của request hoặc interaction.', 'The current request or interaction step.'),
      },
      {
        key: 'cacheResult',
        label: text('Kết quả cache', 'Cache result'),
        description: text('CDN cache chưa kiểm tra, hit hoặc miss.', 'Whether the CDN cache is unchecked, a hit, or a miss.'),
      },
      {
        key: 'documentSource',
        label: text('Nguồn document', 'Document source'),
        description: text('HTML đến từ CDN cache hay PWA Kit App Server.', 'Whether HTML comes from the CDN cache or the PWA Kit App Server.'),
      },
      {
        key: 'htmlVisible',
        label: text('HTML đã hiển thị', 'HTML visible'),
        description: text('Browser đã có thể hiển thị initial HTML hay chưa.', 'Whether the browser can display the initial HTML.'),
      },
      {
        key: 'reactHydrated',
        label: text('React đã hydrate', 'React hydrated'),
        description: text('React state và event handlers đã gắn vào HTML hay chưa.', 'Whether React state and event handlers are attached to the HTML.'),
      },
      {
        key: 'commerceDataState',
        label: text('Trạng thái commerce data', 'Commerce data state'),
        description: text('Tiến độ load dữ liệu cần cho document route.', 'The progress of loading data required by the document route.'),
      },
      {
        key: 'personalizationScope',
        label: text('Phạm vi personalization', 'Personalization scope'),
        description: text('Response là public/cache-safe hay gắn với shopper context.', 'Whether the response is public/cache-safe or tied to shopper context.'),
      },
      {
        key: 'basketState',
        label: text('Trạng thái basket', 'Basket state'),
        description: text('Tiến độ của Add to Cart basket operation.', 'The progress of the Add to Cart basket operation.'),
      },
      {
        key: 'privacyBoundaryIntact',
        label: text('Privacy boundary an toàn', 'Privacy boundary intact'),
        description: text('Shopper-specific output có được cách ly khỏi shared cache hay không.', 'Whether shopper-specific output remains isolated from shared cache reuse.'),
      },
      {
        key: 'basketOwner',
        label: text('Chủ sở hữu basket', 'Basket owner'),
        description: text('Hệ thống sở hữu và thực thi basket mutation.', 'The system that owns and performs basket mutations.'),
      },
    ],
    scenarios: [
      {
        id: 'cache-miss-ssr-add-to-cart',
        label: text('Cache miss: SSR đến Add to Cart', 'Cache miss: SSR through Add to Cart'),
        kind: 'happy-path',
        initialSnapshot: snapshot(),
        transitions: [
          {
            id: 'miss.request',
            actorId: 'browser',
            event: text('Mở PDP trực tiếp', 'Open the PDP directly'),
            explanation: text(
              'Shopper mở product URL hoặc refresh trang, nên browser yêu cầu initial document.',
              'The shopper opens a product URL or refreshes the page, so the browser requests the initial document.',
            ),
            snapshot: snapshot({ phase: 'document-request' }),
            highlights: ['browser', 'phase'],
          },
          {
            id: 'miss.cache-check',
            actorId: 'managed-runtime',
            event: 'Cache miss',
            explanation: text(
              'Managed Runtime không có HTML response còn hợp lệ trong CDN cache và chuyển request đến app server.',
              'Managed Runtime has no still-valid HTML response in the CDN cache and forwards the request to the app server.',
            ),
            snapshot: snapshot({ phase: 'cache-miss', cacheResult: 'miss' }),
            highlights: ['managed-runtime', 'cacheResult'],
          },
          {
            id: 'miss.route-data',
            actorId: 'pwa-app-server',
            event: text('Yêu cầu dữ liệu route', 'Request route data'),
            explanation: text(
              'PWA Kit App Server khớp PDP route và bắt đầu load commerce data cần cho server render.',
              'The PWA Kit App Server matches the PDP route and starts loading the commerce data required for server rendering.',
            ),
            snapshot: snapshot({
              phase: 'route-data-request',
              cacheResult: 'miss',
              commerceDataState: 'requesting',
            }),
            highlights: ['pwa-app-server', 'commerceDataState'],
          },
          {
            id: 'miss.authorize',
            actorId: 'commerce-api',
            event: 'Authorize Shopper API',
            explanation: text(
              'SLAS và Commerce APIs áp dụng authorization tại integration boundary trước khi truy cập commerce capability.',
              'SLAS and Commerce APIs apply authorization at the integration boundary before accessing the commerce capability.',
            ),
            snapshot: snapshot({
              phase: 'api-authorized',
              cacheResult: 'miss',
              commerceDataState: 'authorized',
            }),
            highlights: ['commerce-api', 'commerceDataState'],
          },
          {
            id: 'miss.commerce-data',
            actorId: 'b2c-commerce',
            event: text('Trả dữ liệu commerce', 'Return commerce data'),
            explanation: text(
              'B2C Commerce trả dữ liệu PDP cần thiết qua API boundary; commerce data vẫn do backend sở hữu.',
              'B2C Commerce returns the required PDP data through the API boundary; the backend still owns commerce data.',
            ),
            snapshot: snapshot({
              phase: 'commerce-data-returned',
              cacheResult: 'miss',
              commerceDataState: 'received',
            }),
            highlights: ['b2c-commerce', 'commerceDataState'],
          },
          {
            id: 'miss.ssr',
            actorId: 'pwa-app-server',
            event: text('SSR React', 'Server-render React'),
            explanation: text(
              'App server tạo initial HTML và serialize props cần cho hydration.',
              'The app server creates the initial HTML and serializes the props needed for hydration.',
            ),
            snapshot: snapshot({
              phase: 'ssr-complete',
              cacheResult: 'miss',
              documentSource: 'app-server',
              commerceDataState: 'received',
            }),
            highlights: ['pwa-app-server', 'documentSource'],
          },
          {
            id: 'miss.deliver-html',
            actorId: 'managed-runtime',
            event: text('Trả HTML', 'Deliver HTML'),
            explanation: text(
              'Managed Runtime trả HTML cho browser. Nội dung đã nhìn thấy nhưng React interaction chưa sẵn sàng.',
              'Managed Runtime delivers HTML to the browser. Content is visible, but React interaction is not ready yet.',
            ),
            snapshot: snapshot({
              phase: 'html-visible',
              cacheResult: 'miss',
              documentSource: 'app-server',
              htmlVisible: true,
              commerceDataState: 'received',
            }),
            highlights: ['managed-runtime', 'htmlVisible', 'reactHydrated'],
          },
          {
            id: 'miss.hydrate',
            actorId: 'browser',
            event: 'Hydrate React',
            explanation: text(
              'Browser tải JavaScript rồi React gắn state và event handlers vào markup hiện có.',
              'The browser loads JavaScript, then React attaches state and event handlers to the existing markup.',
            ),
            snapshot: snapshot({
              phase: 'interactive',
              cacheResult: 'miss',
              documentSource: 'app-server',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'received',
            }),
            highlights: ['browser', 'reactHydrated'],
          },
          {
            id: 'miss.add-to-cart',
            actorId: 'browser',
            event: text('Gửi Add to Cart', 'Send Add to Cart'),
            explanation: text(
              'Sau hydration, shopper kích hoạt Add to Cart và browser bắt đầu basket operation.',
              'After hydration, the shopper activates Add to Cart and the browser starts a basket operation.',
            ),
            snapshot: snapshot({
              phase: 'basket-request',
              cacheResult: 'miss',
              documentSource: 'app-server',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'received',
              basketState: 'requesting',
            }),
            highlights: ['browser', 'basketState'],
          },
          {
            id: 'miss.forward-basket',
            actorId: 'commerce-api',
            event: text('Chuyển basket operation', 'Forward basket operation'),
            explanation: text(
              'Commerce API boundary authorize và chuyển mutation đến B2C Commerce; CDN document cache không xử lý thay operation này.',
              'The Commerce API boundary authorizes and forwards the mutation to B2C Commerce; the CDN document cache does not perform this operation.',
            ),
            snapshot: snapshot({
              phase: 'basket-forwarded',
              cacheResult: 'miss',
              documentSource: 'app-server',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'received',
              basketState: 'forwarded',
            }),
            highlights: ['commerce-api', 'basketState'],
          },
          {
            id: 'miss.mutate-basket',
            actorId: 'b2c-commerce',
            event: text('Cập nhật basket', 'Update the basket'),
            explanation: text(
              'B2C Commerce thực thi basket mutation và trả kết quả đã xác nhận.',
              'B2C Commerce performs the basket mutation and returns a confirmed result.',
            ),
            snapshot: snapshot({
              phase: 'basket-confirmed',
              cacheResult: 'miss',
              documentSource: 'app-server',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'received',
              basketState: 'confirmed',
            }),
            highlights: ['b2c-commerce', 'basketState', 'basketOwner'],
          },
          {
            id: 'miss.update-mini-cart',
            actorId: 'browser',
            event: text('Cập nhật mini-cart', 'Update the mini-cart'),
            explanation: text(
              'Browser cập nhật mini-cart từ kết quả basket đã xác nhận mà không cần full-page reload.',
              'The browser updates the mini-cart from the confirmed basket result without a full-page reload.',
            ),
            snapshot: snapshot({
              phase: 'complete',
              cacheResult: 'miss',
              documentSource: 'app-server',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'received',
              basketState: 'confirmed',
            }),
            highlights: ['browser', 'phase'],
          },
        ],
        terminalState: 'success',
        terminalSummary: text(
          'Cache miss đi qua Commerce APIs và SSR; browser hydrate trước khi Add to Cart cập nhật basket do B2C Commerce sở hữu.',
          'The cache miss goes through Commerce APIs and SSR; the browser hydrates before Add to Cart updates the B2C Commerce-owned basket.',
        ),
      },
      {
        id: 'cache-hit-add-to-cart',
        label: text('Cache hit: cached HTML đến Add to Cart', 'Cache hit: cached HTML through Add to Cart'),
        kind: 'what-if',
        initialSnapshot: snapshot(),
        transitions: [
          {
            id: 'hit.request',
            actorId: 'browser',
            event: text('Mở PDP trực tiếp', 'Open the PDP directly'),
            explanation: text(
              'Browser yêu cầu initial PDP document từ Managed Runtime.',
              'The browser requests the initial PDP document from Managed Runtime.',
            ),
            snapshot: snapshot({ phase: 'document-request' }),
            highlights: ['browser', 'phase'],
          },
          {
            id: 'hit.cached-html',
            actorId: 'managed-runtime',
            event: text('Phục vụ HTML cache-safe', 'Serve cache-safe HTML'),
            explanation: text(
              'CDN cache hit trả một HTML response còn hợp lệ. App server và initial Commerce API data path được bỏ qua cho document response này.',
              'A CDN cache hit returns a still-valid HTML response. The app server and initial Commerce API data path are bypassed for this document response.',
            ),
            snapshot: snapshot({
              phase: 'html-visible',
              cacheResult: 'hit',
              documentSource: 'cdn-cache',
              htmlVisible: true,
              commerceDataState: 'bypassed-for-document',
            }),
            highlights: ['managed-runtime', 'cacheResult', 'documentSource', 'htmlVisible', 'reactHydrated'],
          },
          {
            id: 'hit.hydrate',
            actorId: 'browser',
            event: 'Hydrate React',
            explanation: text(
              'Cached HTML vẫn cần JavaScript và hydration trước khi React controls trở nên interactive.',
              'Cached HTML still needs JavaScript and hydration before React controls become interactive.',
            ),
            snapshot: snapshot({
              phase: 'interactive',
              cacheResult: 'hit',
              documentSource: 'cdn-cache',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'bypassed-for-document',
            }),
            highlights: ['browser', 'reactHydrated'],
          },
          {
            id: 'hit.add-to-cart',
            actorId: 'browser',
            event: text('Gửi Add to Cart', 'Send Add to Cart'),
            explanation: text(
              'Shopper tương tác sau hydration; basket operation bắt đầu ở browser dù document vừa đến từ cache.',
              'The shopper interacts after hydration; the basket operation starts in the browser even though the document came from cache.',
            ),
            snapshot: snapshot({
              phase: 'basket-request',
              cacheResult: 'hit',
              documentSource: 'cdn-cache',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'bypassed-for-document',
              basketState: 'requesting',
            }),
            highlights: ['browser', 'basketState'],
          },
          {
            id: 'hit.forward-basket',
            actorId: 'commerce-api',
            event: text('Chuyển basket operation', 'Forward basket operation'),
            explanation: text(
              'Commerce API boundary chuyển Add to Cart đến backend; cache hit chỉ thay đổi document path.',
              'The Commerce API boundary forwards Add to Cart to the backend; the cache hit changes only the document path.',
            ),
            snapshot: snapshot({
              phase: 'basket-forwarded',
              cacheResult: 'hit',
              documentSource: 'cdn-cache',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'bypassed-for-document',
              basketState: 'forwarded',
            }),
            highlights: ['commerce-api', 'basketState'],
          },
          {
            id: 'hit.mutate-basket',
            actorId: 'b2c-commerce',
            event: text('Cập nhật basket', 'Update the basket'),
            explanation: text(
              'B2C Commerce, không phải CDN cache hay app server, thực thi basket mutation.',
              'B2C Commerce, not the CDN cache or app server, performs the basket mutation.',
            ),
            snapshot: snapshot({
              phase: 'basket-confirmed',
              cacheResult: 'hit',
              documentSource: 'cdn-cache',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'bypassed-for-document',
              basketState: 'confirmed',
            }),
            highlights: ['b2c-commerce', 'basketState', 'basketOwner'],
          },
          {
            id: 'hit.update-mini-cart',
            actorId: 'browser',
            event: text('Cập nhật mini-cart', 'Update the mini-cart'),
            explanation: text(
              'Browser phản ánh basket result đã xác nhận trong mini-cart.',
              'The browser reflects the confirmed basket result in the mini-cart.',
            ),
            snapshot: snapshot({
              phase: 'complete',
              cacheResult: 'hit',
              documentSource: 'cdn-cache',
              htmlVisible: true,
              reactHydrated: true,
              commerceDataState: 'bypassed-for-document',
              basketState: 'confirmed',
            }),
            highlights: ['browser', 'phase'],
          },
        ],
        terminalState: 'success',
        terminalSummary: text(
          'CDN phục vụ initial HTML mà không gọi app server cho document, nhưng hydration và B2C Commerce basket mutation vẫn diễn ra.',
          'The CDN serves the initial HTML without calling the app server for the document, but hydration and the B2C Commerce basket mutation still occur.',
        ),
      },
      {
        id: 'unsafe-personalized-shared-cache',
        label: text('Failure: personalized output trong shared cache', 'Failure: personalized output in a shared cache'),
        kind: 'failure',
        initialSnapshot: snapshot(),
        transitions: [
          {
            id: 'unsafe.request',
            actorId: 'browser',
            event: text('Yêu cầu PDP có shopper context', 'Request a PDP with shopper context'),
            explanation: text(
              'Browser gửi document request có context dành riêng cho shopper.',
              'The browser sends a document request carrying shopper-specific context.',
            ),
            snapshot: snapshot({
              phase: 'personalized-document-request',
              personalizationScope: 'shopper-specific-request',
            }),
            highlights: ['browser', 'personalizationScope'],
          },
          {
            id: 'unsafe.shared-cache',
            actorId: 'managed-runtime',
            event: text('Shared cache trả sai personalized output', 'Shared cache serves the wrong personalized output'),
            explanation: text(
              'Cache key hoặc response policy không cách ly shopper context, nên shared cache tái sử dụng personalized HTML cho request khác.',
              'The cache key or response policy fails to isolate shopper context, so the shared cache reuses personalized HTML for another request.',
            ),
            snapshot: snapshot({
              phase: 'unsafe-cache-response',
              cacheResult: 'hit',
              documentSource: 'cdn-cache',
              htmlVisible: true,
              personalizationScope: 'shopper-specific-shared-cache',
              privacyBoundaryIntact: false,
            }),
            highlights: ['managed-runtime', 'cacheResult', 'personalizationScope', 'privacyBoundaryIntact'],
          },
          {
            id: 'unsafe.expose',
            actorId: 'browser',
            event: text('Hiển thị output không an toàn', 'Display unsafe output'),
            explanation: text(
              'Browser hiển thị personalized output thuộc sai context. Đây là privacy failure, không phải lợi ích cache-hit.',
              'The browser displays personalized output from the wrong context. This is a privacy failure, not a cache-hit benefit.',
            ),
            snapshot: snapshot({
              phase: 'privacy-failure',
              cacheResult: 'hit',
              documentSource: 'cdn-cache',
              htmlVisible: true,
              personalizationScope: 'shopper-specific-shared-cache',
              privacyBoundaryIntact: false,
            }),
            highlights: ['browser', 'phase', 'privacyBoundaryIntact'],
          },
        ],
        terminalState: 'failed',
        terminalSummary: text(
          'Shared cache đã phá privacy boundary bằng cách tái sử dụng shopper-specific output cho sai context.',
          'The shared cache breaks the privacy boundary by reusing shopper-specific output for the wrong context.',
        ),
      },
    ],
    invariants: [
      {
        id: 'privacy-boundary',
        label: text(
          'Shopper-specific output không được tái sử dụng qua shared cache',
          'Shopper-specific output is not reused through a shared cache',
        ),
        stateKey: 'privacyBoundaryIntact',
        operator: 'eq',
        expected: true,
      },
      {
        id: 'basket-ownership',
        label: text(
          'B2C Commerce vẫn sở hữu basket mutation',
          'B2C Commerce remains the owner of basket mutations',
        ),
        stateKey: 'basketOwner',
        operator: 'eq',
        expected: 'b2c-commerce',
      },
    ],
    provenance: {
      kind: 'ai-generated',
      model: 'OpenAI Codex',
      promptVersion: 'pwa-kit-simulation-v1',
      generatedAt: '2026-09-07T06:30:00.000Z',
      inputHash: '7259eb1c1564bae37c628b63ba268696354abf8404610157a20af6a5cbe15e8a',
    },
    status: 'generated-needs-review',
  }
}
