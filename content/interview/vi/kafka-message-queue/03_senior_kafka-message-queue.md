# Senior — Câu hỏi phỏng vấn Kafka và message queue

## Mục lục câu hỏi

1. [“Exactly once” nghĩa gì trong heterogeneous system?](#question-1)
2. [Chọn partition count thế nào?](#question-2)
3. [Giữ per-aggregate order khi scale thế nào?](#question-3)
4. [Broker setting nào quyết định durability?](#question-4)
5. [Deploy Kafka đa region thế nào?](#question-5)
6. [Replay projection an toàn thế nào?](#question-6)
7. [Giảm hot partition thế nào?](#question-7)
8. [Race nào tồn tại giữa publish và mark outbox published?](#question-8)
9. [Governance event contract thế nào?](#question-9)
10. [Kafka failure mode phổ biến là gì?](#question-10)
11. [Capacity-plan Kafka thế nào?](#question-11)
12. [Ứng phó consumer lag tăng nhanh thế nào?](#question-12)
13. [Khi nào RabbitMQ phù hợp hơn?](#question-13)
14. [Tránh coupling consumer vào producer internal thế nào?](#question-14)
15. [Khi nào Kafka justify service boundary riêng?](#question-15)

<a id="question-1"></a>

## 1. “Exactly once” nghĩa gì trong heterogeneous system?

**Câu trả lời mẫu:** **Conclusion:** phải định nghĩa boundary; Kafka transaction không guarantee một business effect xuyên MongoDB, Redis, Elasticsearch. **Mechanism:** atomic outbox, at-least-once delivery và versioned idempotent consumer tạo effectively-once outcome. **Trade-off:** coordination mạnh giảm availability/throughput. **GameStream:** correctness chứng minh theo room version, không theo marketing term.

<a id="question-2"></a>

## 2. Chọn partition count thế nào?

**Câu trả lời mẫu:** **Conclusion:** size theo peak consumer parallelism, throughput, key distribution và growth, đồng thời tính metadata/recovery cost. **Mechanism:** một group member xử lý partition tại một thời điểm. **Trade-off:** tăng partition có thể đổi key mapping/order; giảm rất khó. **GameStream:** ba local partition là learning default, không phải production sizing evidence.

<a id="question-3"></a>

## 3. Giữ per-aggregate order khi scale thế nào?

**Câu trả lời mẫu:** **Conclusion:** key nhất quán theo aggregate và parallelise giữa aggregate. **Mechanism:** room event vào một partition và một consumer mỗi lúc. **Trade-off:** hot room vẫn serial. **GameStream:** state transition phải theo version order nên per-room serialisation là đúng.

<a id="question-4"></a>

## 4. Broker setting nào quyết định durability?

**Câu trả lời mẫu:** **Conclusion:** replication factor, `min.insync.replicas`, producer acknowledgement và unclean election policy cùng quyết định loss risk. **Mechanism:** `acks=all` cần đủ in-sync replica. **Trade-off:** durability mạnh giảm availability khi replica fail. **GameStream:** replication factor một trong Compose không có production durability.

<a id="question-5"></a>

## 5. Deploy Kafka đa region thế nào?

**Câu trả lời mẫu:** **Conclusion:** ưu tiên cluster local theo region với async replication/ownership rõ thay vì stretched cluster latency cao. **Mechanism:** replicate selected topic và xử lý duplicate/conflict semantics. **Trade-off:** failover có thể mất recent event trong RPO. **GameStream:** command/event ownership của room nằm một region.

<a id="question-6"></a>

## 6. Replay projection an toàn thế nào?

**Câu trả lời mẫu:** **Conclusion:** dùng consumer group mới hoặc reset offset vào versioned target, idempotent write, validate rồi switch. **Mechanism:** Kafka retention giữ input record. **Trade-off:** replay cạnh tranh live work và retention có thể thiếu. **GameStream:** rebuild search bằng index alias mới, không mutate authoritative room state.

<a id="question-7"></a>

## 7. Giảm hot partition thế nào?

**Câu trả lời mẫu:** **Conclusion:** xác nhận key skew rồi giảm event volume, isolate exceptional key hoặc redesign aggregate boundary mà không phá order cần thiết. **Mechanism:** random suffix tăng parallelism nhưng mất per-key order. **Trade-off:** hot-key path riêng tăng complexity. **GameStream:** viral room nên rate limit trước khi nới room ordering.

<a id="question-8"></a>

## 8. Race nào tồn tại giữa publish và mark outbox published?

**Câu trả lời mẫu:** **Conclusion:** crash sau Kafka append trước Mongo update gây republish. **Mechanism:** không có atomic transaction xuyên hai system. **Trade-off:** chấp nhận duplicate đơn giản hơn distributed commit. **GameStream:** stable `eventId` và version-aware projector làm race vô hại.

<a id="question-9"></a>

## 9. Governance event contract thế nào?

**Câu trả lời mẫu:** **Conclusion:** có owner, compatibility rule, schema review, deprecation window và consumer inventory. **Mechanism:** automated compatibility check chặn unsafe change. **Trade-off:** governance làm change chậm nhưng bảo vệ independent deployment. **GameStream:** shared TypeScript/Zod là khởi đầu; production có thể thêm schema registry.

<a id="question-10"></a>

## 10. Kafka failure mode phổ biến là gì?

**Câu trả lời mẫu:** **Conclusion:** broker loss, ISR shrink, disk full, network partition, rebalance storm, poison record, producer retry storm và runaway lag là incident khác nhau. **Mechanism:** mỗi loại ảnh hưởng availability, durability hoặc freshness. **Trade-off:** alert “Kafka down” chung là không đủ. **GameStream:** dashboard cần broker health, outbox age, group lag và projection health.

<a id="question-11"></a>

## 11. Capacity-plan Kafka thế nào?

**Câu trả lời mẫu:** **Conclusion:** model ingress/egress byte, retention, replication, partition count, peak replay, consumer fan-out và failure headroom. **Mechanism:** mỗi independent group đọc lại log. **Trade-off:** retention dài/nhiều group nhân disk/network. **GameStream:** chat có thể chi phối event volume và cần analysis khác room state.

<a id="question-12"></a>

## 12. Ứng phó consumer lag tăng nhanh thế nào?

**Câu trả lời mẫu:** **Conclusion:** bảo vệ durability và xác định producer spike, slow dependency, bad event, rebalance hay thiếu capacity. **Mechanism:** xem lag từng partition/processing latency rồi scale hoặc pause an toàn. **Trade-off:** thêm consumer chỉ giúp tới partition count. **GameStream:** degrade search freshness trước khi drop room event.

<a id="question-13"></a>

## 13. Khi nào RabbitMQ phù hợp hơn?

**Câu trả lời mẫu:** **Conclusion:** RabbitMQ tốt cho complex routing, per-message acknowledgement, priority, short-lived task queue hoặc ít nhu cầu replay. **Mechanism:** exchange route message tới queue được consume destructively. **Trade-off:** retained-log replay không phải trọng tâm. **GameStream:** future email/job queue có thể dùng RabbitMQ; integration event vẫn Kafka.

<a id="question-14"></a>

## 14. Tránh coupling consumer vào producer internal thế nào?

**Câu trả lời mẫu:** **Conclusion:** publish business fact có semantic ổn định, không publish database change hoặc class serialization detail. **Mechanism:** anti-corruption mapper dựng versioned event DTO. **Trade-off:** mapping tường minh tốn design effort. **GameStream:** publish `game.rolled` với business field, không raw MongoDB document.

<a id="question-15"></a>

## 15. Khi nào Kafka justify service boundary riêng?

**Câu trả lời mẫu:** **Conclusion:** nó hỗ trợ async consumer độc lập nhưng Kafka không tự biến module thành microservice. **Mechanism:** service còn cần data ownership, deployability và operational responsibility. **Trade-off:** network consumer thêm eventual consistency/incident surface. **GameStream:** worker deploy riêng vì projection scale/fail độc lập; rooms vẫn một business backend.

## Bảng thuật ngữ kỹ thuật

| Technical term          | Nghĩa tiếng Việt             | Giải thích đơn giản                                                              |
| ----------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| Exactly-once semantics  | Ngữ nghĩa đúng một lần       | Guarantee phải xác định rõ phạm vi; không tự bao phủ effect ngoài Kafka.         |
| Heterogeneous system    | Hệ thống nhiều công nghệ     | Luồng xử lý đi qua database, broker và service có transaction khác nhau.         |
| Partition count         | Số lượng partition           | Giới hạn parallelism và ảnh hưởng chi phí broker.                                |
| Per-aggregate ordering  | Thứ tự theo aggregate        | Giữ event của cùng entity trong một chuỗi có thứ tự.                             |
| Replication factor      | Hệ số sao chép               | Số bản sao của mỗi partition trên broker.                                        |
| In-sync replica         | Bản sao còn đồng bộ          | Replica theo kịp leader trong giới hạn Kafka quy định.                           |
| Multi-region deployment | Triển khai đa vùng           | Vận hành Kafka và replicate event giữa nhiều khu vực.                            |
| Projection replay       | Phát lại để dựng projection  | Đọc lại event cũ để tái tạo read model.                                          |
| Hot partition           | Partition nóng               | Một partition nhận tải cao hơn phần còn lại.                                     |
| Outbox race             | Điều kiện tranh đua outbox   | Crash giữa publish và mark-published có thể gây gửi lặp.                         |
| Contract governance     | Quản trị hợp đồng            | Quy trình owner, review, compatibility và deprecation cho event.                 |
| Broker failure mode     | Kiểu sự cố broker            | Disk full, leader loss, partition hoặc ISR shrink ảnh hưởng guarantee khác nhau. |
| Capacity planning       | Lập kế hoạch năng lực        | Ước lượng throughput, retention, disk, network và partition.                     |
| Internal coupling       | Liên kết vào chi tiết nội bộ | Consumer phụ thuộc cấu trúc riêng của producer thay vì stable contract.          |
| Service boundary        | Ranh giới dịch vụ            | Boundary ownership và deployment được justify bằng nhu cầu rõ ràng.              |
