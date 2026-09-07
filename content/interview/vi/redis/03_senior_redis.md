# Senior — Câu hỏi phỏng vấn Redis

## Mục lục câu hỏi

1. [Một Redis deployment có nên phục vụ cache, lock, session, Stream?](#question-1)
2. [Sentinel khác Redis Cluster thế nào?](#question-2)
3. [Redis Streams có guarantee exactly once không?](#question-3)
4. [Distributed lock có đủ cho correctness không?](#question-4)
5. [Khi nào dùng Redis Streams thay Kafka?](#question-5)
6. [Eviction policy tương tác mixed workload thế nào?](#question-6)
7. [Consistency issue nào xảy ra khi failover?](#question-7)
8. [Giảm hot key thế nào?](#question-8)
9. [Redis hoạt động đa region thế nào?](#question-9)
10. [Bảo mật Redis thế nào?](#question-10)
11. [Capacity-plan Redis memory thế nào?](#question-11)
12. [Xử lý Redis latency incident thế nào?](#question-12)
13. [Chứng minh reconnect recovery bounded thế nào?](#question-13)
14. [AOF thêm durability gì?](#question-14)
15. [Evidence nào justify tách realtime coordination?](#question-15)

<a id="question-1"></a>

## 1. Một Redis deployment có nên phục vụ cache, lock, session, Stream?

**Câu trả lời mẫu:** **Conclusion:** chỉ khi failure, eviction và capacity policy tương thích; nếu không phải isolate workload. **Mechanism:** noisy cache có thể ăn memory/latency của security data. **Trade-off:** cluster riêng tốn hơn. **GameStream:** production có thể tách disposable cache khỏi auth session/recovery Stream.

<a id="question-2"></a>

## 2. Sentinel khác Redis Cluster thế nào?

**Câu trả lời mẫu:** **Conclusion:** Sentinel failover replicated primary không sharding; Cluster sharding và per-shard failover. **Mechanism:** client discover promoted primary hoặc slot owner. **Trade-off:** Cluster giới hạn multi-key operation và phức tạp topology. **GameStream:** chọn theo measured memory/throughput.

<a id="question-3"></a>

## 3. Redis Streams có guarantee exactly once không?

**Câu trả lời mẫu:** **Conclusion:** không end-to-end; pending/ack thường cho at-least-once. **Mechanism:** crash sau effect trước ack gây redelivery. **Trade-off:** consumer dedupe bắt buộc. **GameStream:** event ID/aggregate version làm repeated work hội tụ.

<a id="question-4"></a>

## 4. Distributed lock có đủ cho correctness không?

**Câu trả lời mẫu:** **Conclusion:** lease một mình không an toàn cho irreversible effect; cần fencing token hoặc authoritative conditional write. **Mechanism:** downstream reject operation có monotonically older token. **Trade-off:** fencing cần system support. **GameStream:** Mongo expected-version bảo vệ game tốt hơn Redis lock.

<a id="question-5"></a>

## 5. Khi nào dùng Redis Streams thay Kafka?

**Câu trả lời mẫu:** **Conclusion:** Streams hợp low-latency bounded data gần Redis và deployment đơn giản; Kafka hợp durable large-scale multi-consumer replay. **Mechanism:** cả hai retained ordered entry nhưng khác partition/storage/ecosystem. **Trade-off:** overlap không rõ role nhân complexity. **GameStream:** Streams cho short socket recovery; Kafka cho integration projection.

<a id="question-6"></a>

## 6. Eviction policy tương tác mixed workload thế nào?

**Câu trả lời mẫu:** **Conclusion:** cache eviction có thể xoá coordination/session; `noeviction` lại gây write failure. **Mechanism:** memory pressure áp toàn server. **Trade-off:** isolation hoặc reserved memory tốn chi phí. **GameStream:** phải định nghĩa failure policy riêng trước production.

<a id="question-7"></a>

## 7. Consistency issue nào xảy ra khi failover?

**Câu trả lời mẫu:** **Conclusion:** async replication có thể mất acknowledged write tuỳ topology/timing. **Mechanism:** replica promote trước khi nhận latest command. **Trade-off:** chờ replica giảm risk nhưng không tạo consensus guarantee. **GameStream:** Redis không là sole record của completed roll/refresh rotation nếu chưa chấp nhận risk.

<a id="question-8"></a>

## 8. Giảm hot key thế nào?

**Câu trả lời mẫu:** **Conclusion:** detect skew, giảm polling, cache local, dùng read replica hoặc partition counter khi semantics cho phép. **Mechanism:** một key thuộc một Redis execution path/shard. **Trade-off:** split key phức tạp aggregation/atomicity. **GameStream:** popular public-room key dùng L1 và request coalescing.

<a id="question-9"></a>

## 9. Redis hoạt động đa region thế nào?

**Câu trả lời mẫu:** **Conclusion:** giữ latency-sensitive transient state local theo region và định nghĩa conflict/expiry semantics cho replicated data. **Mechanism:** async multi-region replication eventually consistent. **Trade-off:** global strong consistency hại latency/availability. **GameStream:** presence regional/approximate; Mongo room ownership giữ truth.

<a id="question-10"></a>

## 10. Bảo mật Redis thế nào?

**Câu trả lời mẫu:** **Conclusion:** private network, TLS, ACL, secret rotation, command restriction và không expose client trực tiếp. **Mechanism:** identity chỉ có key/command access cần thiết. **Trade-off:** ACL/prefix governance thêm work. **GameStream:** local unauthenticated Redis không được đưa thẳng lên production.

<a id="question-11"></a>

## 11. Capacity-plan Redis memory thế nào?

**Câu trả lời mẫu:** **Conclusion:** estimate key/value/metadata, replication/AOF buffer, fragmentation, peak TTL overlap và growth margin. **Mechanism:** đo `MEMORY USAGE` trên key đại diện. **Trade-off:** raw payload size underestimates RAM. **GameStream:** event Stream/auth session cần max count/retention rõ.

<a id="question-12"></a>

## 12. Xử lý Redis latency incident thế nào?

**Câu trả lời mẫu:** **Conclusion:** tìm blocking command, hot key, fork/persistence, network, CPU, memory pressure hoặc client storm rồi bảo vệ critical role. **Mechanism:** dùng latency/slow log và command stat. **Trade-off:** tắt cache có thể overload MongoDB. **GameStream:** rate-limit scan/dashboard trước auth/realtime coordination.

<a id="question-13"></a>

## 13. Chứng minh reconnect recovery bounded thế nào?

**Câu trả lời mẫu:** **Conclusion:** định nghĩa max disconnect duration/entry count và test dưới, tại, trên boundary. **Mechanism:** Streams serve recent offset; Mongo snapshot/version repair gap dài. **Trade-off:** window lớn tốn memory. **GameStream:** client không được giả định Stream recovery luôn thành công.

<a id="question-14"></a>

## 14. AOF thêm durability gì?

**Câu trả lời mẫu:** **Conclusion:** AOF tăng restart recovery bằng write log, loss bound theo fsync policy. **Mechanism:** Redis replay log lúc startup. **Trade-off:** fsync frequency đổi durability lấy latency. **GameStream:** AOF giúp transient recovery nhưng không đổi data ownership.

<a id="question-15"></a>

## 15. Evidence nào justify tách realtime coordination?

**Câu trả lời mẫu:** **Conclusion:** independent socket scale, connection lifecycle, Redis topology và failure isolation có thể justify realtime service. **Mechanism:** stable event contract tách nó khỏi room command. **Trade-off:** auth/membership check thành distributed. **GameStream:** chỉ extract sau khi đo gateway load và định nghĩa authoritative membership API.

## Bảng thuật ngữ kỹ thuật

| Technical term           | Nghĩa tiếng Việt             | Giải thích đơn giản                                                                |
| ------------------------ | ---------------------------- | ---------------------------------------------------------------------------------- |
| Workload isolation       | Cô lập workload              | Tách cache, lock, session hoặc stream để tránh ảnh hưởng lẫn nhau.                 |
| Redis Sentinel           | Cơ chế Sentinel              | Theo dõi primary/replica và tự động failover nhưng không sharding.                 |
| Redis Cluster            | Cụm Redis phân mảnh          | Chia dữ liệu thành hash slot trên nhiều primary.                                   |
| Exactly-once             | Đúng một lần                 | Guarantee một message tạo đúng một effect; Redis Streams không tự cung cấp đầy đủ. |
| Correctness primitive    | Cơ chế bảo đảm tính đúng     | Điều kiện cuối cùng bảo vệ invariant, thường phải nằm ở authoritative store.       |
| Mixed workload           | Tải hỗn hợp                  | Nhiều loại dữ liệu với yêu cầu memory và eviction khác nhau dùng chung Redis.      |
| Failover                 | Chuyển đổi dự phòng          | Chuyển traffic sang node khác khi node hiện tại lỗi.                               |
| Hot key                  | Khóa nóng                    | Một key nhận lượng truy cập quá lớn và tạo bottleneck.                             |
| Multi-region replication | Sao chép đa vùng             | Đồng bộ dữ liệu Redis giữa các khu vực địa lý.                                     |
| ACL                      | Danh sách kiểm soát truy cập | Quy định user Redis được dùng command và key pattern nào.                          |
| Memory fragmentation     | Phân mảnh bộ nhớ             | Memory thực tế sử dụng cao hơn dữ liệu logic do cách cấp phát.                     |
| Latency incident         | Sự cố độ trễ                 | Giai đoạn command Redis chậm bất thường và ảnh hưởng application.                  |
| Bounded recovery         | Phục hồi có giới hạn         | Chỉ đảm bảo replay trong một cửa sổ message hoặc thời gian xác định.               |
| AOF                      | Tệp chỉ ghi nối tiếp         | Redis ghi lại command thay đổi dữ liệu để tăng khả năng phục hồi.                  |
| Realtime coordination    | Điều phối thời gian thực     | Phối hợp presence, fan-out và recovery giữa nhiều instance.                        |
