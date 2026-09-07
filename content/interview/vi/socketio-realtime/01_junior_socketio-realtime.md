# Junior — Câu hỏi phỏng vấn Socket.IO và realtime

## Mục lục câu hỏi

1. [Socket.IO là gì?](#question-1)
2. [Socket.IO khác raw WebSocket thế nào?](#question-2)
3. [Event là gì?](#question-3)
4. [Socket.IO room là gì?](#question-4)
5. [Namespace là gì?](#question-5)
6. [Acknowledgement là gì?](#question-6)
7. [Socket.IO guarantee message order không?](#question-7)
8. [Default delivery guarantee là gì?](#question-8)
9. [Client disconnect thì sao?](#question-9)
10. [Socket authenticate thế nào?](#question-10)
11. [Broadcasting là gì?](#question-11)
12. [Vì sao không gửi livestream qua Socket.IO?](#question-12)
13. [`socket.id` có phải user identity không?](#question-13)
14. [Vì sao realtime payload có room version?](#question-14)
15. [Safe resume workflow là gì?](#question-15)

<a id="question-1"></a>

## 1. Socket.IO là gì?

**Câu trả lời mẫu:** **Conclusion:** Socket.IO là bidirectional event-based realtime library, không phải WebSocket protocol. **Mechanism:** dùng Engine.IO transport, reconnect, room và acknowledgement. **Trade-off:** client/server đều cần Socket.IO protocol. **GameStream:** browser và Nest gateway trao đổi room/chat event.

<a id="question-2"></a>

## 2. Socket.IO khác raw WebSocket thế nào?

**Câu trả lời mẫu:** **Conclusion:** WebSocket là transport; Socket.IO thêm event protocol và operational feature. **Mechanism:** có thể bắt đầu polling rồi upgrade WebSocket. **Trade-off:** frame/dependency thêm overhead. **GameStream:** built-in room/reconnect giảm plumbing.

<a id="question-3"></a>

## 3. Event là gì?

**Câu trả lời mẫu:** **Conclusion:** event là named message có payload. **Mechanism:** một bên emit, bên kia đăng ký handler. **Trade-off:** event name/payload thành contract cần version. **GameStream:** room update/chat message có typed shared payload.

<a id="question-4"></a>

## 4. Socket.IO room là gì?

**Câu trả lời mẫu:** **Conclusion:** room là server-side group của socket cho targeted broadcast. **Mechanism:** socket join/leave room name, adapter track membership. **Trade-off:** membership transient nếu không persist. **GameStream:** socket join room ID sau authoritative membership check.

<a id="question-5"></a>

## 5. Namespace là gì?

**Câu trả lời mẫu:** **Conclusion:** namespace tách connection handler/event space trên một server. **Mechanism:** client connect path như `/game`, `/admin`. **Trade-off:** quá nhiều namespace duplicate auth/resource. **GameStream:** admin monitoring tách privileged namespace.

<a id="question-6"></a>

## 6. Acknowledgement là gì?

**Câu trả lời mẫu:** **Conclusion:** acknowledgement xác nhận event đã được xử lý. **Mechanism:** emitter áp timeout/retry. **Trade-off:** mất ack gây retry dù processing thành công. **GameStream:** retried command cần idempotency.

<a id="question-7"></a>

## 7. Socket.IO guarantee message order không?

**Câu trả lời mẫu:** **Conclusion:** giữ order cho message đến trên connection, kể cả transport upgrade. **Mechanism:** ordered transport và upgrade protocol giữ sequence. **Trade-off:** ordering không guarantee arrival. **GameStream:** version check vẫn phát hiện missed/stale update.

<a id="question-8"></a>

## 8. Default delivery guarantee là gì?

**Câu trả lời mẫu:** **Conclusion:** mặc định at-most-once arrival. **Mechanism:** server không tự retain message cho disconnected client. **Trade-off:** stronger delivery phải build ở application. **GameStream:** Redis Streams/Mongo resume cover missed event.

<a id="question-9"></a>

## 9. Client disconnect thì sao?

**Câu trả lời mẫu:** **Conclusion:** client thường reconnect nhưng server state/event có thể bị miss. **Mechanism:** backoff điều khiển attempt. **Trade-off:** reconnect success không phải recovery success. **GameStream:** client gửi last room version để resync.

<a id="question-10"></a>

## 10. Socket authenticate thế nào?

**Câu trả lời mẫu:** **Conclusion:** gửi short-lived token trong handshake và verify server-side. **Mechanism:** gắn principal vào socket data. **Trade-off:** connection dài cần expiry handling. **GameStream:** JWT auth trước room join/admin.

<a id="question-11"></a>

## 11. Broadcasting là gì?

**Câu trả lời mẫu:** **Conclusion:** gửi event tới nhiều matching socket. **Mechanism:** target namespace, room, all hoặc all-except-sender. **Trade-off:** fan-out lớn tốn bandwidth/CPU. **GameStream:** room update chỉ emit tới member room đó.

<a id="question-12"></a>

## 12. Vì sao không gửi livestream qua Socket.IO?

**Câu trả lời mẫu:** **Conclusion:** application socket không dành cho adaptive low-latency media. **Mechanism:** WebRTC xử lý codec, congestion, jitter, media track. **Trade-off:** LiveKit thêm infrastructure. **GameStream:** Socket.IO mang game/chat; LiveKit mang camera/mic.

<a id="question-13"></a>

## 13. `socket.id` có phải user identity không?

**Câu trả lời mẫu:** **Conclusion:** không; đó là transient connection ID và đổi khi reconnect. **Mechanism:** user ID phải từ verified token. **Trade-off:** một user có nhiều socket. **GameStream:** presence key kết hợp user/socket ID.

<a id="question-14"></a>

## 14. Vì sao realtime payload có room version?

**Câu trả lời mẫu:** **Conclusion:** để detect duplicate, stale update và gap. **Mechanism:** chỉ apply newer contiguous version hoặc recover. **Trade-off:** client thêm state logic. **GameStream:** Mongo aggregate version là ordering reference.

<a id="question-15"></a>

## 15. Safe resume workflow là gì?

**Câu trả lời mẫu:** **Conclusion:** thử short socket recovery rồi fetch authoritative snapshot/event nếu fail hoặc có gap. **Mechanism:** reconcile theo version, không theo connection ID. **Trade-off:** full snapshot tốn bandwidth. **GameStream:** Redis xử lý gap ngắn, MongoDB xử lý disconnect/restart dài.

## Bảng thuật ngữ kỹ thuật

| Technical term           | Nghĩa tiếng Việt                  | Giải thích đơn giản                                                          |
| ------------------------ | --------------------------------- | ---------------------------------------------------------------------------- |
| Socket.IO                | Thư viện giao tiếp thời gian thực | Thư viện event-based hỗ trợ WebSocket, polling, room và reconnect.           |
| Raw WebSocket            | WebSocket nguyên bản              | Protocol frame hai chiều không có sẵn abstraction room hoặc acknowledgement. |
| Event                    | Sự kiện                           | Message có tên và payload biểu diễn điều đã xảy ra hoặc yêu cầu.             |
| Socket.IO room           | Phòng Socket.IO                   | Nhóm socket phía server dùng để broadcast theo membership.                   |
| Namespace                | Không gian tên                    | Logical endpoint tách connection và event handler.                           |
| Acknowledgement          | Phản hồi xác nhận                 | Callback hoặc response liên kết với event request.                           |
| Message ordering         | Thứ tự thông điệp                 | Các event trên cùng connection được nhận theo thứ tự gửi.                    |
| Delivery guarantee       | Bảo đảm chuyển phát               | Cam kết message có thể mất, lặp hoặc được nhận bao nhiêu lần.                |
| Disconnect               | Mất kết nối                       | Socket không còn kết nối với server.                                         |
| Handshake authentication | Xác thực khi bắt tay              | Kiểm tra credential lúc socket thiết lập connection.                         |
| Broadcasting             | Phát tới nhiều kết nối            | Gửi event cho một nhóm hoặc tất cả socket.                                   |
| Livestream               | Phát trực tiếp                    | Luồng audio/video realtime, không nên truyền như socket JSON event.          |
| Socket ID                | Mã kết nối socket                 | Định danh tạm thời của connection, không phải user identity ổn định.         |
| Room version             | Phiên bản phòng                   | Số tăng dần giúp client phát hiện state cũ hoặc event bị thiếu.              |
| Resume workflow          | Luồng tiếp tục phiên              | Quy trình reconnect, lấy event thiếu hoặc tải snapshot mới.                  |
