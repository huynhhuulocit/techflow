# Junior — Câu hỏi phỏng vấn Memory Cache

## Mục lục câu hỏi

1. [In-memory cache là gì?](#question-1)
2. [Vì sao process memory nhanh hơn Redis?](#question-2)
3. [Cache hit và miss là gì?](#question-3)
4. [Vì sao cache entry cần TTL?](#question-4)
5. [Vì sao memory cache phải bounded?](#question-5)
6. [Cache invalidation là gì?](#question-6)
7. [Vì sao memory cache process-local?](#question-7)
8. [Cache có thể là source of truth không?](#question-8)
9. [Eviction policy là gì?](#question-9)
10. [Cache-aside với L1/L2 là gì?](#question-10)
11. [Vì sao không nên cache mutable object reference bất cẩn?](#question-11)
12. [Điều gì gây memory-cache leak?](#question-12)
13. [Có nên cache error không?](#question-13)
14. [Synchronous cache read ảnh hưởng async code thế nào?](#question-14)
15. [Value nào là cache candidate tốt?](#question-15)

<a id="question-1"></a>

## 1. In-memory cache là gì?

**Câu trả lời mẫu:** **Conclusion:** nó lưu value tái sử dụng trong application process để tránh work chậm lặp lại. **Mechanism:** key map tới value và expiry metadata. **Trade-off:** data mất khi restart và không shared. **GameStream:** custom L1 dựa `Map` cache public-room list.

<a id="question-2"></a>

## 2. Vì sao process memory nhanh hơn Redis?

**Câu trả lời mẫu:** **Conclusion:** không có network, protocol và remote-server work. **Mechanism:** process đọc local object reference. **Trade-off:** mỗi replica có cache khác nhau. **GameStream:** L1 giảm Redis lookup lặp cho hot list ngắn hạn.

<a id="question-3"></a>

## 3. Cache hit và miss là gì?

**Câu trả lời mẫu:** **Conclusion:** hit trả cached value còn dùng được; miss phải load layer tiếp theo. **Mechanism:** expired entry là miss. **Trade-off:** hit ratio cao chỉ tốt khi result đúng. **GameStream:** cache stats expose hit, miss, key count.

<a id="question-4"></a>

## 4. Vì sao cache entry cần TTL?

**Câu trả lời mẫu:** **Conclusion:** TTL bound thời gian stale/unused data tồn tại. **Mechanism:** read so current time với expiration. **Trade-off:** TTL ngắn giảm stale nhưng giảm hit. **GameStream:** L1 khoảng hai giây vì public-room data đổi thường xuyên.

<a id="question-5"></a>

## 5. Vì sao memory cache phải bounded?

**Câu trả lời mẫu:** **Conclusion:** key không giới hạn có thể ăn heap và crash process. **Mechanism:** limit entry/weight và evict/reject khi đầy. **Trade-off:** eviction giảm hit. **GameStream:** cache service có max size và eviction stats.

<a id="question-6"></a>

## 6. Cache invalidation là gì?

**Câu trả lời mẫu:** **Conclusion:** invalidation xoá value có thể không còn khớp authoritative state. **Mechanism:** write delete exact key hoặc controlled prefix. **Trade-off:** invalidate rộng mất entry tốt, bỏ sót serve stale. **GameStream:** room mutation invalidate public-room list.

<a id="question-7"></a>

## 7. Vì sao memory cache process-local?

**Câu trả lời mẫu:** **Conclusion:** mỗi OS process sở hữu heap riêng. **Mechanism:** replica không thấy mutation `Map` của nhau. **Trade-off:** horizontal scaling giảm global consistency. **GameStream:** Redis là shared L2; L1 disposable theo backend instance.

<a id="question-8"></a>

## 8. Cache có thể là source of truth không?

**Câu trả lời mẫu:** **Conclusion:** không nếu expiry/eviction/disappearance không được làm mất business correctness. **Mechanism:** miss reload từ authoritative store. **Trade-off:** source read chậm hơn. **GameStream:** MongoDB sở hữu room state; L1 chỉ summary.

<a id="question-9"></a>

## 9. Eviction policy là gì?

**Câu trả lời mẫu:** **Conclusion:** policy chọn entry để remove khi đạt capacity. **Mechanism:** FIFO, LRU, LFU hoặc oldest-entry. **Trade-off:** policy chính xác hơn cần metadata/CPU. **GameStream:** simple bound đủ tới khi measurement justify LRU.

<a id="question-10"></a>

## 10. Cache-aside với L1/L2 là gì?

**Câu trả lời mẫu:** **Conclusion:** check L1 memory, L2 Redis, database rồi fill layer nhanh hơn. **Mechanism:** mỗi layer có TTL riêng. **Trade-off:** stale/invalidation path nhân lên. **GameStream:** public room theo read path này.

<a id="question-11"></a>

## 11. Vì sao không nên cache mutable object reference bất cẩn?

**Câu trả lời mẫu:** **Conclusion:** caller có thể mutate reference và âm thầm đổi future result. **Mechanism:** JavaScript object là reference value. **Trade-off:** clone/freeze tốn CPU/memory. **GameStream:** cached summary nên readonly hoặc copy tại boundary.

<a id="question-12"></a>

## 12. Điều gì gây memory-cache leak?

**Câu trả lời mẫu:** **Conclusion:** key không bound/expiry, timer, closure hoặc listener giữ value mãi. **Mechanism:** reachable object không được GC. **Trade-off:** cleanup logic thêm bookkeeping. **GameStream:** monitor key count, eviction và RSS cùng nhau.

<a id="question-13"></a>

## 13. Có nên cache error không?

**Câu trả lời mẫu:** **Conclusion:** thường không; một số “not found” có thể negative-cache rất ngắn. **Mechanism:** short sentinel tránh repeated miss. **Trade-off:** entity mới có thể vô hình tới expiry. **GameStream:** không cache transient Mongo/Redis failure thành empty room list.

<a id="question-14"></a>

## 14. Synchronous cache read ảnh hưởng async code thế nào?

**Câu trả lời mẫu:** **Conclusion:** local lookup sync, miss tiếp tục async tới Redis/database. **Mechanism:** service early-return khi hit. **Trade-off:** serialization lớn vẫn block event loop. **GameStream:** chỉ small room summary vào L1.

<a id="question-15"></a>

## 15. Value nào là cache candidate tốt?

**Câu trả lời mẫu:** **Conclusion:** expensive/frequent, tái sử dụng, chịu stale ngắn và bounded size. **Mechanism:** đo hit rate/saved latency. **Trade-off:** one-off hoặc correctness-critical data ít lợi. **GameStream:** public-room list phù hợp, roll command result không.

## Bảng thuật ngữ kỹ thuật

| Technical term     | Nghĩa tiếng Việt            | Giải thích đơn giản                                         |
| ------------------ | --------------------------- | ----------------------------------------------------------- |
| In-memory cache    | Bộ nhớ đệm trong tiến trình | Lưu dữ liệu tạm ngay trong RAM của application process.     |
| Process memory     | Bộ nhớ tiến trình           | RAM được process hiện tại quản lý và truy cập trực tiếp.    |
| Cache hit          | Lần đọc trúng cache         | Cache có sẵn giá trị cần đọc.                               |
| Cache miss         | Lần đọc trượt cache         | Cache không có giá trị nên phải tải từ nguồn.               |
| Cache entry        | Mục dữ liệu cache           | Một cặp key và value cùng metadata như thời điểm hết hạn.   |
| TTL                | Thời gian sống              | Thời gian một cache entry được giữ trước khi hết hạn.       |
| Bounded cache      | Cache có giới hạn           | Cache có giới hạn số entry hoặc dung lượng memory.          |
| Cache invalidation | Làm mất hiệu lực cache      | Xóa hoặc đánh dấu entry không còn đúng.                     |
| Process-local      | Cục bộ trong tiến trình     | Chỉ process hiện tại nhìn thấy dữ liệu.                     |
| Source of truth    | Nguồn dữ liệu chuẩn         | Nơi giữ dữ liệu đúng cuối cùng, không phải cache.           |
| Eviction policy    | Chính sách loại bỏ          | Quy tắc chọn entry bị bỏ khi cache đầy.                     |
| Cache-aside        | Cache đặt bên cạnh          | Ứng dụng tự đọc nguồn và điền cache khi miss.               |
| L1 cache           | Cache tầng một              | Cache nhanh nhất nằm ngay trong process.                    |
| L2 cache           | Cache tầng hai              | Cache dùng chung bên ngoài process như Redis.               |
| Memory leak        | Rò rỉ bộ nhớ                | Dữ liệu không còn cần nhưng vẫn bị giữ nên memory tăng mãi. |
