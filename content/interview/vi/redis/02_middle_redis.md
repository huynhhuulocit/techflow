# Middle — Câu hỏi phỏng vấn Redis

## Mục lục câu hỏi

1. [Thiết kế Redis key ownership thế nào?](#question-1)
2. [Ngăn cache stampede thế nào?](#question-2)
3. [Hạn chế của Redis transaction là gì?](#question-3)
4. [Release distributed lock an toàn thế nào?](#question-4)
5. [Stream acknowledgement hoạt động thế nào?](#question-5)
6. [Trim Streams thế nào?](#question-6)
7. [Redis Cluster partition key thế nào?](#question-7)
8. [Giữ cache consistency sau write thế nào?](#question-8)
9. [Implement rate limiting thế nào?](#question-9)
10. [Serialize Redis value thế nào?](#question-10)
11. [Vì sao subscription dùng connection riêng?](#question-11)
12. [Tránh `KEYS` nguy hiểm thế nào?](#question-12)
13. [Redis metric nào quan trọng?](#question-13)
14. [App nên làm gì khi Redis unavailable?](#question-14)
15. [Redis và memory cache tạo hai level thế nào?](#question-15)

<a id="question-1"></a>

## 1. Thiết kế Redis key ownership thế nào?

**Câu trả lời mẫu:** **Conclusion:** mỗi prefix cần owner, data type, TTL, size bound và deletion rule. **Mechanism:** key registry ngăn collision/unbounded state. **Trade-off:** governance thêm documentation. **GameStream:** cache, OIDC state, refresh session, presence, room stream có lifecycle khác nhau.

<a id="question-2"></a>

## 2. Ngăn cache stampede thế nào?

**Câu trả lời mẫu:** **Conclusion:** tránh nhiều caller rebuild cùng expired value. **Mechanism:** request coalescing, jittered TTL, soft expiry hoặc short lock cho một loader. **Trade-off:** lock thêm latency/failure handling. **GameStream:** popular public-room list dùng L1 coalescing và jitter.

<a id="question-3"></a>

## 3. Hạn chế của Redis transaction là gì?

**Câu trả lời mẫu:** **Conclusion:** Redis transaction isolate command execution nhưng không database-style rollback/cross-system atomicity. **Mechanism:** runtime error trả theo command. **Trade-off:** invariant phức tạp hợp Lua hoặc authoritative DB hơn. **GameStream:** room state/outbox atomicity ở MongoDB.

<a id="question-4"></a>

## 4. Release distributed lock an toàn thế nào?

**Câu trả lời mẫu:** **Conclusion:** chỉ delete khi lock value còn bằng unique owner token. **Mechanism:** atomic Lua compare-delete và finite lease. **Trade-off:** lease expire có thể tạo overlapping owner. **GameStream:** lock phối hợp maintenance job, không enforce turn correctness.

<a id="question-5"></a>

## 5. Stream acknowledgement hoạt động thế nào?

**Câu trả lời mẫu:** **Conclusion:** delivery vào group tạo pending entry tới khi `XACK`. **Mechanism:** pending metadata ghi consumer/idle time; consumer khác claim abandoned work. **Trade-off:** ack trước effect có loss, sau effect có duplicate. **GameStream:** Stream consumer phải idempotent.

<a id="question-6"></a>

## 6. Trim Streams thế nào?

**Câu trả lời mẫu:** **Conclusion:** cap theo approximate length/minimum ID dựa recovery duration và memory budget. **Mechanism:** `XTRIM` xoá entry cũ. **Trade-off:** trim mạnh phá slow-reader recovery. **GameStream:** Stream là short buffer; MongoDB fallback cho gap dài.

<a id="question-7"></a>

## 7. Redis Cluster partition key thế nào?

**Câu trả lời mẫu:** **Conclusion:** key map vào hash slot phân phối giữa cluster master. **Mechanism:** multi-key atomic command cần cùng slot, thường qua hash tag. **Trade-off:** colocate quá nhiều tạo hot slot. **GameStream:** `{roomId}` chỉ dùng khi thực sự cần atomic multi-key room work.

<a id="question-8"></a>

## 8. Giữ cache consistency sau write thế nào?

**Câu trả lời mẫu:** **Conclusion:** commit database trước rồi invalidate; TTL ngắn/version check giới hạn race. **Mechanism:** cache-aside chấp nhận stale window nhỏ. **Trade-off:** write-through consistent hơn nhưng coupling availability. **GameStream:** room mutation invalidate L1/L2 public list sau Mongo commit.

<a id="question-9"></a>

## 9. Implement rate limiting thế nào?

**Câu trả lời mẫu:** **Conclusion:** dùng atomic fixed/sliding window hoặc token bucket theo principal/action. **Mechanism:** Lua update counter/expiry trong một operation. **Trade-off:** precise distributed limit tốn memory/CPU. **GameStream:** limit chat, roll, login, token endpoint riêng.

<a id="question-10"></a>

## 10. Serialize Redis value thế nào?

**Câu trả lời mẫu:** **Conclusion:** dùng explicit versioned format, tránh language-specific object serialization. **Mechanism:** JSON dễ đọc, compact encoding tiết kiệm bandwidth. **Trade-off:** parsing/schema evolution vẫn còn. **GameStream:** room-summary cache nên có version hoặc validate dữ liệu cũ.

<a id="question-11"></a>

## 11. Vì sao subscription dùng connection riêng?

**Câu trả lời mẫu:** **Conclusion:** subscribed connection dành cho pushed message trong cách dùng client/protocol phổ biến. **Mechanism:** library duplicate connection cho Pub/Sub. **Trade-off:** nhiều connection cần capacity planning. **GameStream:** cache command traffic không dùng chung subscription connection.

<a id="question-12"></a>

## 12. Tránh `KEYS` nguy hiểm thế nào?

**Câu trả lời mẫu:** **Conclusion:** dùng `SCAN` incremental vì `KEYS` block với keyspace lớn. **Mechanism:** cursor scan trả bounded batch. **Trade-off:** `SCAN` có thể duplicate và không phải snapshot. **GameStream:** admin count dùng scan loop; cache invalidation scale lớn nên tránh global scan.

<a id="question-13"></a>

## 13. Redis metric nào quan trọng?

**Câu trả lời mẫu:** **Conclusion:** memory/fragmentation, eviction, expired key, hit ratio, command latency, blocked client, connection, replication, stream pending và error. **Mechanism:** liên hệ metric với keyspace role. **Trade-off:** aggregate hit rate che cache xấu. **GameStream:** report cache, stream, presence count riêng.

<a id="question-14"></a>

## 14. App nên làm gì khi Redis unavailable?

**Câu trả lời mẫu:** **Conclusion:** giữ authoritative gameplay khi an toàn, degrade cache/realtime optimization, fail closed cho security session. **Mechanism:** timeout/circuit breaker ngăn resource exhaustion. **Trade-off:** bypass cache tăng Mongo load. **GameStream:** room read fallback được; OIDC state validation không được bypass.

<a id="question-15"></a>

## 15. Redis và memory cache tạo hai level thế nào?

**Câu trả lời mẫu:** **Conclusion:** process memory là L1 cực nhanh; Redis là shared L2. **Mechanism:** đọc L1, L2, MongoDB rồi populate ngược. **Trade-off:** mỗi level tăng stale/invalidation complexity. **GameStream:** public-room list có L1 khoảng 2 giây, L2 15 giây.

## Bảng thuật ngữ kỹ thuật

| Technical term          | Nghĩa tiếng Việt           | Giải thích đơn giản                                                          |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| Key ownership           | Quyền sở hữu khóa          | Quy định module nào được tạo, đọc, sửa hoặc xóa một nhóm key.                |
| Cache stampede          | Dồn tải khi cache hết hạn  | Nhiều request cùng lúc tải lại một key bị miss.                              |
| Redis transaction       | Giao dịch Redis            | Nhóm lệnh thực thi tuần tự nhưng không có rollback như database transaction. |
| Distributed lock        | Khóa phân tán              | Khóa phối hợp nhiều process thông qua shared store.                          |
| Lock token              | Mã sở hữu khóa             | Giá trị riêng giúp chỉ owner được phép release lock.                         |
| Acknowledgement         | Xác nhận xử lý             | Consumer báo message đã được xử lý thành công.                               |
| Stream trimming         | Cắt bớt stream             | Giới hạn số message hoặc thời gian giữ message.                              |
| Redis Cluster           | Cụm Redis                  | Phân chia key qua nhiều shard để scale.                                      |
| Hash tag                | Nhãn băm                   | Phần trong `{}` buộc các key liên quan vào cùng hash slot.                   |
| Rate limiting           | Giới hạn tần suất          | Giới hạn số thao tác của caller trong một khoảng thời gian.                  |
| Serialization           | Tuần tự hóa                | Chuyển object thành chuỗi hoặc bytes để lưu và đọc lại.                      |
| Subscription connection | Kết nối đăng ký            | Connection riêng ở chế độ nhận Pub/Sub message.                              |
| KEYS command            | Lệnh liệt kê toàn bộ khóa  | Lệnh có thể chặn Redis khi keyspace lớn nên tránh trong production.          |
| Degraded mode           | Chế độ suy giảm            | Hệ thống vẫn phục vụ chức năng cốt lõi khi Redis unavailable.                |
| L1/L2 cache             | Cache tầng một và tầng hai | L1 nằm trong process; L2 là shared cache như Redis.                          |
