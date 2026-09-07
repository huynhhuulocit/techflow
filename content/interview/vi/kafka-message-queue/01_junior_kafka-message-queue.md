# Junior — Câu hỏi phỏng vấn Kafka và message queue

## Mục lục câu hỏi

1. [Message queue giải quyết vấn đề gì?](#question-1)
2. [Apache Kafka là gì?](#question-2)
3. [Topic là gì?](#question-3)
4. [Partition là gì?](#question-4)
5. [Producer, consumer và broker là gì?](#question-5)
6. [Consumer group là gì?](#question-6)
7. [Offset là gì?](#question-7)
8. [Kafka guarantee ordering gì?](#question-8)
9. [At-most-once và at-least-once là gì?](#question-9)
10. [Vì sao Kafka record cần key?](#question-10)
11. [Kafka khác traditional work queue thế nào?](#question-11)
12. [Idempotent producer là gì?](#question-12)
13. [Transactional outbox pattern là gì?](#question-13)
14. [Consumer lag là gì?](#question-14)
15. [Vì sao không dùng Kafka cho mọi service call?](#question-15)

<a id="question-1"></a>

## 1. Message queue giải quyết vấn đề gì?

**Câu trả lời mẫu:** **Conclusion:** messaging tách producer khỏi consumer theo thời gian, deployment và throughput. **Mechanism:** producer ghi message vào broker, consumer xử lý async. **Trade-off:** thêm eventual consistency, duplicate và operational complexity. **GameStream:** room command không chờ search/realtime projection hoàn tất.

<a id="question-2"></a>

## 2. Apache Kafka là gì?

**Câu trả lời mẫu:** **Conclusion:** Kafka là distributed durable event-log platform. **Mechanism:** record append vào partitioned topic và được retain theo cấu hình. **Trade-off:** nặng hơn in-memory queue đơn giản. **GameStream:** Kafka mang room, game và chat integration event có version.

<a id="question-3"></a>

## 3. Topic là gì?

**Câu trả lời mẫu:** **Conclusion:** topic là named stream của các record liên quan. **Mechanism:** nó chia thành partition và có nhiều consumer group độc lập. **Trade-off:** quá nhiều topic thiếu governance làm operations phức tạp. **GameStream:** `room.events.v1`, `game.events.v1`, `chat.events.v1` tách event family.

<a id="question-4"></a>

## 4. Partition là gì?

**Câu trả lời mẫu:** **Conclusion:** partition là ordered append-only sequence và đơn vị parallelism của Kafka. **Mechanism:** mỗi record nhận offset trong một partition. **Trade-off:** ordering chỉ guarantee trong partition. **GameStream:** event của cùng room dùng room ID key để chung order.

<a id="question-5"></a>

## 5. Producer, consumer và broker là gì?

**Câu trả lời mẫu:** **Conclusion:** producer ghi, consumer đọc, broker lưu/serve partition. **Mechanism:** client discover partition leader và trao đổi batch. **Trade-off:** retry/config broker ảnh hưởng guarantee. **GameStream:** outbox relay produce; projection consume; Kafka container là local broker.

<a id="question-6"></a>

## 6. Consumer group là gì?

**Câu trả lời mẫu:** **Conclusion:** consumer group chia workload để mỗi partition được một group member xử lý. **Mechanism:** Kafka assign partition giữa active member. **Trade-off:** parallelism không vượt partition count. **GameStream:** realtime và search là group riêng nên đều nhận mọi event.

<a id="question-7"></a>

## 7. Offset là gì?

**Câu trả lời mẫu:** **Conclusion:** offset xác định vị trí record trong partition. **Mechanism:** group commit processed offset và resume từ đó. **Trade-off:** timing commit quyết định duplicate/loss risk. **GameStream:** chỉ commit sau khi Redis/Elasticsearch projection thành công.

<a id="question-8"></a>

## 8. Kafka guarantee ordering gì?

**Câu trả lời mẫu:** **Conclusion:** Kafka giữ order trong partition, không phải toàn topic. **Mechanism:** producer key chọn partition, offset định sequence. **Trade-off:** global order giảm scalability. **GameStream:** per-room ordering đủ vì room là aggregate độc lập.

<a id="question-9"></a>

## 9. At-most-once và at-least-once là gì?

**Câu trả lời mẫu:** **Conclusion:** at-most-once có thể mất nhưng không redelivery; at-least-once tránh mất nhưng có thể duplicate. **Mechanism:** commit trước processing có loss risk, commit sau có duplicate risk. **Trade-off:** business system thường chọn at-least-once cùng idempotency. **GameStream:** projector phải chịu duplicate event.

<a id="question-10"></a>

## 10. Vì sao Kafka record cần key?

**Câu trả lời mẫu:** **Conclusion:** key tạo stable partitioning và thường giữ aggregate ordering. **Mechanism:** partitioner hash key. **Trade-off:** skewed key tạo hot partition. **GameStream:** outbox record dùng `roomId` làm Kafka key.

<a id="question-11"></a>

## 11. Kafka khác traditional work queue thế nào?

**Câu trả lời mẫu:** **Conclusion:** Kafka giữ log sau consumption và cho independent group replay; nhiều work queue acknowledge/remove từng message. **Mechanism:** offset là vị trí thuộc consumer. **Trade-off:** per-message routing có thể đơn giản hơn với RabbitMQ. **GameStream:** replayable projection phù hợp Kafka.

<a id="question-12"></a>

## 12. Idempotent producer là gì?

**Câu trả lời mẫu:** **Conclusion:** idempotent producer ngăn duplicate log entry do producer retry trong supported session semantics. **Mechanism:** broker sequence number deduplicate batch retry. **Trade-off:** không làm downstream business effect exactly once. **GameStream:** KafkaJS producer bật idempotence, consumer vẫn deduplicate.

<a id="question-13"></a>

## 13. Transactional outbox pattern là gì?

**Câu trả lời mẫu:** **Conclusion:** lưu business change và message-to-publish trong cùng DB transaction rồi relay sau. **Mechanism:** worker scan committed unpublished record. **Trade-off:** publication có thể lặp và cần monitoring/cleanup. **GameStream:** MongoDB atomically lưu room state và Kafka event envelope.

<a id="question-14"></a>

## 14. Consumer lag là gì?

**Câu trả lời mẫu:** **Conclusion:** lag là khoảng cách giữa latest partition offset và committed position của group. **Mechanism:** nó ước lượng backlog chưa xử lý. **Trade-off:** record count không đồng nghĩa time delay. **GameStream:** admin dashboard báo lag của realtime/search group.

<a id="question-15"></a>

## 15. Vì sao không dùng Kafka cho mọi service call?

**Câu trả lời mẫu:** **Conclusion:** async messaging sai khi caller cần immediate authoritative response. **Mechanism:** queue tách completion khỏi request lifecycle. **Trade-off:** decoupling tốt hơn nhưng request/reply phức tạp. **GameStream:** start/roll dùng HTTP/MongoDB sync; discovery update dùng Kafka.

## Bảng thuật ngữ kỹ thuật

| Technical term      | Nghĩa tiếng Việt          | Giải thích đơn giản                                           |
| ------------------- | ------------------------- | ------------------------------------------------------------- |
| Message queue       | Hàng đợi thông điệp       | Cơ chế tách producer và consumer bằng message trung gian.     |
| Apache Kafka        | Nền tảng Kafka            | Distributed retained log cho event có partition và replay.    |
| Topic               | Chủ đề                    | Luồng logic nơi producer ghi và consumer đọc record.          |
| Partition           | Phân vùng                 | Chuỗi record có thứ tự và là đơn vị song song của Kafka.      |
| Producer            | Bên sản xuất              | Application gửi record vào broker.                            |
| Consumer            | Bên tiêu thụ              | Application đọc và xử lý record.                              |
| Broker              | Máy chủ môi giới          | Kafka server lưu và phục vụ partition.                        |
| Consumer group      | Nhóm consumer             | Nhóm instance chia partition để xử lý song song.              |
| Offset              | Vị trí bản ghi            | Số thứ tự của record trong một partition.                     |
| Ordering guarantee  | Bảo đảm thứ tự            | Kafka giữ thứ tự trong từng partition, không phải toàn topic. |
| At-most-once        | Tối đa một lần            | Message có thể mất nhưng không bị xử lý lặp.                  |
| At-least-once       | Ít nhất một lần           | Message không dễ mất nhưng có thể được xử lý lặp.             |
| Record key          | Khóa bản ghi              | Giá trị thường dùng để chọn partition ổn định.                |
| Idempotent producer | Producer có tính lũy đẳng | Giảm duplicate do producer retry trong phạm vi Kafka hỗ trợ.  |
| Consumer lag        | Độ trễ consumer           | Khoảng cách giữa offset mới nhất và offset consumer đã xử lý. |
