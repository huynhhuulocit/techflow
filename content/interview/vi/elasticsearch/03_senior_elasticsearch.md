# Senior — Câu hỏi phỏng vấn Elasticsearch

## Mục lục câu hỏi

1. [Size shard thế nào?](#question-1)
2. [Elasticsearch projection có exactly once không?](#question-2)
3. [Thiết kế complete rebuild thế nào?](#question-3)
4. [Vì sao tránh application dual write vào MongoDB và Elasticsearch?](#question-4)
5. [Định nghĩa search consistency SLO thế nào?](#question-5)
6. [Hệ thống nên làm gì khi Elasticsearch red?](#question-6)
7. [Mapping explosion là gì?](#question-7)
8. [Điều gì gây hot shard?](#question-8)
9. [Guard expensive query thế nào?](#question-9)
10. [Implement multi-tenancy thế nào?](#question-10)
11. [Cải thiện relevance an toàn thế nào?](#question-11)
12. [Backup strategy cho Elasticsearch là gì?](#question-12)
13. [Rolling upgrade ảnh hưởng client/mapping thế nào?](#question-13)
14. [Điều tra search p99 cao thế nào?](#question-14)
15. [Khi nào không nên dùng Elasticsearch?](#question-15)

<a id="question-1"></a>

## 1. Size shard thế nào?

**Câu trả lời mẫu:** **Conclusion:** size từ data, recovery time, query parallelism đã đo; tránh tiny-shard overhead và shard quá lớn khó recover. **Mechanism:** mỗi shard là Lucene index có heap/file/coordination cost. **Trade-off:** nhiều shard tăng parallelism nhưng tốn resource. **GameStream:** bắt đầu tối thiểu, chỉ split khi room-search evidence yêu cầu.

<a id="question-2"></a>

## 2. Elasticsearch projection có exactly once không?

**Câu trả lời mẫu:** **Conclusion:** delivery có thể lặp; projection đạt effectively once bằng versioned idempotent write. **Mechanism:** stable ID/aggregate version làm duplicate vô hại và reject stale event. **Trade-off:** cần version metadata/conflict handling. **GameStream:** commit Kafka offset sau version-aware upsert thành công.

<a id="question-3"></a>

## 3. Thiết kế complete rebuild thế nào?

**Câu trả lời mẫu:** **Conclusion:** replay vào versioned index mới, checkpoint, validate count/sample, switch alias rồi retire index cũ. **Mechanism:** immutable input và idempotent bulk write giúp restart an toàn. **Trade-off:** rebuild cạnh tranh live traffic. **GameStream:** throttle replay và vẫn serve search hiện tại.

<a id="question-4"></a>

## 4. Vì sao tránh application dual write vào MongoDB và Elasticsearch?

**Câu trả lời mẫu:** **Conclusion:** hai independent write không commit atomic, tạo partial failure mơ hồ. **Mechanism:** commit MongoDB cùng outbox rồi project async. **Trade-off:** eventual consistency thay immediate search visibility. **GameStream:** room command không phụ thuộc Elasticsearch availability.

<a id="question-5"></a>

## 5. Định nghĩa search consistency SLO thế nào?

**Câu trả lời mẫu:** **Conclusion:** chỉ rõ percentile thời gian từ authoritative commit tới searchable projection. **Mechanism:** correlate event occurrence, Kafka offset và indexed-version timestamp. **Trade-off:** SLO chặt cần worker/refresh capacity cao. **GameStream:** alert projection age/lag, không chỉ Elasticsearch uptime.

<a id="question-6"></a>

## 6. Hệ thống nên làm gì khi Elasticsearch red?

**Câu trả lời mẫu:** **Conclusion:** degrade discovery nhưng giữ room command và direct access. **Mechanism:** circuit-break search, trả degraded response rõ và recover/rebuild async. **Trade-off:** cached result có thể stale. **GameStream:** MongoDB lookup theo room ID và gameplay vẫn hoạt động.

<a id="question-7"></a>

## 7. Mapping explosion là gì?

**Câu trả lời mẫu:** **Conclusion:** dynamic field không kiểm soát tạo quá nhiều mapping, ăn heap và destabilise cluster. **Mechanism:** mỗi field mới thành cluster metadata và Lucene structure. **Trade-off:** strict mapping giảm flexibility. **GameStream:** không index arbitrary user object key; chat body là text, không phải dynamic field.

<a id="question-8"></a>

## 8. Điều gì gây hot shard?

**Câu trả lời mẫu:** **Conclusion:** routing lệch, concentration theo thời gian hoặc skewed query dồn work lên một shard. **Mechanism:** routing key quyết định distribution, popular term tạo read load. **Trade-off:** custom routing tăng locality nhưng có thể tăng skew. **GameStream:** chỉ route sau khi đo room-activity distribution.

<a id="question-9"></a>

## 9. Guard expensive query thế nào?

**Câu trả lời mẫu:** **Conclusion:** giới hạn query shape, result size, timeout, aggregation và shard fan-out. **Mechanism:** expose controlled search API thay vì raw Query DSL. **Trade-off:** guardrail hạn chế advanced feature. **GameStream:** cap room-name length, filter, page size và execution timeout.

<a id="question-10"></a>

## 10. Implement multi-tenancy thế nào?

**Câu trả lời mẫu:** **Conclusion:** shared index kèm tenant filter/routing cho nhiều tenant nhỏ; separate index cho isolation mạnh/tenant lớn. **Mechanism:** authorisation phải inject tenant filter không bypass được. **Trade-off:** index-per-tenant tạo quá nhiều shard. **GameStream:** room hiện cùng product tenant; không tạo index cho từng room.

<a id="question-11"></a>

## 11. Cải thiện relevance an toàn thế nào?

**Câu trả lời mẫu:** **Conclusion:** định nghĩa labelled scenario, đo offline/online và thay boost/analyzer sau versioned experiment. **Mechanism:** kết hợp text score với business feature. **Trade-off:** popularity boost tạo feedback loop. **GameStream:** available seat/freshness boost nhưng không override private/public rule.

<a id="question-12"></a>

## 12. Backup strategy cho Elasticsearch là gì?

**Câu trả lời mẫu:** **Conclusion:** dùng repository snapshot để recover nhanh nhưng authoritative rebuild path vẫn là correctness guarantee chính. **Mechanism:** snapshot index và cluster metadata vào durable object storage. **Trade-off:** snapshot nhanh hơn full replay nhưng cần compatibility test. **GameStream:** MongoDB/event rebuild search được nếu snapshot hỏng.

<a id="question-13"></a>

## 13. Rolling upgrade ảnh hưởng client/mapping thế nào?

**Câu trả lời mẫu:** **Conclusion:** theo supported version order và test client/server compatibility trước rollout. **Mechanism:** mixed-version cluster chỉ tạm thời và API có thể evolve. **Trade-off:** bỏ qua upgrade path tăng outage risk. **GameStream:** pin image/client version đã test thay vì unconstrained latest trong production.

<a id="question-14"></a>

## 14. Điều tra search p99 cao thế nào?

**Câu trả lời mẫu:** **Conclusion:** tách queueing, shard fan-out, slow query, cache miss, GC, disk và merge. **Mechanism:** correlate slow log, task/thread-pool stat, shard timing và resource metric. **Trade-off:** caching có thể che query xấu. **GameStream:** reproduce đúng room filter/sort và xem số shard/document chạm tới.

<a id="question-15"></a>

## 15. Khi nào không nên dùng Elasticsearch?

**Câu trả lời mẫu:** **Conclusion:** không dùng khi exact indexed database query đủ và search relevance/analytics không đáng thêm distributed system. **Mechanism:** mỗi projection thêm replication lag, operations và recovery. **Trade-off:** specialised search khó hơn nếu bỏ. **GameStream:** giữ vì room discovery/research là mục tiêu, nhưng direct room read không qua Elasticsearch.

## Bảng thuật ngữ kỹ thuật

| Technical term          | Nghĩa tiếng Việt            | Giải thích đơn giản                                                                                     |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Shard sizing            | Định cỡ shard               | Chọn số lượng và kích thước shard cân bằng throughput, recovery và overhead.                            |
| Exactly-once projection | Projection đúng một lần     | Mục tiêu effect không bị lặp; thường đạt bằng idempotency và version chứ không phải delivery tuyệt đối. |
| Full rebuild            | Dựng lại toàn bộ            | Tạo read model mới từ nguồn dữ liệu đầy đủ.                                                             |
| Dual write              | Ghi kép                     | Application ghi hai hệ thống riêng biệt và có nguy cơ một bên thành công, một bên thất bại.             |
| Search consistency SLO  | Mục tiêu nhất quán tìm kiếm | Giới hạn độ trễ chấp nhận từ source update tới search visibility.                                       |
| Red cluster             | Cụm trạng thái đỏ           | Có primary shard chưa được gán nên một phần dữ liệu không khả dụng.                                     |
| Mapping explosion       | Bùng nổ mapping             | Quá nhiều field động làm metadata và memory tăng mạnh.                                                  |
| Hot shard               | Shard nóng                  | Một shard nhận tải lớn bất cân xứng.                                                                    |
| Expensive query         | Truy vấn tốn tài nguyên     | Query tiêu thụ quá nhiều CPU, memory hoặc thời gian.                                                    |
| Multi-tenancy           | Đa khách hàng dùng chung    | Nhiều tenant chia sẻ cluster nhưng phải cách ly dữ liệu và tài nguyên.                                  |
| Relevance tuning        | Điều chỉnh độ liên quan     | Thay đổi query, analyzer hoặc boost để cải thiện thứ tự kết quả.                                        |
| Snapshot                | Ảnh chụp sao lưu            | Bản backup index và cluster metadata lưu trong repository.                                              |
| Rolling upgrade         | Nâng cấp cuốn chiếu         | Nâng từng node để giảm thời gian gián đoạn.                                                             |
| p99 latency             | Độ trễ phân vị 99           | 99% request hoàn tất không chậm hơn giá trị này.                                                        |
| Search workload         | Tải tìm kiếm                | Mẫu query, index rate, aggregation và dữ liệu mà cluster phải phục vụ.                                  |
