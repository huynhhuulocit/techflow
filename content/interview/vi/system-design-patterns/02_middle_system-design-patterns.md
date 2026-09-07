# Middle — Câu hỏi phỏng vấn System Design và Pattern

## Mục lục câu hỏi

1. [Bounded context là gì?](#question-1)
2. [Transactional outbox giải quyết gì?](#question-2)
3. [Idempotency là gì?](#question-3)
4. [Optimistic concurrency là gì?](#question-4)
5. [Saga là gì?](#question-5)
6. [Retry, timeout, circuit breaker là gì?](#question-6)
7. [Bulkhead pattern là gì?](#question-7)
8. [Cache-aside là gì?](#question-8)
9. [Materialised view là gì?](#question-9)
10. [Event-driven architecture là gì?](#question-10)
11. [API gateway là gì?](#question-11)
12. [Vì sao data ownership quan trọng?](#question-12)
13. [Quyết định service extraction thế nào?](#question-13)
14. [CAP theorem nói gì?](#question-14)
15. [Thiết kế degraded mode thế nào?](#question-15)

<a id="question-1"></a>

## 1. Bounded context là gì?

**Câu trả lời mẫu:** **Conclusion:** boundary nơi một domain language/model nhất quán. **Mechanism:** explicit mapping nối context. **Trade-off:** boundary có thể sai/quá nhỏ. **GameStream:** gameplay, identity, media, search có model khác.

<a id="question-2"></a>

## 2. Transactional outbox giải quyết gì?

**Câu trả lời mẫu:** **Conclusion:** ngăn committed state mất integration event. **Mechanism:** state/outbox commit cùng, relay publish sau. **Trade-off:** vẫn duplicate. **GameStream:** Mongo outbox feed Kafka.

<a id="question-3"></a>

## 3. Idempotency là gì?

**Câu trả lời mẫu:** **Conclusion:** lặp logical operation không thêm effect. **Mechanism:** unique ID trả prior result. **Trade-off:** cần retention/equivalence policy. **GameStream:** command/chat có client ID.

<a id="question-4"></a>

## 4. Optimistic concurrency là gì?

**Câu trả lời mẫu:** **Conclusion:** detect conflict bằng version thay long lock. **Mechanism:** conditional update increment. **Trade-off:** caller handle conflict. **GameStream:** stale command trả 409.

<a id="question-5"></a>

## 5. Saga là gì?

**Câu trả lời mẫu:** **Conclusion:** coordinate local transaction bằng event/command và compensation. **Mechanism:** choreography/orchestration. **Trade-off:** compensation không phải rollback. **GameStream:** chưa cần cho single Mongo transaction.

<a id="question-6"></a>

## 6. Retry, timeout, circuit breaker là gì?

**Câu trả lời mẫu:** **Conclusion:** timeout bound wait, retry transient, breaker dừng repeated failure. **Mechanism:** budget/backoff/jitter. **Trade-off:** retry amplify load. **GameStream:** optional search fail fast.

<a id="question-7"></a>

## 7. Bulkhead pattern là gì?

**Câu trả lời mẫu:** **Conclusion:** isolate pool để workload lỗi không exhaust toàn hệ thống. **Mechanism:** queue/concurrency riêng. **Trade-off:** reserved capacity có thể idle. **GameStream:** media/projection/API process riêng.

<a id="question-8"></a>

## 8. Cache-aside là gì?

**Câu trả lời mẫu:** **Conclusion:** app load cache khi miss, invalidate sau write. **Mechanism:** authority ngoài cache. **Trade-off:** stampede/stale. **GameStream:** L1/L2/Mongo public list.

<a id="question-9"></a>

## 9. Materialised view là gì?

**Câu trả lời mẫu:** **Conclusion:** stored precomputed read representation. **Mechanism:** event/job update. **Trade-off:** lag/rebuild. **GameStream:** Elastic room document.

<a id="question-10"></a>

## 10. Event-driven architecture là gì?

**Câu trả lời mẫu:** **Conclusion:** component react immutable fact thay direct call chain. **Mechanism:** broker decouple. **Trade-off:** debug distributed. **GameStream:** worker project events.

<a id="question-11"></a>

## 11. API gateway là gì?

**Câu trả lời mẫu:** **Conclusion:** edge entry route/cross-cutting policy. **Mechanism:** TLS/header/limit/upstream. **Trade-off:** bottleneck risk. **GameStream:** Nginx gateway.

<a id="question-12"></a>

## 12. Vì sao data ownership quan trọng?

**Câu trả lời mẫu:** **Conclusion:** một capability authoritatively write aggregate. **Mechanism:** service khác dùng API/event. **Trade-off:** join thành projection/network. **GameStream:** rooms own game; search chỉ index.

<a id="question-13"></a>

## 13. Quyết định service extraction thế nào?

**Câu trả lời mẫu:** **Conclusion:** cần evidence independent scale/failure/ownership/release. **Mechanism:** tạo internal boundary và đo. **Trade-off:** premature network cost. **GameStream:** worker/media justified.

<a id="question-14"></a>

## 14. CAP theorem nói gì?

**Câu trả lời mẫu:** **Conclusion:** khi network partition không thể vừa linearizable consistency vừa availability mọi request. **Mechanism:** operation chọn behaviour. **Trade-off:** CAP không xếp hạng DB. **GameStream:** room write có thể unavailable thay diverge.

<a id="question-15"></a>

## 15. Thiết kế degraded mode thế nào?

**Câu trả lời mẫu:** **Conclusion:** giữ critical journey, giảm optional feature rõ. **Mechanism:** dependency class/timeout/fallback. **Trade-off:** fallback stale/cần capacity. **GameStream:** game sống khi search/media hỏng.

## Bảng thuật ngữ kỹ thuật

| Technical term            | Nghĩa tiếng Việt             | Giải thích đơn giản                                                                        |
| ------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| Bounded context           | Ngữ cảnh giới hạn            | Ranh giới nơi một domain model và ngôn ngữ có nghĩa nhất quán.                             |
| Transactional outbox      | Hộp thư đi trong giao dịch   | Lưu business change và event cần publish trong cùng transaction.                           |
| Idempotency               | Tính lũy đẳng                | Lặp cùng operation không tạo thêm effect.                                                  |
| Optimistic concurrency    | Kiểm soát đồng thời lạc quan | Phát hiện conflict bằng version thay vì khóa lâu.                                          |
| Saga                      | Chuỗi giao dịch bù           | Phối hợp nhiều local transaction bằng step và compensation.                                |
| Retry                     | Thử lại                      | Lặp operation sau transient failure.                                                       |
| Timeout                   | Giới hạn thời gian chờ       | Dừng chờ khi operation vượt thời gian cho phép.                                            |
| Circuit breaker           | Bộ ngắt mạch                 | Tạm ngừng gọi dependency đang lỗi liên tục.                                                |
| Bulkhead                  | Vách ngăn tài nguyên         | Cô lập pool hoặc concurrency để lỗi một phần không làm cạn toàn bộ hệ thống.               |
| Cache-aside               | Cache đặt bên cạnh           | Application tự tải nguồn và điền cache khi miss.                                           |
| Materialised view         | Khung nhìn được vật hóa      | Read model được tính sẵn để query nhanh.                                                   |
| Event-driven architecture | Kiến trúc hướng sự kiện      | Component phát và phản ứng với event qua contract.                                         |
| API gateway               | Cổng API                     | Điểm vào chung routing, auth hoặc policy cho nhiều backend.                                |
| Data ownership            | Quyền sở hữu dữ liệu         | Một boundary chịu trách nhiệm mutation và invariant của dữ liệu.                           |
| CAP theorem               | Định lý CAP                  | Khi network partition xảy ra, hệ thống phân tán phải đánh đổi consistency và availability. |
