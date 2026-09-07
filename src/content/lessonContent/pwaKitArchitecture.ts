import type { LessonContent, Locale } from '../types'

const evidence = [
  {
    label: 'Composable Storefront overview',
    url: 'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html',
  },
  {
    label: 'PWA Kit rendering and hydration',
    url: 'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/rendering.html',
  },
  {
    label: 'Shopper API access with SLAS',
    url: 'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/setting-up-api-access',
  },
  {
    label: 'Caching personalized responses safely',
    url: 'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/personalize-with-cookies.html',
  },
  {
    label: 'Storefront Next architecture distinction',
    url: 'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/sfnext-architecture.html',
  },
]

export const pwaKitArchitectureContent: Record<Locale, LessonContent> = {
  vi: {
    scope: 'PWA Kit / Retail React App trên Managed Runtime; không mô tả kiến trúc Storefront Next.',
    mentalModel: 'Hãy xem PWA Kit như storefront application nằm giữa shopper và B2C Commerce, không phải commerce backend.',
    conceptualExplanation: 'Initial document request đi vào Managed Runtime. Runtime có thể trả một HTML response còn hợp lệ từ CDN cache; khi cache miss, PWA Kit app server khớp route, lấy commerce data cần thiết qua integration đã cấu hình rồi server-side render React. Browser hiển thị HTML, tải JavaScript và hydrate các component. Sau đó, internal navigation thường do client-side router xử lý và chỉ fetch thêm dữ liệu khi route cần.',
    actors: [
      { id: 'browser', label: 'Shopper Browser', responsibility: 'Gửi request, hiển thị HTML, hydrate React và xử lý tương tác.' },
      { id: 'managed-runtime', label: 'Managed Runtime / CDN', responsibility: 'Host storefront, định tuyến request và phục vụ response có thể cache.' },
      { id: 'pwa-app-server', label: 'PWA Kit App Server', responsibility: 'Chạy Node/Express, load route data và server-side render React.' },
      { id: 'commerce-api', label: 'SLAS + Commerce APIs', responsibility: 'Authorize Shopper API access và tạo integration boundary với commerce backend.' },
      { id: 'b2c-commerce', label: 'B2C Commerce', responsibility: 'Sở hữu catalog, pricing, promotion, basket và order capabilities.' },
    ],
    mechanism: [
      { id: 'request', actorId: 'browser', title: 'Yêu cầu initial document', detail: 'Shopper mở trực tiếp một storefront URL hoặc refresh trang hiện tại.' },
      { id: 'cache-decision', actorId: 'managed-runtime', title: 'Kiểm tra response cache', detail: 'Cache hit có thể trả HTML ngay. Cache miss mới chuyển request đến app server.' },
      { id: 'load-commerce-data', actorId: 'pwa-app-server', title: 'Load dữ liệu cần cho route', detail: 'Ở cache-miss path, route dùng SCAPI hoặc OCAPI integration của project; Shopper APIs được authorize bằng SLAS.' },
      { id: 'server-render', actorId: 'pwa-app-server', title: 'Render React trên server', detail: 'App server tạo HTML và serialize initial props cần thiết cho hydration.' },
      { id: 'hydrate', actorId: 'browser', title: 'Hydrate trong browser', detail: 'React gắn state và event handlers vào markup đã có để storefront trở nên interactive.' },
      { id: 'client-navigation', actorId: 'browser', title: 'Chuyển sang client navigation', detail: 'Các internal navigation tiếp theo cập nhật document hiện tại và fetch commerce data khi cần; direct navigation hoặc refresh có thể quay lại SSR path.' },
    ],
    productionTradeOffs: [
      {
        title: 'SSR và CDN caching',
        benefit: 'Có thể đưa meaningful HTML đến browser sớm hơn và tránh render lại khi response cache còn dùng được.',
        cost: 'Cache miss cộng thêm Commerce API latency và app-server rendering; hiệu quả thực tế phải được đo.',
        decisionRule: 'Cache public output có policy rõ ràng và theo dõi riêng cache-hit, API và SSR latency.',
      },
      {
        title: 'Personalization và freshness',
        benefit: 'Shopper nhận price, promotion và trải nghiệm phù hợp context.',
        cost: 'Shopper-specific state làm giảm khả năng dùng shared cache và có thể gây lộ dữ liệu nếu cache key hoặc header sai.',
        decisionRule: 'Chỉ share-cache dữ liệu thực sự public; xác minh tenant-specific cache rules trước khi cache nội dung personalized.',
      },
      {
        title: 'Hydration và client rendering',
        benefit: 'Internal navigation và interaction không cần full-page reload.',
        cost: 'JavaScript bundle, third-party scripts và redundant rendering vẫn có thể làm UI phản hồi chậm.',
        decisionRule: 'Đặt performance budget cho client bundle và đo LCP, INP cùng server timing thay vì suy luận từ SSR.',
      },
      {
        title: 'Headless API boundary',
        benefit: 'Storefront và commerce capabilities có thể phát triển độc lập hơn.',
        cost: 'Hệ thống có thêm auth, rate limit, timeout và cross-system observability concerns.',
        decisionRule: 'Thiết kế retry/fallback theo từng operation và giữ correlation ID để trace xuyên boundary.',
      },
    ],
    misconceptions: [
      { claim: 'PWA Kit chính là commerce backend của SFCC.', correction: 'PWA Kit sở hữu storefront và rendering; B2C Commerce vẫn sở hữu commerce data và business capabilities.' },
      { claim: 'Có SSR nghĩa là browser không còn render.', correction: 'SSR tạo initial HTML; sau hydration, React tiếp tục xử lý interaction và client-side navigation.' },
      { claim: 'Tên PWA Kit đồng nghĩa project luôn có offline mode hoặc service worker.', correction: 'Offline behavior và service-worker setup phải được xác minh trong implementation thực tế, không thể suy ra chỉ từ tên framework.' },
    ],
    appliedExample: {
      label: 'PDP và Add to Cart',
      summary: 'Trace một product detail page để thấy storefront rendering và commerce ownership tách nhau như thế nào.',
      steps: [
        'Shopper mở trực tiếp product URL; Managed Runtime kiểm tra response cache.',
        'Nếu cache miss, PWA Kit route lấy product data cần thiết qua Shopper API integration của project.',
        'App server có thể SSR các product fields public/cache-safe như tên và ảnh. Price, promotion, availability và shopper-specific data phải theo freshness/cache policy của project và có thể được render hoặc fetch client-side.',
        'Browser hydrate variation controls và Add to Cart; trước đó HTML có thể nhìn thấy nhưng React interaction chưa sẵn sàng.',
        'Add to Cart gửi basket operation đến B2C Commerce; client cập nhật mini-cart mà không cần full-page reload.',
      ],
    },
    evidence: evidence.map((item) => ({ ...item })),
  },
  en: {
    scope: 'PWA Kit / Retail React App on Managed Runtime; this lesson does not describe the Storefront Next architecture.',
    mentalModel: 'Treat PWA Kit as the storefront application between the shopper and B2C Commerce, not as the commerce backend.',
    conceptualExplanation: 'An initial document request enters Managed Runtime. The runtime can return a still-valid HTML response from CDN cache; on a cache miss, the PWA Kit app server matches the route, loads the required commerce data through the configured integration, and server-side renders React. The browser displays the HTML, loads JavaScript, and hydrates the components. Internal navigation is then usually handled by the client-side router, which fetches more data only when the route requires it.',
    actors: [
      { id: 'browser', label: 'Shopper Browser', responsibility: 'Sends requests, displays HTML, hydrates React, and handles interaction.' },
      { id: 'managed-runtime', label: 'Managed Runtime / CDN', responsibility: 'Hosts the storefront, routes requests, and serves responses that can be cached.' },
      { id: 'pwa-app-server', label: 'PWA Kit App Server', responsibility: 'Runs Node/Express, loads route data, and server-side renders React.' },
      { id: 'commerce-api', label: 'SLAS + Commerce APIs', responsibility: 'Authorizes Shopper API access and forms the integration boundary with the commerce backend.' },
      { id: 'b2c-commerce', label: 'B2C Commerce', responsibility: 'Owns catalog, pricing, promotion, basket, and order capabilities.' },
    ],
    mechanism: [
      { id: 'request', actorId: 'browser', title: 'Request the initial document', detail: 'The shopper opens a storefront URL directly or refreshes the current page.' },
      { id: 'cache-decision', actorId: 'managed-runtime', title: 'Check the response cache', detail: 'A cache hit can return HTML immediately. Only a cache miss proceeds to the app server.' },
      { id: 'load-commerce-data', actorId: 'pwa-app-server', title: 'Load route data', detail: 'On the cache-miss path, the route uses the project’s SCAPI or OCAPI integration; Shopper APIs are authorized through SLAS.' },
      { id: 'server-render', actorId: 'pwa-app-server', title: 'Render React on the server', detail: 'The app server produces HTML and serializes the initial props needed for hydration.' },
      { id: 'hydrate', actorId: 'browser', title: 'Hydrate in the browser', detail: 'React attaches state and event handlers to the existing markup so the storefront becomes interactive.' },
      { id: 'client-navigation', actorId: 'browser', title: 'Move to client navigation', detail: 'Later internal navigation updates the existing document and fetches commerce data when needed; direct navigation or refresh can return to the SSR path.' },
    ],
    productionTradeOffs: [
      {
        title: 'SSR and CDN caching',
        benefit: 'Can deliver meaningful HTML earlier and avoid repeated rendering while a cached response remains usable.',
        cost: 'A cache miss adds Commerce API latency and app-server rendering; the real benefit must be measured.',
        decisionRule: 'Cache public output under an explicit policy and measure cache-hit, API, and SSR latency separately.',
      },
      {
        title: 'Personalization and freshness',
        benefit: 'The shopper receives prices, promotions, and experiences that match their context.',
        cost: 'Shopper-specific state reduces safe shared-cache reuse and can leak data when cache keys or headers are wrong.',
        decisionRule: 'Share-cache only genuinely public data and verify tenant-specific cache rules before caching personalized output.',
      },
      {
        title: 'Hydration and client rendering',
        benefit: 'Internal navigation and interaction do not require a full-page reload.',
        cost: 'JavaScript bundles, third-party scripts, and redundant rendering can still make the UI slow to respond.',
        decisionRule: 'Set a client-bundle performance budget and measure LCP, INP, and server timing instead of inferring performance from SSR.',
      },
      {
        title: 'Headless API boundary',
        benefit: 'The storefront and commerce capabilities can evolve more independently.',
        cost: 'The system adds authentication, rate limits, timeouts, and cross-system observability concerns.',
        decisionRule: 'Design retries and fallbacks per operation, and preserve correlation IDs across the boundary.',
      },
    ],
    misconceptions: [
      { claim: 'PWA Kit is the SFCC commerce backend.', correction: 'PWA Kit owns the storefront and rendering; B2C Commerce still owns commerce data and business capabilities.' },
      { claim: 'SSR means the browser no longer renders.', correction: 'SSR creates the initial HTML; after hydration, React continues to handle interaction and client-side navigation.' },
      { claim: 'The PWA Kit name guarantees offline mode or a service worker.', correction: 'Offline behavior and service-worker setup must be verified in the actual implementation; they cannot be inferred from the framework name.' },
    ],
    appliedExample: {
      label: 'PDP and Add to Cart',
      summary: 'Trace a product detail page to see how storefront rendering and commerce ownership remain separate.',
      steps: [
        'The shopper opens a product URL directly, and Managed Runtime checks the response cache.',
        'On a cache miss, the PWA Kit route loads the required product data through the project’s Shopper API integration.',
        'The app server can SSR public, cache-safe product fields such as the name and images. Price, promotions, availability, and shopper-specific data must follow the project’s freshness/cache policy and may be rendered or fetched client-side.',
        'The browser hydrates variation controls and Add to Cart; the HTML can be visible before React interaction is ready.',
        'Add to Cart sends a basket operation to B2C Commerce, and the client updates the mini-cart without a full-page reload.',
      ],
    },
    evidence: evidence.map((item) => ({ ...item })),
  },
}
