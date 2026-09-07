# Senior — Câu hỏi phỏng vấn Memory Cache

## Mục lục câu hỏi

1. [Chọn cache admission policy thế nào?](#question-1)
2. [Định nghĩa cache consistency thế nào?](#question-2)
3. [Distributed L1 invalidation reliable thế nào?](#question-3)
4. [Capacity-plan memory cache thế nào?](#question-4)
5. [Chẩn đoán cache-related memory leak thế nào?](#question-5)
6. [Bảo vệ secret/personal data trong cache thế nào?](#question-6)
7. [Multi-tenancy ảnh hưởng L1 key thế nào?](#question-7)
8. [Cache-aside khác write-through thế nào?](#question-8)
9. [Tránh cache pollution từ scan/bot thế nào?](#question-9)
10. [Deployment ảnh hưởng cache behaviour thế nào?](#question-10)
11. [Hot-key single-flight failure mode là gì?](#question-11)
12. [Cache observability tránh high cardinality thế nào?](#question-12)
13. [Cache nên tiêu thụ failure budget nào?](#question-13)
14. [Khi nào ưu tiên external cache library?](#question-14)
15. [Memory cache nằm đâu trong overall architecture?](#question-15)

<a id="question-1"></a>

## 1. Chọn cache admission policy thế nào?

**Câu trả lời mẫu:** **Conclusion:** chỉ admit value có khả năng reuse và đáng memory cost, không phải mọi miss. **Mechanism:** frequency sketch hoặc workload rule loại one-hit wonder. **Trade-off:** logic thêm complexity. **GameStream:** cache common room-list query, không cache mọi search combination.

<a id="question-2"></a>

## 2. Định nghĩa cache consistency thế nào?

**Câu trả lời mẫu:** **Conclusion:** chỉ rõ maximum staleness và read-your-write cho từng use case. **Mechanism:** TTL, invalidation, version check hoặc bypass sau write. **Trade-off:** consistency mạnh giảm hiệu quả cache. **GameStream:** discovery chịu vài giây; active-room state không dùng L1 authority.

<a id="question-3"></a>

## 3. Distributed L1 invalidation reliable thế nào?

**Câu trả lời mẫu:** **Conclusion:** kết hợp best-effort invalidation event với TTL/version vì message có thể mất. **Mechanism:** event evict nhanh; expiry bound failure. **Trade-off:** durable invalidation stream tốn hơn. **GameStream:** Redis Pub/Sub cộng short L1 TTL đủ cho public list.

<a id="question-4"></a>

## 4. Capacity-plan memory cache thế nào?

**Câu trả lời mẫu:** **Conclusion:** budget weighted value/key/metadata, peak cardinality, GC headroom và concurrent app allocation. **Mechanism:** sample heap thực và stress p99. **Trade-off:** dùng hết free heap làm process bất ổn. **GameStream:** chừa memory cho socket, request payload và DB client.

<a id="question-5"></a>

## 5. Chẩn đoán cache-related memory leak thế nào?

**Câu trả lời mẫu:** **Conclusion:** correlate entry/weight growth với retained heap và compare heap snapshot theo retainer. **Mechanism:** verify expiry, eviction, invalidation path. **Trade-off:** RSS có thể cao sau GC nên retained heap quan trọng hơn. **GameStream:** expose entry count/eviction cạnh process memory.

<a id="question-6"></a>

## 6. Bảo vệ secret/personal data trong cache thế nào?

**Câu trả lời mẫu:** **Conclusion:** tối thiểu sensitive value, bound TTL, isolate key, tránh log/dump. **Mechanism:** cache opaque reference khi có thể. **Trade-off:** refetch protected data tốn latency. **GameStream:** không đặt raw OAuth token/invite secret trong generic room-list L1.

<a id="question-7"></a>

## 7. Multi-tenancy ảnh hưởng L1 key thế nào?

**Câu trả lời mẫu:** **Conclusion:** tenant identity phải trong key và authorisation không dựa cache presence. **Mechanism:** namespace ngăn cross-tenant collision. **Trade-off:** tenant cardinality giảm hit. **GameStream:** future tenant/region ID phải đứng trước search parameter.

<a id="question-8"></a>

## 8. Cache-aside khác write-through thế nào?

**Câu trả lời mẫu:** **Conclusion:** cache-aside đơn giản/chịu cache failure; write-through update cache cùng store nhưng coupling write availability. **Mechanism:** write-through centralise order. **Trade-off:** không cách nào atomic hai system. **GameStream:** post-commit invalidation hợp discovery data disposable.

<a id="question-9"></a>

## 9. Tránh cache pollution từ scan/bot thế nào?

**Câu trả lời mẫu:** **Conclusion:** phân biệt interactive hot query khỏi bulk/test traffic và bypass/limit admission. **Mechanism:** request context/query class điều khiển caching. **Trade-off:** policy sai giảm useful hit. **GameStream:** bot-runner không được fill L1 bằng unique key.

<a id="question-10"></a>

## 10. Deployment ảnh hưởng cache behaviour thế nào?

**Câu trả lời mẫu:** **Conclusion:** giả định cold cache sau restart và ngăn fleet warm-up đồng thời overload dependency. **Mechanism:** jitter rollout, prewarm selected key, coalesce miss. **Trade-off:** prewarm có thể load data không dùng. **GameStream:** public-list key là prewarm candidate nhỏ.

<a id="question-11"></a>

## 11. Hot-key single-flight failure mode là gì?

**Câu trả lời mẫu:** **Conclusion:** shared loader treo làm mọi caller chờ; cần timeout và clear ownership. **Mechanism:** single-flight cần cancellation/failure propagation. **Trade-off:** fallback parallel load có stampede risk. **GameStream:** bound Mongo list load và trả degraded response.

<a id="question-12"></a>

## 12. Cache observability tránh high cardinality thế nào?

**Câu trả lời mẫu:** **Conclusion:** label theo cache name/outcome, không raw key/room/user. **Mechanism:** counter/histogram aggregate hit/load latency. **Trade-off:** debug single key cần sampled log. **GameStream:** expose `public_rooms` metric và sample correlation ID.

<a id="question-13"></a>

## 13. Cache nên tiêu thụ failure budget nào?

**Câu trả lời mẫu:** **Conclusion:** cải thiện latency mà không thành critical dependency cho correctness. **Mechanism:** định nghĩa bypass và test cache-disabled mode. **Trade-off:** fallback capacity phải đủ. **GameStream:** Mongo chịu controlled L1 miss period; Redis failure cần throttling mạnh hơn.

<a id="question-14"></a>

## 14. Khi nào ưu tiên external cache library?

**Câu trả lời mẫu:** **Conclusion:** dùng library khi cần weighted LRU/LFU, async loading, metrics/concurrency vượt custom nhỏ. **Mechanism:** mature algorithm cover edge case. **Trade-off:** dependency thêm API/supply-chain cost. **GameStream:** giữ custom khi requirement chỉ TTL, prefix invalidation, hard bound.

<a id="question-15"></a>

## 15. Memory cache nằm đâu trong overall architecture?

**Câu trả lời mẫu:** **Conclusion:** nó là optimisation trong service instance, không phải service boundary/data owner. **Mechanism:** bỏ cache không được làm sai function. **Trade-off:** local speed tạo replica inconsistency được TTL hấp thụ. **GameStream:** L1 tăng tốc discovery; MongoDB, Redis, Kafka vẫn có role riêng.

## Bảng thuật ngữ kỹ thuật

| Technical term         | Nghĩa tiếng Việt               | Giải thích đơn giản                                                   |
| ---------------------- | ------------------------------ | --------------------------------------------------------------------- |
| Admission policy       | Chính sách nhận vào cache      | Quyết định dữ liệu nào đủ giá trị để được cache.                      |
| Cache consistency      | Tính nhất quán cache           | Mức độ cache được phép chậm hơn nguồn dữ liệu.                        |
| Reliable invalidation  | Làm mất hiệu lực đáng tin cậy  | Cơ chế giảm khả năng replica bỏ lỡ thông báo xóa cache.               |
| Capacity planning      | Lập kế hoạch dung lượng        | Ước lượng entry count, object size, overhead và memory headroom.      |
| Heap snapshot          | Ảnh chụp vùng nhớ heap         | Dữ liệu dùng để tìm object đang chiếm hoặc giữ memory.                |
| Personal data          | Dữ liệu cá nhân                | Thông tin liên quan tới một cá nhân và cần bảo vệ.                    |
| Multi-tenancy          | Đa khách hàng dùng chung       | Một hệ thống phục vụ nhiều tenant nhưng phải cách ly dữ liệu.         |
| Write-through cache    | Cache ghi xuyên                | Application ghi cache và nguồn dữ liệu trong cùng flow.               |
| Cache pollution        | Ô nhiễm cache                  | Dữ liệu ít tái sử dụng chiếm chỗ của dữ liệu có giá trị.              |
| Warm-up                | Làm nóng cache                 | Nạp dữ liệu thường dùng trước hoặc sau deployment.                    |
| Hot key                | Khóa nóng                      | Một key nhận nhiều request đồng thời.                                 |
| High cardinality       | Số lượng nhãn duy nhất quá cao | Metric tạo quá nhiều time series do label thay đổi liên tục.          |
| Failure budget         | Ngân sách lỗi                  | Mức lỗi hoặc stale data được chấp nhận trong SLO.                     |
| External cache library | Thư viện cache bên ngoài       | Thư viện cung cấp eviction, metric và concurrency đã được kiểm chứng. |
| Cache hierarchy        | Phân cấp cache                 | Nhiều tầng cache từ process, shared store đến database.               |
