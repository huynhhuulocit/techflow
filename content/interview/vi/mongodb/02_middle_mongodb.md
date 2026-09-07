# Middle — Câu hỏi phỏng vấn MongoDB

## Mục lục câu hỏi

1. [Compound index hoạt động thế nào?](#question-1)
2. [Xác minh index hiệu quả thế nào?](#question-2)
3. [Transaction callback phải sẵn sàng retry gì?](#question-3)
4. [Expected-version update ngăn lost update thế nào?](#question-4)
5. [Enforce idempotency dưới concurrency thế nào?](#question-5)
6. [Cursor và offset pagination trade-off gì?](#question-6)
7. [Evolve document schema an toàn thế nào?](#question-7)
8. [Change stream hay transactional outbox?](#question-8)
9. [Hot document là gì?](#question-9)
10. [Denormalisation ảnh hưởng consistency thế nào?](#question-10)
11. [Điều gì nên nằm trong transaction?](#question-11)
12. [Document lớn ảnh hưởng performance thế nào?](#question-12)
13. [Cache invalidation nên liên hệ MongoDB commit thế nào?](#question-13)
14. [Index nào hỗ trợ core collection của GameStream?](#question-14)
15. [Test durable recovery thế nào?](#question-15)

<a id="question-1"></a>

## 1. Compound index hoạt động thế nào?

**Câu trả lời mẫu:** **Conclusion:** compound index sắp xếp nhiều field và hỗ trợ hiệu quả query khớp leftmost prefix. **Mechanism:** field order theo equality, sort và range pattern. **Trade-off:** compound index dư thừa tăng write amplification. **GameStream:** `{ roomId: 1, aggregateVersion: 1 }` hỗ trợ room-event recovery có thứ tự.

<a id="question-2"></a>

## 2. Xác minh index hiệu quả thế nào?

**Câu trả lời mẫu:** **Conclusion:** dùng `explain` với query giống production và xem keys/docs examined, winning plan, execution time. **Mechanism:** planner so sánh candidate plan. **Trade-off:** dataset development nhỏ che collection scan. **GameStream:** kiểm chứng public-room sort và event replay với room count thực tế.

<a id="question-3"></a>

## 3. Transaction callback phải sẵn sàng retry gì?

**Câu trả lời mẫu:** **Conclusion:** transient transaction error và unknown commit result cần retry theo driver. **Mechanism:** callback có thể chạy lại nên body không được có external side effect. **Trade-off:** retry tăng latency và chạy lại read. **GameStream:** không publish Redis/Kafka trong Mongo transaction callback; chỉ ghi outbox.

<a id="question-4"></a>

## 4. Expected-version update ngăn lost update thế nào?

**Câu trả lời mẫu:** **Conclusion:** chỉ một writer match được current version cụ thể. **Mechanism:** filter gồm `_id` và `version`; update thành công increment version. **Trade-off:** contention cao tạo nhiều conflict. **GameStream:** roll/ready đồng thời không thể âm thầm overwrite nhau.

<a id="question-5"></a>

## 5. Enforce idempotency dưới concurrency thế nào?

**Câu trả lời mẫu:** **Conclusion:** application pre-check không đủ; cần unique constraint trong transaction. **Mechanism:** duplicate command insert race an toàn tại unique index. **Trade-off:** loser phải map duplicate-key thành stored response. **GameStream:** command receipt cần unique `commandId`, không chỉ `findOne`.

<a id="question-6"></a>

## 6. Cursor và offset pagination trade-off gì?

**Câu trả lời mẫu:** **Conclusion:** cursor ổn định/scalable hơn cho dữ liệu thay đổi; offset đơn giản cho tập nhỏ tĩnh. **Mechanism:** tiếp tục sau stable sort key như `(updatedAt, _id)`. **Trade-off:** cursor khó nhảy trang tùy ý. **GameStream:** public room nên paginate bằng timestamp/ID thay vì `skip` lớn.

<a id="question-7"></a>

## 7. Evolve document schema an toàn thế nào?

**Câu trả lời mẫu:** **Conclusion:** làm reader tolerant, ghi shape mới, backfill rồi bỏ support cũ. **Mechanism:** schema version hoặc field presence điều khiển compatibility. **Trade-off:** dual-read period thêm complexity. **GameStream:** spectator data mới phải có default cho room document cũ cho tới khi migration xong.

<a id="question-8"></a>

## 8. Change stream hay transactional outbox?

**Câu trả lời mẫu:** **Conclusion:** change stream expose committed DB change; outbox publish integration event có chủ ý atomically cùng business state. **Mechanism:** change stream tail oplog; outbox chứa explicit event contract. **Trade-off:** outbox cần relay/cleanup, change stream coupling vào data change. **GameStream:** outbox phù hợp versioned Kafka event hơn.

<a id="question-9"></a>

## 9. Hot document là gì?

**Câu trả lời mẫu:** **Conclusion:** hot document nhận nhiều concurrent update đến mức thành contention bottleneck. **Mechanism:** write serialize quanh cùng record/version. **Trade-off:** tách state giảm contention nhưng phức tạp transaction. **GameStream:** mọi chat message increment `room.chatSequence`, có thể hot trong room rất đông.

<a id="question-10"></a>

## 10. Denormalisation ảnh hưởng consistency thế nào?

**Câu trả lời mẫu:** **Conclusion:** denormalisation tăng tốc read bằng duplicate data nhưng tạo nhiều value phải đồng bộ. **Mechanism:** update atomic khi cùng chỗ hoặc async kèm repair. **Trade-off:** có thể stale. **GameStream:** room summary trong Elasticsearch eventually consistent; MongoDB vẫn authoritative.

<a id="question-11"></a>

## 11. Điều gì nên nằm trong transaction?

**Câu trả lời mẫu:** **Conclusion:** chỉ database operation cần cho một invariant và transaction phải ngắn. **Mechanism:** lock/snapshot resource tồn tại tới commit/abort. **Trade-off:** external call không tham gia atomic và kéo dài failure window. **GameStream:** state, event, receipt, outbox ở trong; cache invalidation sau commit.

<a id="question-12"></a>

## 12. Document lớn ảnh hưởng performance thế nào?

**Câu trả lời mẫu:** **Conclusion:** document lớn/tăng thường xuyên làm tăng network, memory, update cost và gần BSON limit. **Mechanism:** array growth và relocation khuếch đại write. **Trade-off:** tách document cần query thêm. **GameStream:** không embed chat hoặc toàn bộ event history vô hạn trong room.

<a id="question-13"></a>

## 13. Cache invalidation nên liên hệ MongoDB commit thế nào?

**Câu trả lời mẫu:** **Conclusion:** chỉ invalidate/update cache sau authoritative commit. **Mechanism:** transaction fail không được evict theo state chưa tồn tại. **Trade-off:** crash sau commit trước invalidation có thể stale tới TTL. **GameStream:** Redis và memory-cache TTL ngắn giới hạn inconsistency window.

<a id="question-14"></a>

## 14. Index nào hỗ trợ core collection của GameStream?

**Câu trả lời mẫu:** **Conclusion:** index phải map vào invariant/access path thực tế. **Mechanism:** ứng viên gồm unique command ID, unique room/client message ID, room/event version, outbox publication order và public-room listing. **Trade-off:** từng index cần query-plan evidence. **GameStream:** index là operational contract, không phải checklist.

<a id="question-15"></a>

## 15. Test durable recovery thế nào?

**Câu trả lời mẫu:** **Conclusion:** ngắt backend tại boundary transaction, broadcast và reconnect rồi kiểm tra state/event order. **Mechanism:** reload từ MongoDB bằng version và đối chiếu domain invariant. **Trade-off:** deterministic failure injection cần tooling. **GameStream:** kill API sau commit trước socket delivery và xác minh resume trả committed state.

## Bảng thuật ngữ kỹ thuật

| Technical term       | Nghĩa tiếng Việt           | Giải thích đơn giản                                             |
| -------------------- | -------------------------- | --------------------------------------------------------------- |
| Compound index       | Chỉ mục ghép               | Một index gồm nhiều field theo thứ tự xác định.                 |
| Query plan           | Kế hoạch truy vấn          | Cách MongoDB chọn index và thực thi query.                      |
| Transaction retry    | Thử lại giao dịch          | Chạy lại transaction khi gặp lỗi tạm thời được phép retry.      |
| Expected version     | Phiên bản mong đợi         | Version caller đã đọc và dùng làm điều kiện ghi.                |
| Lost update          | Mất cập nhật               | Một thao tác ghi đè kết quả mới hơn của thao tác khác.          |
| Idempotency          | Tính lũy đẳng              | Lặp lại cùng request không tạo thêm kết quả nghiệp vụ.          |
| Cursor pagination    | Phân trang bằng con trỏ    | Dùng vị trí ổn định để lấy trang tiếp theo.                     |
| Offset pagination    | Phân trang bằng độ lệch    | Bỏ qua một số record rồi lấy page kế tiếp.                      |
| Schema evolution     | Tiến hóa schema            | Thay đổi cấu trúc document mà dữ liệu và code cũ vẫn hoạt động. |
| Change stream        | Luồng thay đổi             | API theo dõi các thay đổi đã ghi vào MongoDB.                   |
| Transactional outbox | Hộp thư đi trong giao dịch | Lưu state và event cần publish trong cùng database transaction. |
| Hot document         | Document nóng              | Document bị nhiều request cùng đọc hoặc ghi gây tranh chấp.     |
| Denormalisation      | Phi chuẩn hóa              | Lặp dữ liệu để đọc nhanh hơn nhưng tăng chi phí đồng bộ.        |
| Cache invalidation   | Làm mất hiệu lực cache     | Xóa hoặc đánh dấu cache cũ sau khi dữ liệu nguồn thay đổi.      |
| Durable recovery     | Phục hồi bền vững          | Khôi phục state từ dữ liệu đã được lưu an toàn sau sự cố.       |
