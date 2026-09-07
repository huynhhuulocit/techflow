# Junior — Câu hỏi phỏng vấn Testing và Observability

## Mục lục câu hỏi

1. [Unit test là gì?](#question-1)
2. [Integration test là gì?](#question-2)
3. [End-to-end test là gì?](#question-3)
4. [Arrange–Act–Assert là gì?](#question-4)
5. [Test double là gì?](#question-5)
6. [Vì sao test phải deterministic?](#question-6)
7. [Smoke test là gì?](#question-7)
8. [Vì sao dùng bot test?](#question-8)
9. [Observability là gì?](#question-9)
10. [Counter khác gauge thế nào?](#question-10)
11. [Histogram là gì?](#question-11)
12. [Structured logging là gì?](#question-12)
13. [Liveness khác readiness thế nào?](#question-13)
14. [Test pyramid là gì?](#question-14)
15. [Admin dashboard nên hiển thị gì?](#question-15)

<a id="question-1"></a>

## 1. Unit test là gì?

**Câu trả lời mẫu:** **Conclusion:** verify unit nhỏ cô lập và chạy nhanh. **Mechanism:** deterministic input assert output. **Trade-off:** mock che integration bug. **GameStream:** dice transition là unit test lý tưởng.

<a id="question-2"></a>

## 2. Integration test là gì?

**Câu trả lời mẫu:** **Conclusion:** verify nhiều real component cùng hoạt động. **Mechanism:** exercise DB/framework/broker boundary. **Trade-off:** chậm/environment-sensitive. **GameStream:** test Mongo transaction/outbox.

<a id="question-3"></a>

## 3. End-to-end test là gì?

**Câu trả lời mẫu:** **Conclusion:** test user flow qua deployed interface. **Mechanism:** browser/API dùng public origin. **Trade-off:** confidence cao nhưng chậm/flaky. **GameStream:** create/join/start/roll/resume.

<a id="question-4"></a>

## 4. Arrange–Act–Assert là gì?

**Câu trả lời mẫu:** **Conclusion:** cấu trúc setup, behaviour, verification. **Mechanism:** mỗi test kể một story. **Trade-off:** setup lớn báo boundary xấu. **GameStream:** lobby, `startGame`, assert state/event.

<a id="question-5"></a>

## 5. Test double là gì?

**Câu trả lời mẫu:** **Conclusion:** stub/fake/spy/mock thay collaborator. **Mechanism:** control input/observe call. **Trade-off:** overspecified mock coupling. **GameStream:** fake clock/random.

<a id="question-6"></a>

## 6. Vì sao test phải deterministic?

**Câu trả lời mẫu:** **Conclusion:** cùng input/environment cho cùng result. **Mechanism:** inject time/random/ID. **Trade-off:** abstraction thêm code. **GameStream:** dice/time được truyền vào domain.

<a id="question-7"></a>

## 7. Smoke test là gì?

**Câu trả lời mẫu:** **Conclusion:** check nhỏ xác nhận critical deployment path cơ bản. **Mechanism:** gọi health/API/realtime. **Trade-off:** không cover edge case. **GameStream:** `test:smoke` validate stack.

<a id="question-8"></a>

## 8. Vì sao dùng bot test?

**Câu trả lời mẫu:** **Conclusion:** tạo repeatable multi-user traffic khó làm tay. **Mechanism:** client join/chat/roll. **Trade-off:** không thay browser/network thật. **GameStream:** bot runner fill room/concurrency.

<a id="question-9"></a>

## 9. Observability là gì?

**Câu trả lời mẫu:** **Conclusion:** suy ra internal state từ metric/log/trace. **Mechanism:** telemetry correlate user journey. **Trade-off:** tốn resource/privacy. **GameStream:** admin dashboard combine signals.

<a id="question-10"></a>

## 10. Counter khác gauge thế nào?

**Câu trả lời mẫu:** **Conclusion:** counter chỉ tăng/reset; gauge tăng giảm. **Mechanism:** rate counter, đọc gauge trực tiếp. **Trade-off:** type sai tạo query sai. **GameStream:** request total counter, outbox pending gauge.

<a id="question-11"></a>

## 11. Histogram là gì?

**Câu trả lời mẫu:** **Conclusion:** đếm observation theo bucket để phân tích distribution/quantile. **Mechanism:** query p95/p99. **Trade-off:** bucket ảnh hưởng accuracy/cardinality. **GameStream:** request/publish latency.

<a id="question-12"></a>

## 12. Structured logging là gì?

**Câu trả lời mẫu:** **Conclusion:** log có stable field thay free text. **Mechanism:** JSON level/service/event/correlation. **Trade-off:** không log token. **GameStream:** command ID nối API/worker.

<a id="question-13"></a>

## 13. Liveness khác readiness thế nào?

**Câu trả lời mẫu:** **Conclusion:** liveness process sống; readiness nhận traffic được. **Mechanism:** orchestrator restart/route khác nhau. **Trade-off:** deep liveness gây loop. **GameStream:** projection failure làm worker unready.

<a id="question-14"></a>

## 14. Test pyramid là gì?

**Câu trả lời mẫu:** **Conclusion:** nhiều unit nhanh, ít integration, E2E tập trung. **Mechanism:** confidence layered theo cost. **Trade-off:** ratio theo risk. **GameStream:** domain test nhiều; smoke/bot/browser cover boundary.

<a id="question-15"></a>

## 15. Admin dashboard nên hiển thị gì?

**Câu trả lời mẫu:** **Conclusion:** actionable health, latency/error, connection, gameplay, storage, cache, lag. **Mechanism:** aggregate trusted backend metric. **Trade-off:** dashboard không thay alert/runbook. **GameStream:** service, p95, Redis, outbox, Kafka lag.

## Bảng thuật ngữ kỹ thuật

| Technical term     | Nghĩa tiếng Việt               | Giải thích đơn giản                                            |
| ------------------ | ------------------------------ | -------------------------------------------------------------- |
| Unit test          | Kiểm thử đơn vị                | Test một đơn vị logic nhỏ với dependency được kiểm soát.       |
| Integration test   | Kiểm thử tích hợp              | Test nhiều component hoặc dependency thật hoạt động cùng nhau. |
| End-to-end test    | Kiểm thử đầu cuối              | Test flow qua hệ thống giống hành vi client thật.              |
| Arrange–Act–Assert | Chuẩn bị – thực thi – xác minh | Cấu trúc test gồm thiết lập, hành động và kiểm tra kết quả.    |
| Test double        | Đối tượng thay thế trong test  | Stub, mock, fake hoặc spy thay cho dependency.                 |
| Deterministic test | Kiểm thử xác định              | Cùng input và môi trường luôn cho kết quả ổn định.             |
| Smoke test         | Kiểm thử khói                  | Bộ test nhỏ xác nhận chức năng quan trọng hoạt động cơ bản.    |
| Bot test           | Kiểm thử bằng bot              | Client tự động mô phỏng nhiều user qua public boundary.        |
| Observability      | Khả năng quan sát              | Hiểu trạng thái nội bộ qua metrics, logs và traces.            |
| Counter            | Bộ đếm tăng                    | Metric tích lũy chỉ tăng hoặc reset khi process restart.       |
| Gauge              | Đồng hồ đo                     | Metric có thể tăng hoặc giảm như connection hiện tại.          |
| Histogram          | Biểu đồ phân bố                | Metric gom observation vào bucket để tính percentile gần đúng. |
| Structured logging | Ghi log có cấu trúc            | Log theo field machine-readable thay vì chuỗi tự do.           |
| Liveness           | Khả năng còn sống              | Cho biết process có cần restart hay không.                     |
| Readiness          | Khả năng sẵn sàng              | Cho biết instance có nên nhận traffic hay chưa.                |
