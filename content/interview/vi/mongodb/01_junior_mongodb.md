# Junior — Câu hỏi phỏng vấn MongoDB

## Mục lục câu hỏi

1. [MongoDB là gì?](#question-1)
2. [Database, collection và document là gì?](#question-2)
3. [Khi nào embed, khi nào reference dữ liệu?](#question-3)
4. [MongoDB mặc định cung cấp atomicity gì?](#question-4)
5. [Index là gì?](#question-5)
6. [Vì sao dùng unique index?](#question-6)
7. [MongoDB transaction là gì?](#question-7)
8. [Vì sao local GameStream chạy MongoDB dạng replica set?](#question-8)
9. [Read concern và write concern là gì?](#question-9)
10. [`_id` là gì?](#question-10)
11. [MongoDB có schema không?](#question-11)
12. [Optimistic concurrency control là gì?](#question-12)
13. [Aggregation pipeline là gì?](#question-13)
14. [Vì sao MongoDB là authoritative store của GameStream?](#question-14)
15. [Player resume sau disconnect thế nào?](#question-15)

<a id="question-1"></a>

## 1. MongoDB là gì?

**Câu trả lời mẫu:** **Conclusion:** MongoDB là document database lưu BSON document trong collection. **Mechanism:** document chứa nested object/array và được query qua field/index. **Trade-off:** shape linh hoạt không loại bỏ nhu cầu schema governance. **GameStream:** room document chứa authoritative game state và membership.

<a id="question-2"></a>

## 2. Database, collection và document là gì?

**Câu trả lời mẫu:** **Conclusion:** database nhóm collection, collection nhóm document, document là một BSON record. **Mechanism:** document có primary key `_id`. **Trade-off:** collection boundary phải theo access/lifecycle pattern. **GameStream:** `rooms`, `chat_messages`, `game_events`, `outbox` và `command_receipts` có trách nhiệm riêng.

<a id="question-3"></a>

## 3. Khi nào embed, khi nào reference dữ liệu?

**Câu trả lời mẫu:** **Conclusion:** embed dữ liệu được đọc/cập nhật cùng parent; reference dữ liệu tăng trưởng hoặc truy cập độc lập. **Mechanism:** embedding cho one-document read và atomic update. **Trade-off:** unbounded array làm document lớn và tăng contention. **GameStream:** current game state embed trong room, còn chat message ở collection riêng.

<a id="question-4"></a>

## 4. MongoDB mặc định cung cấp atomicity gì?

**Câu trả lời mẫu:** **Conclusion:** single-document write là atomic. **Mechanism:** mọi field update trong một matched document thành công cùng nhau. **Trade-off:** invariant xuyên nhiều document cần transaction hoặc schema redesign. **GameStream:** room version và game state update cùng nhau; state cộng outbox cần transaction.

<a id="question-5"></a>

## 5. Index là gì?

**Câu trả lời mẫu:** **Conclusion:** index là cấu trúc dữ liệu có thứ tự giúp tìm document không cần scan toàn collection. **Mechanism:** indexed key map tới record location. **Trade-off:** index tốn storage và làm write chậm. **GameStream:** index hỗ trợ room list, event replay order và idempotency lookup.

<a id="question-6"></a>

## 6. Vì sao dùng unique index?

**Câu trả lời mẫu:** **Conclusion:** unique index enforce uniqueness invariant ở database. **Mechanism:** insert/update xung đột fail atomically. **Trade-off:** nullable hoặc partial uniqueness cần option có chủ ý. **GameStream:** command ID và `(roomId, clientMessageId)` nên unique để tránh duplicate effect.

<a id="question-7"></a>

## 7. MongoDB transaction là gì?

**Câu trả lời mẫu:** **Conclusion:** transaction commit hoặc abort nhiều operation một cách atomic. **Mechanism:** operation dùng chung client session và transaction context. **Trade-off:** transaction tốn hơn single-document modelling tốt. **GameStream:** room command persist state, domain event, outbox và receipt trong một transaction.

<a id="question-8"></a>

## 8. Vì sao local GameStream chạy MongoDB dạng replica set?

**Câu trả lời mẫu:** **Conclusion:** transaction và change stream cần replica-set hoặc sharded-cluster capability. **Mechanism:** single node local được initiate thành `rs0`. **Trade-off:** một member có feature nhưng không có high availability thật. **GameStream:** Compose dùng one-node replica set cho development transaction semantics.

<a id="question-9"></a>

## 9. Read concern và write concern là gì?

**Câu trả lời mẫu:** **Conclusion:** read concern điều khiển guarantee về data visibility; write concern điều khiển acknowledgement durability. **Mechanism:** local, majority và snapshot cho guarantee khác nhau. **Trade-off:** guarantee mạnh thường tốn latency/availability. **GameStream:** critical state phải chọn theo durable-resume requirement, không dựa mặc định vô tình.

<a id="question-10"></a>

## 10. `_id` là gì?

**Câu trả lời mẫu:** **Conclusion:** `_id` là unique primary key và được index tự động. **Mechanism:** có thể là ObjectId, UUID string hoặc value ổn định khác. **Trade-off:** key shape ảnh hưởng size/locality. **GameStream:** room/event ID dùng UUID string và làm correlation xuyên service.

<a id="question-11"></a>

## 11. MongoDB có schema không?

**Câu trả lời mẫu:** **Conclusion:** có về mặt vận hành dù database không bắt mọi document giống hệt nhau. **Mechanism:** application type, validator, index và migration rule định nghĩa schema. **Trade-off:** flexibility không kiểm soát tạo document không nhất quán. **GameStream:** TypeScript model mô tả document; production nên có collection validation cho critical field.

<a id="question-12"></a>

## 12. Optimistic concurrency control là gì?

**Câu trả lời mẫu:** **Conclusion:** nó phát hiện concurrent modification thay vì lock record suốt user interaction. **Mechanism:** chỉ update khi stored version bằng expected version rồi increment. **Trade-off:** conflict cần retry/refresh. **GameStream:** room command dùng `expectedVersion` và trả `VERSION_CONFLICT` khi stale.

<a id="question-13"></a>

## 13. Aggregation pipeline là gì?

**Câu trả lời mẫu:** **Conclusion:** aggregation pipeline biến đổi document qua các stage có thứ tự. **Mechanism:** stage filter, group, project, sort hoặc join dữ liệu. **Trade-off:** pipeline phức tạp tốn CPU/memory. **GameStream:** admin dashboard group room theo status và sum player/spectator.

<a id="question-14"></a>

## 14. Vì sao MongoDB là authoritative store của GameStream?

**Câu trả lời mẫu:** **Conclusion:** durable game recovery cần source of truth sống qua process/cache loss. **Mechanism:** command commit room state và event history trước transient broadcast. **Trade-off:** authoritative read có thể chậm hơn cache. **GameStream:** Redis/Elasticsearch rebuild được, nhưng MongoDB quyết định room version hợp lệ.

<a id="question-15"></a>

## 15. Player resume sau disconnect thế nào?

**Câu trả lời mẫu:** **Conclusion:** load authoritative snapshot hiện tại và có thể replay event sau last version của client. **Mechanism:** query `game_events` theo room và aggregate version có thứ tự. **Trade-off:** event history cần retention và full-snapshot fallback. **GameStream:** `resume` trả room, tối đa 200 event mới và recovery mode.

## Bảng thuật ngữ kỹ thuật

| Technical term                 | Nghĩa tiếng Việt             | Giải thích đơn giản                                                   |
| ------------------------------ | ---------------------------- | --------------------------------------------------------------------- |
| MongoDB                        | Cơ sở dữ liệu MongoDB        | Document database lưu dữ liệu theo document giống JSON.               |
| Database                       | Cơ sở dữ liệu                | Không gian logic chứa nhiều collection.                               |
| Collection                     | Tập hợp                      | Nhóm document cùng mục đích, gần giống bảng trong SQL.                |
| Document                       | Tài liệu dữ liệu             | Bản ghi BSON gồm các field và value.                                  |
| Embedding                      | Nhúng dữ liệu                | Lưu dữ liệu liên quan ngay bên trong document cha.                    |
| Reference                      | Tham chiếu                   | Lưu ID để liên kết tới document khác.                                 |
| Atomicity                      | Tính nguyên tử               | Thao tác thành công toàn bộ hoặc không để lại thay đổi dở dang.       |
| Index                          | Chỉ mục                      | Cấu trúc giúp tìm và sắp xếp nhanh hơn đổi lại chi phí ghi và bộ nhớ. |
| Unique index                   | Chỉ mục duy nhất             | Ngăn nhiều document có cùng giá trị khóa được bảo vệ.                 |
| Transaction                    | Giao dịch                    | Nhóm nhiều thao tác được commit hoặc rollback như một đơn vị.         |
| Replica set                    | Tập bản sao                  | Nhóm MongoDB node giữ bản sao dữ liệu và hỗ trợ failover.             |
| Read concern                   | Mức đảm bảo khi đọc          | Quy định dữ liệu đọc phải ổn định hoặc mới đến mức nào.               |
| Write concern                  | Mức xác nhận khi ghi         | Quy định bao nhiêu node phải xác nhận thao tác ghi.                   |
| Optimistic concurrency control | Kiểm soát đồng thời lạc quan | Chỉ ghi khi version hiện tại vẫn đúng như caller mong đợi.            |
| Authoritative store            | Kho dữ liệu có thẩm quyền    | Nguồn dữ liệu chính dùng để quyết định trạng thái đúng.               |
