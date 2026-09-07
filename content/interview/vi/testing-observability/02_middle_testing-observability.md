# Middle — Câu hỏi phỏng vấn Testing và Observability

## Mục lục câu hỏi

1. [Contract testing là gì?](#question-1)
2. [Test Mongo transaction thế nào?](#question-2)
3. [Test idempotency thế nào?](#question-3)
4. [Test optimistic concurrency thế nào?](#question-4)
5. [Test Kafka consumer thế nào?](#question-5)
6. [Test reconnect recovery thế nào?](#question-6)
7. [Load testing là gì?](#question-7)
8. [Failure injection là gì?](#question-8)
9. [Tránh flaky async test thế nào?](#question-9)
10. [Metric cardinality là gì?](#question-10)
11. [Correlation hoạt động thế nào?](#question-11)
12. [SLI và SLO là gì?](#question-12)
13. [Design alert thế nào?](#question-13)
14. [White-box khác black-box thế nào?](#question-14)
15. [Release gate là gì?](#question-15)

<a id="question-1"></a>

## 1. Contract testing là gì?

**Câu trả lời mẫu:** **Conclusion:** verify producer/consumer expectation tại boundary. **Mechanism:** schema/fixture compatibility trong CI. **Trade-off:** không prove infrastructure. **GameStream:** HTTP/socket/Kafka envelope.

<a id="question-2"></a>

## 2. Test Mongo transaction thế nào?

**Câu trả lời mẫu:** **Conclusion:** dùng real replica set và inject failure trước commit. **Mechanism:** assert state/event/outbox/receipt all-or-none. **Trade-off:** chậm hơn mock. **GameStream:** local Compose hỗ trợ.

<a id="question-3"></a>

## 3. Test idempotency thế nào?

**Câu trả lời mẫu:** **Conclusion:** gửi cùng ID concurrent/sequential, assert một effect/cùng response. **Mechanism:** inspect unique record/version. **Trade-off:** race cần stress lặp. **GameStream:** command/chat duplicate.

<a id="question-4"></a>

## 4. Test optimistic concurrency thế nào?

**Câu trả lời mẫu:** **Conclusion:** hai command cùng expected version. **Mechanism:** một success, một conflict. **Trade-off:** cần deterministic barrier. **GameStream:** simultaneous roll.

<a id="question-5"></a>

## 5. Test Kafka consumer thế nào?

**Câu trả lời mẫu:** **Conclusion:** publish valid/duplicate/stale/poison và assert effect/offset. **Mechanism:** real broker integration. **Trade-off:** async wait bounded. **GameStream:** projector converge.

<a id="question-6"></a>

## 6. Test reconnect recovery thế nào?

**Câu trả lời mẫu:** **Conclusion:** disconnect dưới/trên recovery window và verify replay/snapshot. **Mechanism:** track version/sequence. **Trade-off:** network simulation phức tạp. **GameStream:** browser/bot cover cả hai.

<a id="question-7"></a>

## 7. Load testing là gì?

**Câu trả lời mẫu:** **Conclusion:** đo latency/error/saturation dưới workload đại diện. **Mechanism:** ramp/steady/spike. **Trade-off:** workload giả gây kết luận sai. **GameStream:** mix room/chat/roll/reconnect/watch.

<a id="question-8"></a>

## 8. Failure injection là gì?

**Câu trả lời mẫu:** **Conclusion:** cố ý fail dependency/process để verify degrade/recovery. **Mechanism:** stop container/add latency/network break. **Trade-off:** isolate environment. **GameStream:** kill backend sau commit trước broadcast.

<a id="question-9"></a>

## 9. Tránh flaky async test thế nào?

**Câu trả lời mẫu:** **Conclusion:** wait observable condition có deadline, không arbitrary sleep. **Mechanism:** deterministic ID/clock và bounded polling. **Trade-off:** real network vẫn variance. **GameStream:** wait room version.

<a id="question-10"></a>

## 10. Metric cardinality là gì?

**Câu trả lời mẫu:** **Conclusion:** mỗi unique label set là một time series. **Mechanism:** user/room ID làm explosion. **Trade-off:** low-cardinality giảm per-entity debug. **GameStream:** label route/status/group.

<a id="question-11"></a>

## 11. Correlation hoạt động thế nào?

**Câu trả lời mẫu:** **Conclusion:** ID theo operation qua log/event/trace. **Mechanism:** envelope giữ correlation/causation. **Trade-off:** validate external input. **GameStream:** command ID nối HTTP/outbox/Kafka.

<a id="question-12"></a>

## 12. SLI và SLO là gì?

**Câu trả lời mẫu:** **Conclusion:** SLI measure behaviour; SLO target theo window. **Mechanism:** error budget. **Trade-off:** average che pain. **GameStream:** p95/p99 roll-to-render/recovery.

<a id="question-13"></a>

## 13. Design alert thế nào?

**Câu trả lời mẫu:** **Conclusion:** page sustained user-impact symptom có runbook. **Mechanism:** burn rate/`for` giảm noise. **Trade-off:** cause alert dành dashboard/ticket. **GameStream:** lag chỉ page khi search SLO đe doạ.

<a id="question-14"></a>

## 14. White-box khác black-box thế nào?

**Câu trả lời mẫu:** **Conclusion:** white-box internal; black-box user path. **Mechanism:** metrics cộng external probe. **Trade-off:** một loại riêng đều miss failure. **GameStream:** health nội bộ cộng HTTPS/socket smoke.

<a id="question-15"></a>

## 15. Release gate là gì?

**Câu trả lời mẫu:** **Conclusion:** automated evidence threshold block unsafe promotion. **Mechanism:** unit/integration/contract/smoke/security/performance theo risk. **Trade-off:** gate chậm delivery. **GameStream:** typecheck/test/Compose/smoke baseline.

## Bảng thuật ngữ kỹ thuật

| Technical term     | Nghĩa tiếng Việt            | Giải thích đơn giản                                            |
| ------------------ | --------------------------- | -------------------------------------------------------------- |
| Contract testing   | Kiểm thử hợp đồng           | Xác nhận producer và consumer hiểu cùng API hoặc event schema. |
| Transaction test   | Kiểm thử giao dịch          | Xác minh commit, rollback và retry với database thật phù hợp.  |
| Idempotency test   | Kiểm thử tính lũy đẳng      | Gửi duplicate và chứng minh chỉ có một business effect.        |
| Concurrency test   | Kiểm thử đồng thời          | Chạy operation song song để phát hiện race và lost update.     |
| Consumer test      | Kiểm thử consumer           | Xác minh parse, side effect, retry và offset behavior.         |
| Reconnect recovery | Phục hồi khi tái kết nối    | Client bắt kịp state sau khi mất connection.                   |
| Load testing       | Kiểm thử tải                | Đo latency, throughput và saturation dưới workload.            |
| Failure injection  | Tiêm lỗi                    | Chủ động tạo timeout, crash hoặc dependency failure.           |
| Flaky test         | Kiểm thử chập chờn          | Test lúc pass lúc fail mà code không thay đổi.                 |
| Metric cardinality | Số lượng tổ hợp nhãn metric | Số time series tạo bởi các giá trị label khác nhau.            |
| Correlation ID     | Mã liên kết                 | ID nối các log và operation thuộc cùng flow.                   |
| SLI                | Chỉ số mức dịch vụ          | Phép đo như success rate hoặc latency.                         |
| SLO                | Mục tiêu mức dịch vụ        | Target mong muốn cho SLI.                                      |
| White-box test     | Kiểm thử hộp trắng          | Test có hiểu implementation nội bộ.                            |
| Black-box test     | Kiểm thử hộp đen            | Test chỉ qua public behavior và contract.                      |
