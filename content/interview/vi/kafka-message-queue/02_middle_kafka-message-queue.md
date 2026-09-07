# Middle — Câu hỏi phỏng vấn Kafka và message queue

## Mục lục câu hỏi

1. [Implement at-least-once consumer an toàn thế nào?](#question-1)
2. [Điều gì xảy ra khi consumer-group rebalance?](#question-2)
3. [Commit Kafka offset thế nào?](#question-3)
4. [Chọn partition key thế nào?](#question-4)
5. [Outbox relay xử lý publish failure thế nào?](#question-5)
6. [Dead-letter queue là gì?](#question-6)
7. [Event schema evolve thế nào?](#question-7)
8. [Kafka transaction cung cấp gì?](#question-8)
9. [Batching và compression ảnh hưởng performance thế nào?](#question-9)
10. [Retention khác acknowledgement thế nào?](#question-10)
11. [Áp backpressure cho producer thế nào?](#question-11)
12. [Xử lý poison message mà không mất order thế nào?](#question-12)
13. [Kafka event envelope nên chứa gì?](#question-13)
14. [Kafka metric nào quan trọng?](#question-14)
15. [Vì sao so Kafka, RabbitMQ, ZeroMQ theo semantics?](#question-15)

<a id="question-1"></a>

## 1. Implement at-least-once consumer an toàn thế nào?

**Câu trả lời mẫu:** **Conclusion:** xử lý idempotent và chỉ commit offset sau durable effect thành công. **Mechanism:** duplicate event được detect theo ID/version hoặc hội tụ qua upsert. **Trade-off:** dedupe cần storage hoặc naturally idempotent write. **GameStream:** Redis/Elasticsearch projector dùng room identity và aggregate version.

<a id="question-2"></a>

## 2. Điều gì xảy ra khi consumer-group rebalance?

**Câu trả lời mẫu:** **Conclusion:** partition ownership chuyển giữa member, tạm pause processing và có thể redeliver uncommitted work. **Mechanism:** join, leave hoặc partition change trigger assignment. **Trade-off:** handler chậm/deploy thường xuyên tăng disruption. **GameStream:** handler phải bounded và shutdown chỉ commit completed record.

<a id="question-3"></a>

## 3. Commit Kafka offset thế nào?

**Câu trả lời mẫu:** **Conclusion:** commit next position sau khi mọi required effect trước đó của partition durable. **Mechanism:** auto commit có thể race processing. **Trade-off:** per-record commit an toàn nhưng chậm; batching tăng throughput. **GameStream:** batch không được advance qua failed room event nếu chưa có quarantine policy.

<a id="question-4"></a>

## 4. Chọn partition key thế nào?

**Câu trả lời mẫu:** **Conclusion:** key theo entity nhỏ nhất cần ordered processing nhưng vẫn phân phối tốt. **Mechanism:** same key vào same partition. **Trade-off:** high-volume entity tự giới hạn parallelism. **GameStream:** room ID giữ game order mà không áp global order.

<a id="question-5"></a>

## 5. Outbox relay xử lý publish failure thế nào?

**Câu trả lời mẫu:** **Conclusion:** giữ record unpublished, ghi failure/attempt và retry backoff. **Mechanism:** chỉ set `publishedAt` sau broker acknowledgement. **Trade-off:** acknowledgement mất có thể duplicate dù append thành công. **GameStream:** consumer phải dedupe ngay cả khi producer idempotent.

<a id="question-6"></a>

## 6. Dead-letter queue là gì?

**Câu trả lời mẫu:** **Conclusion:** DLQ quarantine record không xử lý được sau policy-defined attempts. **Mechanism:** lưu original envelope, error, context vào topic riêng. **Trade-off:** move record có thể phá partition order và không thay repair. **GameStream:** poison search event cần alert, replay tool và quyết định về room event sau đó.

<a id="question-7"></a>

## 7. Event schema evolve thế nào?

**Câu trả lời mẫu:** **Conclusion:** dùng versioned envelope và additive backward-compatible change khi có thể. **Mechanism:** consumer validate schema version; deploy tolerant reader trước writer mới. **Trade-off:** breaking change cần parallel topic/adapter. **GameStream:** `.v1` topic và `schemaVersion` làm compatibility explicit.

<a id="question-8"></a>

## 8. Kafka transaction cung cấp gì?

**Câu trả lời mẫu:** **Conclusion:** Kafka transaction atomically publish record/offset trong Kafka cho read-process-write semantics. **Mechanism:** transactional producer coordinate commit với broker. **Trade-off:** không atomically gồm MongoDB/Elasticsearch. **GameStream:** MongoDB outbox vẫn cần cho cross-system consistency.

<a id="question-9"></a>

## 9. Batching và compression ảnh hưởng performance thế nào?

**Câu trả lời mẫu:** **Conclusion:** batch lớn/compression tăng throughput và network efficiency. **Mechanism:** producer chờ ngắn để gom record. **Trade-off:** thêm latency và memory. **GameStream:** tune event volume nhưng giữ roll-to-realtime trong SLO.

<a id="question-10"></a>

## 10. Retention khác acknowledgement thế nào?

**Câu trả lời mẫu:** **Conclusion:** retention quyết định Kafka giữ record bao lâu bất kể group đã consume. **Mechanism:** group giữ offset độc lập. **Trade-off:** retention dài tốn disk nhưng cho replay. **GameStream:** retention phải dài hơn maximum projection recovery window.

<a id="question-11"></a>

## 11. Áp backpressure cho producer thế nào?

**Câu trả lời mẫu:** **Conclusion:** bound outbox growth, producer concurrency/retry và degrade optional work trước khi đầy storage. **Mechanism:** monitor age/depth và throttle command source tại safe threshold. **Trade-off:** reject command ảnh hưởng user nhưng backlog mất kiểm soát đe doạ recovery. **GameStream:** alert oldest unpublished event, không chỉ count.

<a id="question-12"></a>

## 12. Xử lý poison message mà không mất order thế nào?

**Câu trả lời mẫu:** **Conclusion:** retry bounded, chẩn đoán schema/business failure, rồi pause, quarantine với order policy hoặc fix/replay. **Mechanism:** later record cùng partition có thể phụ thuộc failed version. **Trade-off:** availability cạnh tranh strict order. **GameStream:** room version N+1 không project trước N trừ khi full-state upsert làm an toàn.

<a id="question-13"></a>

## 13. Kafka event envelope nên chứa gì?

**Câu trả lời mẫu:** **Conclusion:** unique ID, type, aggregate ID/version, occurred time, correlation/causation ID, schema version và payload. **Mechanism:** metadata hỗ trợ dedupe, ordering, tracing, evolution. **Trade-off:** envelope thêm bytes. **GameStream:** shared `IntegrationEvent` đã có các field này.

<a id="question-14"></a>

## 14. Kafka metric nào quan trọng?

**Câu trả lời mẫu:** **Conclusion:** broker availability, under-replicated partition, request latency/error, disk, producer retry, consumer lag và rebalance frequency. **Mechanism:** kết hợp infrastructure với end-to-end event age. **Trade-off:** lag threshold thay đổi theo traffic. **GameStream:** projection freshness actionable hơn fixed record threshold.

<a id="question-15"></a>

## 15. Vì sao so Kafka, RabbitMQ, ZeroMQ theo semantics?

**Câu trả lời mẫu:** **Conclusion:** Kafka là retained log, RabbitMQ là broker/queue routing mạnh, ZeroMQ là messaging library thường không có durable central broker. **Mechanism:** routing, persistence, consumption model khác nhau. **Trade-off:** không tool nào thắng mọi use case. **GameStream:** durable multi-consumer replay làm Kafka phù hợp.

## Bảng thuật ngữ kỹ thuật

| Technical term      | Nghĩa tiếng Việt              | Giải thích đơn giản                                                     |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| Idempotent consumer | Consumer có tính lũy đẳng     | Xử lý lại cùng event mà không tạo business effect lặp.                  |
| Rebalance           | Phân bổ lại partition         | Kafka thay đổi partition assignment khi member hoặc topic thay đổi.     |
| Offset commit       | Xác nhận vị trí đọc           | Lưu vị trí consumer đã xử lý để tiếp tục sau restart.                   |
| Partition key       | Khóa phân vùng                | Key quyết định record liên quan được đưa vào cùng partition.            |
| Outbox relay        | Tiến trình chuyển tiếp outbox | Đọc event đã commit trong database rồi publish tới Kafka.               |
| Publish failure     | Lỗi xuất bản                  | Producer không nhận được xác nhận rằng broker đã lưu record.            |
| Dead-letter queue   | Hàng đợi thư lỗi              | Nơi cách ly message không thể xử lý sau retry policy.                   |
| Schema evolution    | Tiến hóa schema               | Thay đổi event contract mà vẫn quản lý consumer cũ.                     |
| Kafka transaction   | Giao dịch Kafka               | Nhóm thao tác Kafka có thể được commit atomically trong phạm vi hỗ trợ. |
| Batching            | Gom lô                        | Gộp nhiều record để giảm overhead và tăng throughput.                   |
| Compression         | Nén dữ liệu                   | Giảm network/disk đổi lại CPU để nén và giải nén.                       |
| Retention           | Thời gian lưu giữ             | Khoảng thời gian hoặc dung lượng Kafka giữ record.                      |
| Acknowledgement     | Xác nhận ghi                  | Mức broker xác nhận record đã được lưu.                                 |
| Poison message      | Thông điệp gây lỗi lặp        | Message luôn làm consumer thất bại nếu không được cách ly hoặc sửa.     |
| Event envelope      | Vỏ bọc sự kiện                | Metadata chuẩn bao quanh payload như ID, version và correlation.        |
