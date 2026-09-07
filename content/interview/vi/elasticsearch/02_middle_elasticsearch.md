# Middle — Câu hỏi phỏng vấn Elasticsearch

## Mục lục câu hỏi

1. [Vì sao model Elasticsearch là derived read model?](#question-1)
2. [Làm projection idempotent thế nào?](#question-2)
3. [Vì sao production nên dùng explicit mapping?](#question-3)
4. [Alias hỗ trợ zero-downtime reindex thế nào?](#question-4)
5. [Vì sao nhiều mapping change không sửa in-place được?](#question-5)
6. [Tune refresh thế nào?](#question-6)
7. [Vì sao dùng Bulk API?](#question-7)
8. [Shard routing ảnh hưởng performance thế nào?](#question-8)
9. [Tránh deep-pagination problem thế nào?](#question-9)
10. [UI nên xử lý eventual consistency thế nào?](#question-10)
11. [Projection processing fail thì sao?](#question-11)
12. [Bảo mật Elasticsearch thế nào?](#question-12)
13. [Aggregation dùng làm gì?](#question-13)
14. [Nên monitor signal nào của Elasticsearch?](#question-14)
15. [Ước lượng index capacity thế nào?](#question-15)

<a id="question-1"></a>

## 1. Vì sao model Elasticsearch là derived read model?

**Câu trả lời mẫu:** **Conclusion:** search data phải rebuild được từ authoritative state/event. **Mechanism:** async projector biến room event thành search document. **Trade-off:** read eventually consistent và cần lag monitoring. **GameStream:** Kafka search consumer update `gamestream-rooms`; MongoDB giữ recovery truth.

<a id="question-2"></a>

## 2. Làm projection idempotent thế nào?

**Câu trả lời mẫu:** **Conclusion:** dùng stable document ID và từ chối event cũ hơn stored aggregate version. **Mechanism:** upsert complete searchable representation kèm version metadata. **Trade-off:** partial update nhỏ hơn nhưng khó replay an toàn. **GameStream:** duplicate `room.events.v1` phải hội tụ cùng room document.

<a id="question-3"></a>

## 3. Vì sao production nên dùng explicit mapping?

**Câu trả lời mẫu:** **Conclusion:** explicit mapping ngăn accidental field type và mapping explosion. **Mechanism:** tạo known field và có thể hạn chế dynamic addition. **Trade-off:** schema change cần controlled index evolution. **GameStream:** member count là number, status keyword, room name text theo design.

<a id="question-4"></a>

## 4. Alias hỗ trợ zero-downtime reindex thế nào?

**Câu trả lời mẫu:** **Conclusion:** reader dùng stable alias trong khi physical index mới được build/validate. **Mechanism:** switch alias atomically từ v1 sang v2. **Trade-off:** cần double storage và có thể dual-update. **GameStream:** search chuyển `gamestream-rooms-v1` sang `v2` không đổi API.

<a id="question-5"></a>

## 5. Vì sao nhiều mapping change không sửa in-place được?

**Câu trả lời mẫu:** **Conclusion:** indexed term hiện có đã encode bằng type/analyzer cũ. **Mechanism:** đổi interpretation phải đọc source và index lại. **Trade-off:** reindex tốn capacity. **GameStream:** đổi analyzer room name cần index mới, không chỉ app deploy.

<a id="question-6"></a>

## 6. Tune refresh thế nào?

**Câu trả lời mẫu:** **Conclusion:** chọn refresh interval từ search staleness chấp nhận được và indexing throughput. **Mechanism:** refresh mở segment mới cho search. **Trade-off:** interval ngắn tăng visibility nhưng tăng segment work. **GameStream:** room discovery chịu delay vài giây, khác authoritative command response.

<a id="question-7"></a>

## 7. Vì sao dùng Bulk API?

**Câu trả lời mẫu:** **Conclusion:** batching giảm per-request overhead và tăng indexing throughput. **Mechanism:** nhiều operation chung HTTP request và item xử lý độc lập. **Trade-off:** từng item có thể fail, batch phải bounded. **GameStream:** projection replay bulk room upsert và chỉ retry failed item.

<a id="question-8"></a>

## 8. Shard routing ảnh hưởng performance thế nào?

**Câu trả lời mẫu:** **Conclusion:** search qua nhiều shard cần scatter/gather; targeted routing giảm work. **Mechanism:** routing chọn shard bằng key. **Trade-off:** routing kém tạo hot shard hoặc khó broad search. **GameStream:** global public-room discovery tự nhiên qua shard nên oversharding rất tốn.

<a id="question-9"></a>

## 9. Tránh deep-pagination problem thế nào?

**Câu trả lời mẫu:** **Conclusion:** cap `from/size`, dùng `search_after`, dùng point-in-time khi cần snapshot ổn định. **Mechanism:** cursor mang last sort value. **Trade-off:** client cần state và deterministic sort. **GameStream:** thêm `roomId` làm tiebreaker để không duplicate/skip.

<a id="question-10"></a>

## 10. UI nên xử lý eventual consistency thế nào?

**Câu trả lời mẫu:** **Conclusion:** command result cập nhật authoritative local UI ngay; discovery search có thể lag. **Mechanism:** reconcile search response sau bằng room ID/version. **Trade-off:** consistency indicator làm UX phức tạp hơn. **GameStream:** creator vào room từ MongoDB response thay vì chờ Elasticsearch.

<a id="question-11"></a>

## 11. Projection processing fail thì sao?

**Câu trả lời mẫu:** **Conclusion:** không commit Kafka offset cho tới khi event được xử lý hoặc quarantine có chủ ý. **Mechanism:** retry transient error, phân loại poison event và giữ replay path. **Trade-off:** một bad event block partition. **GameStream:** expose projection health/consumer lag và thêm DLQ policy trước production.

<a id="question-12"></a>

## 12. Bảo mật Elasticsearch thế nào?

**Câu trả lời mẫu:** **Conclusion:** bật authentication, TLS, least-privilege role và không expose cluster cho browser. **Mechanism:** chỉ backend/projector identity có index privilege cần thiết. **Trade-off:** certificate/credential rotation thêm operations. **GameStream:** `xpack.security.enabled=false` chỉ chấp nhận trong isolated local Compose.

<a id="question-13"></a>

## 13. Aggregation dùng làm gì?

**Câu trả lời mẫu:** **Conclusion:** aggregation tính grouped metric như count, range, percentile trên matching document. **Mechanism:** bucket/metric aggregation chạy trên shard rồi merge. **Trade-off:** high-cardinality bucket tốn memory. **GameStream:** count room theo status có thể dùng aggregation, nhưng admin total authoritative hiện lấy MongoDB.

<a id="question-14"></a>

## 14. Nên monitor signal nào của Elasticsearch?

**Câu trả lời mẫu:** **Conclusion:** cluster/shard health, heap, GC, disk watermark, indexing/search latency, rejection, refresh/merge cost và projection lag. **Mechanism:** chúng tách cluster pressure khỏi consumer delay. **Trade-off:** document count không đủ nói health. **GameStream:** admin health cần thêm queue/resource metric.

<a id="question-15"></a>

## 15. Ước lượng index capacity thế nào?

**Câu trả lời mẫu:** **Conclusion:** đo indexed size trung bình, growth, replica, shard overhead, query concurrency và retention. **Mechanism:** test mapping/document đại diện thay vì chỉ raw JSON size. **Trade-off:** analyzer và doc values có thể nở storage đáng kể. **GameStream:** room projection nhỏ nên too many shards là rủi ro sớm hơn data volume.

## Bảng thuật ngữ kỹ thuật

| Technical term        | Nghĩa tiếng Việt                | Giải thích đơn giản                                                             |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| Derived read model    | Mô hình đọc dẫn xuất            | Dữ liệu phục vụ đọc được dựng từ nguồn có thẩm quyền và có thể dựng lại.        |
| Idempotent projection | Phép chiếu có tính lũy đẳng     | Xử lý lặp cùng event không làm read model sai.                                  |
| Explicit mapping      | Mapping khai báo tường minh     | Chủ động định nghĩa field type thay vì để hệ thống tự đoán.                     |
| Index alias           | Bí danh chỉ mục                 | Tên ổn định trỏ tới một hoặc nhiều physical index.                              |
| Zero-downtime reindex | Lập chỉ mục lại không gián đoạn | Dựng index mới rồi chuyển alias mà không dừng đọc.                              |
| In-place change       | Thay đổi tại chỗ                | Sửa cấu trúc hiện có mà không tạo index mới; nhiều mapping change không hỗ trợ. |
| Refresh interval      | Khoảng làm mới tìm kiếm         | Tần suất segment mới trở nên searchable.                                        |
| Bulk API              | API xử lý hàng loạt             | Gửi nhiều index/update/delete trong một request để tăng throughput.             |
| Shard routing         | Định tuyến shard                | Quy tắc chọn shard nhận document hoặc query.                                    |
| Deep pagination       | Phân trang quá sâu              | Yêu cầu page xa khiến cluster giữ và sắp xếp quá nhiều kết quả.                 |
| Eventual consistency  | Nhất quán sau một khoảng trễ    | Search có thể chậm hơn authoritative state trong thời gian ngắn.                |
| Projection failure    | Lỗi dựng mô hình đọc            | Consumer không cập nhật được index từ event nguồn.                              |
| Aggregation           | Phép tổng hợp                   | Nhóm và tính toán thống kê trên các document.                                   |
| Cluster metric        | Chỉ số cụm                      | Số liệu về health, shard, latency, queue, memory và disk.                       |
| Index capacity        | Dung lượng chỉ mục              | Kích thước và tài nguyên cần cho document, replica, segment và tăng trưởng.     |
