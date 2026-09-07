# Middle — Câu hỏi phỏng vấn Node.js và NestJS

## Mục lục câu hỏi

1. [Điều gì block Node.js event loop?](#question-1)
2. [Kiểm soát asynchronous concurrency thế nào?](#question-2)
3. [Backpressure là gì?](#question-3)
4. [Custom DI token hữu ích thế nào?](#question-4)
5. [Thiết kế Nest module boundary thế nào?](#question-5)
6. [Tránh circular dependency thế nào?](#question-6)
7. [Nest lifecycle hook nào quan trọng cho vận hành?](#question-7)
8. [WebSocket gateway nên authenticate client thế nào?](#question-8)
9. [Map application error sang HTTP response thế nào?](#question-9)
10. [Validation nên nằm ở đâu?](#question-10)
11. [Idempotent HTTP command hoạt động thế nào?](#question-11)
12. [Liveness khác readiness thế nào?](#question-12)
13. [Propagate request context thế nào?](#question-13)
14. [Khi nào dùng worker thread hoặc process khác?](#question-14)
15. [Điều gì thay đổi khi scale ngang Nest backend?](#question-15)

<a id="question-1"></a>

## 1. Điều gì block Node.js event loop?

**Câu trả lời mẫu:** **Conclusion:** synchronous JavaScript dài, serialization lớn, regex nguy hiểm và một số synchronous API block event loop. **Mechanism:** callback khác không chạy cho tới khi callback hiện tại return. **Trade-off:** synchronous work nhỏ đơn giản hơn; việc nặng phải bounded hoặc chuyển đi. **GameStream:** dice transition nhỏ, nhưng video encoding không được chạy trong API loop.

<a id="question-2"></a>

## 2. Kiểm soát asynchronous concurrency thế nào?

**Câu trả lời mẫu:** **Conclusion:** chọn concurrency tường minh thay vì serial await hoặc `Promise.all` không giới hạn. **Mechanism:** pool, semaphore và batch giới hạn I/O đồng thời. **Trade-off:** limit thấp giảm throughput, cao làm dependency quá tải. **GameStream:** admin health check chạy concurrent, còn bulk projection phải dùng batch có giới hạn.

<a id="question-3"></a>

## 3. Backpressure là gì?

**Câu trả lời mẫu:** **Conclusion:** backpressure ngăn producer nhanh làm consumer chậm quá tải. **Mechanism:** stream báo buffer đầy, queue expose lag hoặc pending work. **Trade-off:** backpressure tăng latency nhưng tránh memory failure. **GameStream:** Kafka consumer lag và outbox depth cho biết projection đang không theo kịp event production.

<a id="question-4"></a>

## 4. Custom DI token hữu ích thế nào?

**Câu trả lời mẫu:** **Conclusion:** token tách consumer khỏi concrete class hoặc value. **Mechanism:** symbol/string map configuration, interface-like contract hoặc factory tới provider. **Trade-off:** token cần ownership tập trung để tránh collision. **GameStream:** validated app config được inject qua token thay vì đọc `process.env` khắp nơi.

<a id="question-5"></a>

## 5. Thiết kế Nest module boundary thế nào?

**Câu trả lời mẫu:** **Conclusion:** tổ chức theo business capability và expose application API hẹp. **Mechanism:** module sở hữu provider và chỉ export service cần thiết. **Trade-off:** module quá nhỏ tăng wiring, quá rộng thành big ball of mud. **GameStream:** room rule thuộc rooms/domain; chat kiểm tra membership qua service call có chủ ý.

<a id="question-6"></a>

## 6. Tránh circular dependency thế nào?

**Câu trả lời mẫu:** **Conclusion:** sửa ownership model thay vì mặc định dùng `forwardRef`. **Mechanism:** tách shared abstraction, publish event hoặc đảo dependency direction. **Trade-off:** bridge đôi khi cần nhưng cycle là dấu hiệu coupling. **GameStream:** realtime broadcast có thể consume integration event thay vì rooms và gateway inject lẫn nhau.

<a id="question-7"></a>

## 7. Nest lifecycle hook nào quan trọng cho vận hành?

**Câu trả lời mẫu:** **Conclusion:** khởi tạo resource trước readiness và giải phóng khi shutdown. **Mechanism:** module/application init/destroy hook phối hợp connection, index và timer. **Trade-off:** init chậm hoặc partial phải làm readiness fail. **GameStream:** Mongo index, Redis subscription và gateway timer cần startup/cleanup ownership rõ.

<a id="question-8"></a>

## 8. WebSocket gateway nên authenticate client thế nào?

**Câu trả lời mẫu:** **Conclusion:** authenticate tại handshake và authorise từng action đặc quyền. **Mechanism:** verify bearer token, gắn principal tối thiểu vào socket data rồi kiểm tra room membership. **Trade-off:** connection dài cần policy token expiry/reconnect. **GameStream:** game/admin namespace verify JWT; publish permission do server cấp theo room.

<a id="question-9"></a>

## 9. Map application error sang HTTP response thế nào?

**Câu trả lời mẫu:** **Conclusion:** phân biệt validation, authentication, authorisation, conflict, not-found và infrastructure error. **Mechanism:** typed domain/application error được translate tại transport boundary. **Trade-off:** expose raw infrastructure message làm rò rỉ chi tiết. **GameStream:** `expectedVersion` cũ thành structured 409 thay vì 500 chung chung.

<a id="question-10"></a>

## 10. Validation nên nằm ở đâu?

**Câu trả lời mẫu:** **Conclusion:** validate syntax tại transport boundary và business invariant trong domain/application layer. **Mechanism:** schema từ chối command sai shape; domain transition từ chối action trái luật. **Trade-off:** lặp cùng rule ở nhiều layer gây drift. **GameStream:** Zod kiểm tra command shape, `startGame` enforce owner, readiness và minimum players.

<a id="question-11"></a>

## 11. Idempotent HTTP command hoạt động thế nào?

**Câu trả lời mẫu:** **Conclusion:** cùng logical command gửi lại trả original outcome mà không lặp side effect. **Mechanism:** persist unique command ID và receipt atomically cùng state change. **Trade-off:** receipt tốn storage và cần retention. **GameStream:** command receipt được kiểm tra trước và bên trong MongoDB transaction.

<a id="question-12"></a>

## 12. Liveness khác readiness thế nào?

**Câu trả lời mẫu:** **Conclusion:** liveness nói process nên tiếp tục chạy; readiness nói nó có thể nhận traffic an toàn. **Mechanism:** readiness gồm critical dependency/projection state, còn liveness phải nhẹ. **Trade-off:** liveness check quá sâu gây restart loop. **GameStream:** worker readiness false khi projection unhealthy.

<a id="question-13"></a>

## 13. Propagate request context thế nào?

**Câu trả lời mẫu:** **Conclusion:** mỗi request/event phải mang correlation data xuyên log và async hop. **Mechanism:** middleware tạo correlation ID; event envelope giữ correlation/causation ID. **Trade-off:** context API có thể leak nếu lifecycle sai. **GameStream:** command ID nối API call, MongoDB event, outbox record và Kafka projection.

<a id="question-14"></a>

## 14. Khi nào dùng worker thread hoặc process khác?

**Câu trả lời mẫu:** **Conclusion:** chuyển CPU-intensive hoặc failure-sensitive work khỏi main event loop. **Mechanism:** worker thread chung process; process riêng cách ly mạnh hơn. **Trade-off:** communication và deployment phức tạp hơn. **GameStream:** media processing thuộc LiveKit/media infrastructure; worker hiện tại cách ly async projection.

<a id="question-15"></a>

## 15. Điều gì thay đổi khi scale ngang Nest backend?

**Câu trả lời mẫu:** **Conclusion:** process-local state không còn globally authoritative. **Mechanism:** session, presence, socket fan-out và lock cần shared coordination hoặc partitioning. **Trade-off:** distributed coordination thêm latency và failure mode. **GameStream:** Redis phối hợp presence/realtime, MongoDB giữ truth, memory cache chỉ là L1 disposable.

## Bảng thuật ngữ kỹ thuật

| Technical term      | Nghĩa tiếng Việt          | Giải thích đơn giản                                                  |
| ------------------- | ------------------------- | -------------------------------------------------------------------- |
| Event-loop blocking | Chặn vòng lặp sự kiện     | Công việc đồng bộ lâu làm mọi request khác phải chờ.                 |
| Concurrency limit   | Giới hạn đồng thời        | Giới hạn số tác vụ chạy cùng lúc để bảo vệ tài nguyên.               |
| Backpressure        | Áp lực ngược              | Cơ chế làm chậm hoặc từ chối producer khi consumer không xử lý kịp.  |
| DI token            | Mã định danh dependency   | Khóa để dependency-injection container tìm đúng implementation.      |
| Module boundary     | Ranh giới mô-đun          | Phạm vi ownership và public interface của một module.                |
| Circular dependency | Phụ thuộc vòng            | Hai hoặc nhiều module phụ thuộc ngược lẫn nhau.                      |
| Lifecycle hook      | Điểm móc vòng đời         | Method được framework gọi khi khởi tạo hoặc đóng ứng dụng.           |
| WebSocket gateway   | Cổng giao tiếp WebSocket  | Thành phần NestJS quản lý connection và realtime event.              |
| Error mapping       | Ánh xạ lỗi                | Chuyển application/domain error thành response transport phù hợp.    |
| Idempotent command  | Lệnh có tính lũy đẳng     | Gửi lại cùng command không tạo thêm business effect.                 |
| Liveness            | Khả năng process còn sống | Cho biết process có chạy và không bị treo hoàn toàn.                 |
| Readiness           | Khả năng phục vụ          | Cho biết instance đã sẵn sàng nhận traffic hay chưa.                 |
| Request context     | Ngữ cảnh request          | Metadata như request ID, user và correlation đi theo một request.    |
| Worker thread       | Luồng worker              | Luồng riêng dùng cho tác vụ CPU nặng mà không chặn event loop chính. |
| Horizontal scaling  | Mở rộng theo chiều ngang  | Tăng capacity bằng cách chạy thêm instance.                          |
