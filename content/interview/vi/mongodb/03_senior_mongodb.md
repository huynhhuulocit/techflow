# Senior — Câu hỏi phỏng vấn MongoDB

## Mục lục câu hỏi

1. [Chọn shard key cho room thế nào?](#question-1)
2. [Consistency choice của MongoDB ảnh hưởng game correctness thế nào?](#question-2)
3. [Xử lý unknown transaction commit result thế nào?](#question-3)
4. [MongoDB cùng Kafka có cho exactly-once business effect không?](#question-4)
5. [Outbox relay claim an toàn với nhiều worker thế nào?](#question-5)
6. [Khi nào change stream cải thiện outbox design?](#question-6)
7. [Điều gì xảy ra khi replica-set election?](#question-7)
8. [Cần guarantee gì cho backup/restore?](#question-8)
9. [Multi-region deployment thay đổi model thế nào?](#question-9)
10. [Capacity-plan MongoDB thế nào?](#question-10)
11. [Index write amplification là gì?](#question-11)
12. [GameStream có phải event sourced không?](#question-12)
13. [Rebuild projection mà không ảnh hưởng command thế nào?](#question-13)
14. [Data ownership sau microservice extraction nên thế nào?](#question-14)
15. [Ứng phó MongoDB latency tăng trong game incident thế nào?](#question-15)

<a id="question-1"></a>

## 1. Chọn shard key cho room thế nào?

**Câu trả lời mẫu:** **Conclusion:** chọn key cardinality cao, phân phối đều, khớp routing pattern và tránh range tăng đơn điệu bị hot. **Mechanism:** shard key quyết định placement và targeted query. **Trade-off:** room ID phân phối write nhưng global public-room query scatter. **GameStream:** chỉ shard sau khi có số liệu; cân nhắc room ID cho command locality và search projection riêng.

<a id="question-2"></a>

## 2. Consistency choice của MongoDB ảnh hưởng game correctness thế nào?

**Câu trả lời mẫu:** **Conclusion:** correctness phụ thuộc read/write concern và vị trí read, không chỉ tên database. **Mechanism:** majority acknowledgement và primary read giảm rollback/staleness; snapshot transaction đồng bộ multi-document read. **Trade-off:** consistency mạnh tốn latency/availability khi partition. **GameStream:** command response và resume ưu tiên correctness hơn stale secondary read.

<a id="question-3"></a>

## 3. Xử lý unknown transaction commit result thế nào?

**Câu trả lời mẫu:** **Conclusion:** không được giả định lỗi nghĩa rollback; retry commit hoặc query bằng idempotency key. **Mechanism:** server có thể đã commit nhưng acknowledgement bị mất. **Trade-off:** recovery cần command identity bền vững. **GameStream:** unique receipt cho phép retried command trả room view đã commit.

<a id="question-4"></a>

## 4. MongoDB cùng Kafka có cho exactly-once business effect không?

**Câu trả lời mẫu:** **Conclusion:** không tự động end-to-end; thiết kế effectively-once bằng atomic outbox và idempotent consumer. **Mechanism:** at-least-once relay có thể duplicate; consumer deduplicate theo event ID/version. **Trade-off:** dedupe state và replay procedure tốn chi phí. **GameStream:** projection upsert theo stable room/event identity để duplicate delivery hội tụ.

<a id="question-5"></a>

## 5. Outbox relay claim an toàn với nhiều worker thế nào?

**Câu trả lời mẫu:** **Conclusion:** worker cần atomic claiming hoặc partition ownership để tránh publish trùng không kiểm soát. **Mechanism:** lease field với conditional update, change stream hoặc single elected relay. **Trade-off:** lease cần expiry/recovery; vẫn phải chịu duplicate. **GameStream:** poller đơn giản hợp một worker, nhưng cần claim protocol trước khi scale replica.

<a id="question-6"></a>

## 6. Khi nào change stream cải thiện outbox design?

**Câu trả lời mẫu:** **Conclusion:** change stream giảm polling latency/load trong khi outbox vẫn là integration contract. **Mechanism:** watch committed insert và resume bằng token. **Trade-off:** phải xử lý invalid resume token và catch-up scan. **GameStream:** dùng change stream làm relay trigger, không thay explicit outbox payload.

<a id="question-7"></a>

## 7. Điều gì xảy ra khi replica-set election?

**Câu trả lời mẫu:** **Conclusion:** primary cũ dừng nhận write, primary mới được bầu và client thấy transient error. **Mechanism:** driver discover topology và retry operation được hỗ trợ. **Trade-off:** availability tạm dừng; non-majority write có thể rollback. **GameStream:** idempotent command và transaction retry giúp election recoverable.

<a id="question-8"></a>

## 8. Cần guarantee gì cho backup/restore?

**Câu trả lời mẫu:** **Conclusion:** định nghĩa RPO/RTO và kiểm chứng point-in-time restore, không chỉ tạo backup. **Mechanism:** snapshot cộng oplog history restore một consistent point. **Trade-off:** RPO/RTO thấp tốn storage/ops hơn. **GameStream:** restore drill phải chứng minh room, game event, outbox và receipt nhất quán.

<a id="question-9"></a>

## 9. Multi-region deployment thay đổi model thế nào?

**Câu trả lời mẫu:** **Conclusion:** active-active write vào một room tạo latency/conflict phức tạp; nên affinity room tới một write region. **Mechanism:** route command theo room ownership và replicate read/projection. **Trade-off:** failover tăng RTO hoặc cần consensus đường dài. **GameStream:** media edge có thể global nhưng authoritative game write thuộc region.

<a id="question-10"></a>

## 10. Capacity-plan MongoDB thế nào?

**Câu trả lời mẫu:** **Conclusion:** model working set, data/index growth, read/write rate, connection, replication và peak recovery load. **Mechanism:** đo p95/p99 query latency, cache residency, disk IOPS và replication lag. **Trade-off:** over-indexing có thể ăn RAM hơn data. **GameStream:** retention event/chat/receipt/outbox chi phối tăng trưởng dài hạn hơn room snapshot.

<a id="question-11"></a>

## 11. Index write amplification là gì?

**Câu trả lời mẫu:** **Conclusion:** mỗi document write phải update mọi index liên quan, tăng CPU/I/O/storage. **Mechanism:** B-tree entry được insert/remove/move. **Trade-off:** read speed đổi lấy write throughput. **GameStream:** tránh speculative index trên chat/event volume cao; chỉ giữ measured access path.

<a id="question-12"></a>

## 12. GameStream có phải event sourced không?

**Câu trả lời mẫu:** **Conclusion:** chưa hoàn toàn; current room state là authority và event log dùng recovery/integration. **Mechanism:** command update snapshot và append event trong một transaction. **Trade-off:** read đơn giản hơn nhưng event history có thể không reconstruct mọi historical implementation version. **GameStream:** mô tả đúng là state-based persistence với append-only domain event journal.

<a id="question-13"></a>

## 13. Rebuild projection mà không ảnh hưởng command thế nào?

**Câu trả lời mẫu:** **Conclusion:** replay event vào index/cache namespace version mới, validate rồi switch reader atomically. **Mechanism:** checkpoint và idempotent upsert giúp replay resumable. **Trade-off:** replay tiêu thụ DB/broker capacity. **GameStream:** rebuild `gamestream-rooms-v2` thay vì xoá live index trước.

<a id="question-14"></a>

## 14. Data ownership sau microservice extraction nên thế nào?

**Câu trả lời mẫu:** **Conclusion:** một service sở hữu write vào collection/aggregate; service khác dùng API/event. **Mechanism:** ownership ngăn cross-service transaction và hidden schema coupling. **Trade-off:** local join thành network call/projection. **GameStream:** future room service sở hữu room/game collection; search/realtime chỉ sở hữu derived state.

<a id="question-15"></a>

## 15. Ứng phó MongoDB latency tăng trong game incident thế nào?

**Câu trả lời mẫu:** **Conclusion:** bảo vệ command correctness, xác định query plan, lock/contention, I/O, connection hay replication rồi shed optional load. **Mechanism:** correlate slow operation, pool wait, cache ratio và hot document. **Trade-off:** tắt search/admin query giảm feature nhưng giữ game. **GameStream:** pause rebuild/dashboard nặng trước khi làm yếu expected-version hoặc durability guarantee.

## Bảng thuật ngữ kỹ thuật

| Technical term               | Nghĩa tiếng Việt                | Giải thích đơn giản                                                          |
| ---------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| Shard key                    | Khóa phân mảnh                  | Field quyết định document được phân phối vào shard nào.                      |
| Consistency level            | Mức nhất quán                   | Guarantee về độ mới và sự đồng thuận của dữ liệu được đọc hoặc ghi.          |
| Unknown commit result        | Kết quả commit không xác định   | Client không biết transaction đã commit hay chưa do lỗi mạng.                |
| Exactly-once business effect | Hiệu ứng nghiệp vụ đúng một lần | Một command chỉ tạo một kết quả logic dù delivery hoặc retry bị lặp.         |
| Outbox relay                 | Tiến trình chuyển tiếp outbox   | Worker đọc record outbox và publish sang broker.                             |
| Claiming                     | Nhận quyền xử lý                | Cơ chế để chỉ một worker xử lý một record tại một thời điểm.                 |
| Replica-set election         | Bầu chọn tập bản sao            | Các node chọn primary mới khi primary cũ mất.                                |
| RPO                          | Mục tiêu điểm phục hồi          | Lượng dữ liệu tối đa chấp nhận mất khi sự cố.                                |
| RTO                          | Mục tiêu thời gian phục hồi     | Thời gian tối đa chấp nhận để dịch vụ hoạt động lại.                         |
| Multi-region                 | Đa vùng địa lý                  | Triển khai hệ thống ở nhiều khu vực địa lý.                                  |
| Capacity planning            | Lập kế hoạch năng lực           | Ước lượng CPU, memory, disk và throughput cần thiết.                         |
| Write amplification          | Khuếch đại thao tác ghi         | Một thay đổi logic tạo nhiều lần ghi vật lý do index hoặc replication.       |
| Event sourcing               | Lưu nguồn bằng sự kiện          | Lưu chuỗi event làm nguồn chính để dựng state.                               |
| Projection rebuild           | Dựng lại mô hình đọc            | Tạo lại read model từ dữ liệu hoặc event nguồn.                              |
| Data ownership               | Quyền sở hữu dữ liệu            | Một service chịu trách nhiệm duy nhất cho mutation và invariant của dữ liệu. |
