# Middle — Câu hỏi phỏng vấn Memory Cache

## Mục lục câu hỏi

1. [LRU khác TTL eviction thế nào?](#question-1)
2. [Ngăn duplicate load khi miss thế nào?](#question-2)
3. [Stale-write race nào có trong cache-aside?](#question-3)
4. [Propagate invalidation xuyên replica thế nào?](#question-4)
5. [Stale-while-revalidate là gì?](#question-5)
6. [Negative caching hữu ích khi nào?](#question-6)
7. [Thiết kế cache key thế nào?](#question-7)
8. [Cached value nên copy hay freeze?](#question-8)
9. [Statistic nào chứng minh cache có giá trị?](#question-9)
10. [Garbage collection ảnh hưởng cache latency thế nào?](#question-10)
11. [Khi nào dùng `WeakMap`?](#question-11)
12. [Timer per entry hay lazy expiry?](#question-12)
13. [Test TTL cache deterministic thế nào?](#question-13)
14. [Cache loader fail thì sao?](#question-14)
15. [Khi nào nên bỏ L1 cache?](#question-15)

<a id="question-1"></a>

## 1. LRU khác TTL eviction thế nào?

**Câu trả lời mẫu:** **Conclusion:** TTL remove theo tuổi; LRU remove least-recently-used khi đầy. **Mechanism:** có thể kết hợp. **Trade-off:** LRU bookkeeping tốn memory/operation. **GameStream:** TTL kiểm soát stale; capacity policy bảo vệ heap.

<a id="question-2"></a>

## 2. Ngăn duplicate load khi miss thế nào?

**Câu trả lời mẫu:** **Conclusion:** cache in-flight promise hoặc per-key request coalescing. **Mechanism:** concurrent caller await một loader rồi cache result. **Trade-off:** failure phải xoá in-flight entry. **GameStream:** tránh burst Mongo query khi public-room key expire.

<a id="question-3"></a>

## 3. Stale-write race nào có trong cache-aside?

**Câu trả lời mẫu:** **Conclusion:** slow reader có thể repopulate old data sau writer invalidation. **Mechanism:** reader đọc DB, writer commit/invalidate, reader set result cũ. **Trade-off:** version/double-delete/short TTL giảm risk nhưng thêm complexity. **GameStream:** chấp nhận bounded L1 window hai giây hoặc dùng version.

<a id="question-4"></a>

## 4. Propagate invalidation xuyên replica thế nào?

**Câu trả lời mẫu:** **Conclusion:** local delete chỉ ảnh hưởng một instance; dùng shared invalidation channel hoặc TTL rất ngắn. **Mechanism:** Redis Pub/Sub/event broadcast evict L1 key. **Trade-off:** missed message vẫn cần TTL safety. **GameStream:** multi-replica backend tương lai nên broadcast invalidation.

<a id="question-5"></a>

## 5. Stale-while-revalidate là gì?

**Câu trả lời mẫu:** **Conclusion:** serve slightly stale value ngay trong khi một loader refresh background. **Mechanism:** soft expiry khác hard expiry. **Trade-off:** latency thấp hơn nhưng stale tăng rõ. **GameStream:** hợp public discovery, không hợp authoritative resume.

<a id="question-6"></a>

## 6. Negative caching hữu ích khi nào?

**Câu trả lời mẫu:** **Conclusion:** cache absence thường gặp thật ngắn để bảo vệ dependency. **Mechanism:** typed sentinel có short TTL. **Trade-off:** entity mới invisible đến expiry. **GameStream:** invalid room ID chỉ negative-cache nếu access/creation semantics an toàn.

<a id="question-7"></a>

## 7. Thiết kế cache key thế nào?

**Câu trả lời mẫu:** **Conclusion:** gồm mọi input đổi output và schema/version namespace. **Mechanism:** canonical encoding ngăn collision. **Trade-off:** input nhiều chiều làm cardinality nổ. **GameStream:** limit, visibility và future filter phải nằm trong public-room key.

<a id="question-8"></a>

## 8. Cached value nên copy hay freeze?

**Câu trả lời mẫu:** **Conclusion:** bảo vệ shared state khỏi caller mutation bằng immutable type, freeze hoặc copy theo risk. **Mechanism:** freeze bắt write, clone isolate caller. **Trade-off:** deep operation tốn. **GameStream:** small summary array có thể copy khi return.

<a id="question-9"></a>

## 9. Statistic nào chứng minh cache có giá trị?

**Câu trả lời mẫu:** **Conclusion:** hit/miss, saved latency, load latency, eviction, entry/byte và stale/error outcome. **Mechanism:** so dependency load/end-user latency có và không cache. **Trade-off:** hit ratio có thể thưởng cheap hit vô ích. **GameStream:** correlate L1 hit với giảm Redis/Mongo query.

<a id="question-10"></a>

## 10. Garbage collection ảnh hưởng cache latency thế nào?

**Câu trả lời mẫu:** **Conclusion:** retained cache lớn tăng heap scan và GC pause. **Mechanism:** long-lived object chuyển old generation. **Trade-off:** thêm memory tăng hit nhưng hại tail latency. **GameStream:** cap theo p99/RSS, không chỉ free RAM.

<a id="question-11"></a>

## 11. Khi nào dùng `WeakMap`?

**Câu trả lời mẫu:** **Conclusion:** dùng metadata keyed bằng object identity mà entry không được giữ key sống. **Mechanism:** weak key không cản GC. **Trade-off:** không enumerable, key phải object. **GameStream:** string-key room cache cần `Map`, không cần `WeakMap`.

<a id="question-12"></a>

## 12. Timer per entry hay lazy expiry?

**Câu trả lời mẫu:** **Conclusion:** lazy expiry cộng periodic bounded cleanup thường scale tốt hơn timer mỗi key. **Mechanism:** read xoá expired, sweep xử lý cold key. **Trade-off:** cold expired entry chiếm memory tới cleanup. **GameStream:** bounded cache làm lazy expiry predictable.

<a id="question-13"></a>

## 13. Test TTL cache deterministic thế nào?

**Câu trả lời mẫu:** **Conclusion:** inject clock hoặc fake timer rồi test trước/tại/sau expiry và capacity boundary. **Mechanism:** bỏ wall-clock sleep. **Trade-off:** abstraction thêm code. **GameStream:** test hit, miss, expiry, prefix invalidation, eviction metric.

<a id="question-14"></a>

## 14. Cache loader fail thì sao?

**Câu trả lời mẫu:** **Conclusion:** propagate failure, mặc định không cache và clear in-flight marker. **Mechanism:** request sau retry theo backoff/circuit policy. **Trade-off:** dependency failure lặp tạo retry storm. **GameStream:** circuit-break Mongo failure thay vì trả cached empty success.

<a id="question-15"></a>

## 15. Khi nào nên bỏ L1 cache?

**Câu trả lời mẫu:** **Conclusion:** bỏ khi hit benefit thấp hoặc invalidation/memory/ops cost lớn hơn saved latency. **Mechanism:** feature-flag và so metric. **Trade-off:** Redis load tăng. **GameStream:** cache là measured optimisation, không phải requirement kiến trúc.

## Bảng thuật ngữ kỹ thuật

| Technical term           | Nghĩa tiếng Việt                  | Giải thích đơn giản                                               |
| ------------------------ | --------------------------------- | ----------------------------------------------------------------- |
| LRU                      | Loại bỏ mục ít dùng gần đây       | Evict entry có lần truy cập gần nhất xa nhất.                     |
| TTL eviction             | Loại bỏ theo thời gian sống       | Xóa entry khi thời hạn của nó kết thúc.                           |
| Single-flight            | Gộp lần tải đồng thời             | Nhiều request cùng chờ một lần load thay vì gọi nguồn lặp lại.    |
| Stale write              | Ghi dữ liệu cũ                    | Kết quả load cũ ghi đè cache sau một update mới hơn.              |
| Invalidation propagation | Lan truyền việc xóa cache         | Thông báo cho các replica bỏ entry đã cũ.                         |
| Stale-while-revalidate   | Dùng dữ liệu cũ trong lúc làm mới | Trả tạm cache cũ và refresh ở background.                         |
| Negative caching         | Cache kết quả không tồn tại       | Lưu ngắn hạn kết quả not-found hoặc empty để giảm tải.            |
| Cache key                | Khóa cache                        | Định danh duy nhất cần chứa mọi chiều ảnh hưởng kết quả.          |
| Defensive copy           | Bản sao phòng vệ                  | Trả bản sao để caller không sửa trực tiếp object trong cache.     |
| Hit rate                 | Tỷ lệ trúng cache                 | Tỷ lệ request được phục vụ từ cache.                              |
| Garbage collection       | Thu gom rác                       | Runtime thu hồi object không còn được tham chiếu.                 |
| WeakMap                  | Bản đồ tham chiếu yếu             | Map không giữ key object sống chỉ vì còn nằm trong cache.         |
| Lazy expiry              | Hết hạn khi truy cập              | Chỉ kiểm tra và xóa entry khi có request đọc.                     |
| Deterministic test       | Kiểm thử xác định                 | Test cho cùng kết quả, không phụ thuộc thời gian thực ngẫu nhiên. |
| Cache loader             | Hàm tải dữ liệu                   | Hàm lấy value từ nguồn khi cache miss.                            |
