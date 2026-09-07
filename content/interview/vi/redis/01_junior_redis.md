# Junior — Câu hỏi phỏng vấn Redis

## Mục lục câu hỏi

1. [Redis là gì?](#question-1)
2. [Redis key là gì và vì sao cần naming convention?](#question-2)
3. [TTL là gì?](#question-3)
4. [Cache-aside là gì?](#question-4)
5. [`MULTI/EXEC` cung cấp gì?](#question-5)
6. [`WATCH` làm gì?](#question-6)
7. [Vì sao dùng Lua script trong Redis?](#question-7)
8. [Redis Pub/Sub là gì?](#question-8)
9. [Redis Stream là gì?](#question-9)
10. [Pub/Sub khác Streams thế nào?](#question-10)
11. [Stream consumer group là gì?](#question-11)
12. [Redis có persistence option nào?](#question-12)
13. [Eviction policy là gì?](#question-13)
14. [Redis model presence thế nào?](#question-14)
15. [Vì sao Redis không là game source of truth?](#question-15)

<a id="question-1"></a>

## 1. Redis là gì?

**Câu trả lời mẫu:** **Conclusion:** Redis là in-memory data-structure server có persistence tuỳ chọn. **Mechanism:** command thao tác string, hash, set, sorted set, stream và nhiều loại khác. **Trade-off:** memory đắt và durability/eviction phải cấu hình có chủ ý. **GameStream:** Redis phục vụ cache, presence, Pub/Sub và bounded realtime recovery.

<a id="question-2"></a>

## 2. Redis key là gì và vì sao cần naming convention?

**Câu trả lời mẫu:** **Conclusion:** key định danh value; namespace làm rõ ownership/lifecycle. **Mechanism:** prefix `cache:`, `presence:`, `room:events:` nhóm key. **Trade-off:** tên dài tốn memory nhưng dễ vận hành. **GameStream:** admin monitor scan từng prefix riêng.

<a id="question-3"></a>

## 3. TTL là gì?

**Câu trả lời mẫu:** **Conclusion:** TTL tự động expire key sau một khoảng thời gian. **Mechanism:** Redis dọn expired data theo lazy và active expiration. **Trade-off:** timing expiry không phải business scheduler guarantee. **GameStream:** cache/presence key dùng TTL để tự dọn stale data.

<a id="question-4"></a>

## 4. Cache-aside là gì?

**Câu trả lời mẫu:** **Conclusion:** app đọc cache trước, miss thì load database rồi populate cache. **Mechanism:** write invalidate hoặc update cached entry. **Trade-off:** miss thêm round trip và vẫn có stale window. **GameStream:** public-room list đọc process memory, Redis rồi MongoDB.

<a id="question-5"></a>

## 5. `MULTI/EXEC` cung cấp gì?

**Câu trả lời mẫu:** **Conclusion:** nó queue command và execute tuần tự như một isolated transaction block. **Mechanism:** client khác không interleave command trong execution. **Trade-off:** Redis không rollback command trước khi command sau runtime-error. **GameStream:** dùng cho related Redis state, không thay MongoDB business transaction.

<a id="question-6"></a>

## 6. `WATCH` làm gì?

**Câu trả lời mẫu:** **Conclusion:** `WATCH` implement optimistic concurrency trên key. **Mechanism:** `EXEC` abort nếu watched key thay đổi. **Trade-off:** contention tạo retry. **GameStream:** có thể guard compare-and-set presence/lease; MongoDB vẫn sở hữu game version.

<a id="question-7"></a>

## 7. Vì sao dùng Lua script trong Redis?

**Câu trả lời mẫu:** **Conclusion:** Lua thực hiện multi-step server-side logic atomically. **Mechanism:** Redis chạy script không interleave command khác. **Trade-off:** script dài block server. **GameStream:** token-bucket rate limit hoặc compare-delete lock có thể là một script.

<a id="question-8"></a>

## 8. Redis Pub/Sub là gì?

**Câu trả lời mẫu:** **Conclusion:** Pub/Sub broadcast cho client đang subscribe. **Mechanism:** publisher ghi channel và Redis push message. **Trade-off:** at-most-once, không retain. **GameStream:** fan-out giữa active backend được nhưng không recover disconnected client một mình.

<a id="question-9"></a>

## 9. Redis Stream là gì?

**Câu trả lời mẫu:** **Conclusion:** Stream là append-only sequence của retained entry có ID. **Mechanism:** client read theo ID và consumer group track pending work. **Trade-off:** cần trimming/pending management. **GameStream:** giữ recent room event cho short reconnect recovery.

<a id="question-10"></a>

## 10. Pub/Sub khác Streams thế nào?

**Câu trả lời mẫu:** **Conclusion:** Pub/Sub là ephemeral live broadcast; Streams retain để replay/acknowledge. **Mechanism:** subscriber disconnect mất Pub/Sub, Stream reader resume bằng ID. **Trade-off:** Streams tốn memory/ops. **GameStream:** Pub/Sub fan-out; Streams giữ bounded missed-packet window.

<a id="question-11"></a>

## 11. Stream consumer group là gì?

**Câu trả lời mẫu:** **Conclusion:** consumer group phân phối entry và track pending acknowledgement. **Mechanism:** `XREADGROUP`, `XACK` và claim quản lý ownership. **Trade-off:** abandoned pending entry cần recovery. **GameStream:** hợp work distribution; per-client socket recovery có thể read theo offset.

<a id="question-12"></a>

## 12. Redis có persistence option nào?

**Câu trả lời mẫu:** **Conclusion:** RDB snapshot và AOF log cho recovery khác nhau, có thể kết hợp. **Mechanism:** RDB chụp point-in-time; AOF ghi write operation. **Trade-off:** durability tốn disk/latency và vẫn không thành MongoDB authority. **GameStream:** local Redis bật AOF nhưng cache rebuild được.

<a id="question-13"></a>

## 13. Eviction policy là gì?

**Câu trả lời mẫu:** **Conclusion:** policy quyết định hành vi khi memory đầy. **Mechanism:** có thể evict key đủ điều kiện hoặc reject write. **Trade-off:** trộn cache với critical coordination khiến eviction nguy hiểm. **GameStream:** local `noeviction` tránh mất stream/presence âm thầm nhưng có thể fail write.

<a id="question-14"></a>

## 14. Redis model presence thế nào?

**Câu trả lời mẫu:** **Conclusion:** lưu user/connection key ngắn hạn được heartbeat refresh. **Mechanism:** TTL xoá presence khi refresh dừng. **Trade-off:** presence chỉ approximate khi network partition. **GameStream:** `presence:<userId>:<socketId>` cho online-user estimate.

<a id="question-15"></a>

## 15. Vì sao Redis không là game source of truth?

**Câu trả lời mẫu:** **Conclusion:** cache loss, failover, expiry hoặc eviction không được xoá game progress bền vững. **Mechanism:** command commit MongoDB; Redis chỉ giữ disposable/replay-bounded state. **Trade-off:** database recovery chậm hơn memory. **GameStream:** room resume fallback MongoDB snapshot/event.

## Bảng thuật ngữ kỹ thuật

| Technical term    | Nghĩa tiếng Việt     | Giải thích đơn giản                                                   |
| ----------------- | -------------------- | --------------------------------------------------------------------- |
| Redis             | Kho dữ liệu Redis    | In-memory data store hỗ trợ nhiều cấu trúc dữ liệu và thao tác nhanh. |
| Key               | Khóa                 | Tên duy nhất dùng để truy cập một giá trị trong Redis.                |
| Naming convention | Quy ước đặt tên      | Cách đặt key nhất quán để thể hiện namespace và ownership.            |
| TTL               | Thời gian sống       | Khoảng thời gian trước khi key tự hết hạn.                            |
| Cache-aside       | Cache đặt bên cạnh   | Ứng dụng đọc cache trước rồi tải từ nguồn và ghi cache khi miss.      |
| MULTI/EXEC        | Giao dịch lệnh Redis | Xếp một nhóm lệnh để Redis thực thi tuần tự như một batch.            |
| WATCH             | Theo dõi khóa        | Hủy transaction nếu key bị thay đổi trước khi EXEC.                   |
| Lua script        | Kịch bản Lua         | Chạy nhiều bước atomically bên trong Redis server.                    |
| Pub/Sub           | Xuất bản và đăng ký  | Publisher gửi message cho subscriber đang online mà không lưu lại.    |
| Redis Stream      | Luồng Redis          | Cấu trúc log có ID, lưu message và hỗ trợ đọc lại.                    |
| Consumer group    | Nhóm consumer        | Chia message trong stream cho nhiều consumer cùng nhóm.               |
| Persistence       | Lưu bền vững         | Cơ chế ghi dữ liệu Redis xuống disk để hỗ trợ khôi phục.              |
| Eviction policy   | Chính sách loại bỏ   | Quy tắc chọn key bị xóa khi đạt giới hạn memory.                      |
| Presence          | Trạng thái hiện diện | Thông tin user hoặc connection đang online.                           |
| Source of truth   | Nguồn dữ liệu chuẩn  | Nơi có thẩm quyền xác định trạng thái đúng cuối cùng.                 |
