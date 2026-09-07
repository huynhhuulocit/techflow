# Middle — Câu hỏi phỏng vấn Socket.IO và realtime

## Mục lục câu hỏi

1. [Thêm client-to-server at-least-once thế nào?](#question-1)
2. [Vì sao retry bắt buộc idempotency?](#question-2)
3. [Connection-state recovery là gì?](#question-3)
4. [Vì sao Redis Pub/Sub không đủ packet recovery?](#question-4)
5. [Redis Streams cải thiện recovery thế nào?](#question-5)
6. [Nhiều Socket.IO instance broadcast chung thế nào?](#question-6)
7. [Xử lý slow socket client thế nào?](#question-7)
8. [Presence xử lý nhiều tab thế nào?](#question-8)
9. [JWT expire trong connection thì sao?](#question-9)
10. [Realtime contract evolve thế nào?](#question-10)
11. [Detect missed-event gap thế nào?](#question-11)
12. [Snapshot hay event replay?](#question-12)
13. [Vì sao chat cần sequence number?](#question-13)
14. [Test reconnect behaviour thế nào?](#question-14)
15. [Log gì cho socket lifecycle?](#question-15)

<a id="question-1"></a>

## 1. Thêm client-to-server at-least-once thế nào?

**Câu trả lời mẫu:** **Conclusion:** cấu hình ack timeout/retry và làm handler idempotent. **Mechanism:** client resend tới khi ack. **Trade-off:** browser refresh vẫn mất pending event. **GameStream:** chat dùng `clientMessageId`, game dùng `commandId`.

<a id="question-2"></a>

## 2. Vì sao retry bắt buộc idempotency?

**Câu trả lời mẫu:** **Conclusion:** ack có thể mất sau khi server commit effect. **Mechanism:** retry mang cùng unique ID và trả stored result. **Trade-off:** receipt cần retention. **GameStream:** Mongo receipt/chat uniqueness suppress duplicate.

<a id="question-3"></a>

## 3. Connection-state recovery là gì?

**Câu trả lời mẫu:** **Conclusion:** Socket.IO có thể restore session room/data và missed packet sau disconnect ngắn. **Mechanism:** trao đổi private session ID/offset. **Trade-off:** không guarantee và adapter support khác nhau. **GameStream:** luôn có snapshot fallback.

<a id="question-4"></a>

## 4. Vì sao Redis Pub/Sub không đủ packet recovery?

**Câu trả lời mẫu:** **Conclusion:** Pub/Sub không retain cho disconnected consumer. **Mechanism:** at-most-once live delivery. **Trade-off:** đơn giản/nhanh cho active fan-out. **GameStream:** dùng Streams hoặc Mongo event khi cần replay.

<a id="question-5"></a>

## 5. Redis Streams cải thiện recovery thế nào?

**Câu trả lời mẫu:** **Conclusion:** retained event ID cho reconnect client đọc missed data. **Mechanism:** append bounded room event và resume theo offset/version. **Trade-off:** trim có thể xoá dữ liệu cần. **GameStream:** fallback room snapshot ngoài Stream window.

<a id="question-6"></a>

## 6. Nhiều Socket.IO instance broadcast chung thế nào?

**Câu trả lời mẫu:** **Conclusion:** shared adapter để broadcast tới socket trên mọi instance. **Mechanism:** adapter truyền inter-node packet qua Redis/backend khác. **Trade-off:** adapter semantics quyết định recovery/failure. **GameStream:** chọn Streams-compatible design nếu cần recovery.

<a id="question-7"></a>

## 7. Xử lý slow socket client thế nào?

**Câu trả lời mẫu:** **Conclusion:** bound queued data, coalesce replaceable state update, disconnect client quá chậm. **Mechanism:** backpressure/buffer cho biết lag. **Trade-off:** disconnect hy sinh continuity để bảo vệ server. **GameStream:** gửi latest snapshot/version thay intermediate UI update cũ.

<a id="question-8"></a>

## 8. Presence xử lý nhiều tab thế nào?

**Câu trả lời mẫu:** **Conclusion:** presence theo connection; user online là union active connection. **Mechanism:** TTL key per user/socket và remove khi disconnect. **Trade-off:** abrupt loss chỉ resolve sau TTL. **GameStream:** count distinct user ID, không count socket.

<a id="question-9"></a>

## 9. JWT expire trong connection thì sao?

**Câu trả lời mẫu:** **Conclusion:** chọn disconnect/re-authenticate lúc expiry hoặc short lease và reauthorise sensitive action. **Mechanism:** schedule expiry/per-event validation. **Trade-off:** per-event check tốn hơn. **GameStream:** admin socket fail closed và reconnect bằng token mới.

<a id="question-10"></a>

## 10. Realtime contract evolve thế nào?

**Câu trả lời mẫu:** **Conclusion:** stable event name/envelope, additive compatible payload; breaking event phải version. **Mechanism:** client ignore documented optional field nhưng reject incompatible version. **Trade-off:** old client cần support window. **GameStream:** share Zod/TypeScript contract.

<a id="question-11"></a>

## 11. Detect missed-event gap thế nào?

**Câu trả lời mẫu:** **Conclusion:** compare incoming aggregate version với last applied. **Mechanism:** ignore duplicate/old; jump thì resume. **Trade-off:** sequence độc lập cần cursor độc lập. **GameStream:** room version cho state, chat sequence cho message.

<a id="question-12"></a>

## 12. Snapshot hay event replay?

**Câu trả lời mẫu:** **Conclusion:** replay gap nhỏ liên tục; snapshot cho first load, gap dài hoặc history không chắc. **Mechanism:** snapshot thiết lập state/version; event advance. **Trade-off:** snapshot tốn bandwidth, replay tốn processing/history. **GameStream:** cap replay 200 event.

<a id="question-13"></a>

## 13. Vì sao chat cần sequence number?

**Câu trả lời mẫu:** **Conclusion:** cho room-local order/gap detection độc lập wall clock. **Mechanism:** Mongo atomically increment `chatSequence`. **Trade-off:** room counter có thể hot. **GameStream:** reconnect chat request sau last sequence.

<a id="question-14"></a>

## 14. Test reconnect behaviour thế nào?

**Câu trả lời mẫu:** **Conclusion:** inject transport loss tại boundary và assert duplicate, gap, auth, final state. **Mechanism:** close Engine.IO, delay broadcast, restart server. **Trade-off:** cần deterministic network/clock. **GameStream:** bot/browser test short recovery và snapshot fallback.

<a id="question-15"></a>

## 15. Log gì cho socket lifecycle?

**Câu trả lời mẫu:** **Conclusion:** correlation, user, namespace, connect/disconnect reason, recovery result, room change; không token. **Mechanism:** structured log nối connection với command. **Trade-off:** per-packet log quá noisy. **GameStream:** metric aggregate count, sampled log diagnose session.

## Bảng thuật ngữ kỹ thuật

| Technical term                 | Nghĩa tiếng Việt                | Giải thích đơn giản                                                                   |
| ------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------- |
| Client-to-server at-least-once | Gửi từ client ít nhất một lần   | Client retry event cho tới khi nhận acknowledgement nên server có thể thấy duplicate. |
| Retry                          | Thử lại                         | Gửi lại operation sau lỗi tạm thời.                                                   |
| Idempotency                    | Tính lũy đẳng                   | Duplicate request không tạo duplicate business effect.                                |
| Connection-state recovery      | Phục hồi trạng thái kết nối     | Khôi phục socket state và packet bị bỏ lỡ trong cửa sổ hỗ trợ.                        |
| Packet recovery                | Khôi phục gói tin               | Gửi lại event client bỏ lỡ khi mất kết nối ngắn.                                      |
| Redis Pub/Sub                  | Xuất bản và đăng ký Redis       | Fan-out nhanh nhưng không giữ message cho subscriber offline.                         |
| Redis Streams                  | Luồng Redis                     | Log có thể đọc lại để hỗ trợ bounded recovery.                                        |
| Multi-instance broadcast       | Phát sự kiện qua nhiều instance | Chia sẻ event để socket ở các gateway khác nhau cùng nhận.                            |
| Slow consumer                  | Consumer xử lý chậm             | Client hoặc connection không đọc event kịp tốc độ server gửi.                         |
| Presence                       | Trạng thái hiện diện            | Mô hình user online qua một hoặc nhiều connection/tab.                                |
| Token expiry                   | Token hết hạn                   | Credential không còn hợp lệ trong khi connection vẫn mở.                              |
| Contract evolution             | Tiến hóa hợp đồng               | Thay đổi event name hoặc payload có kiểm soát.                                        |
| Sequence gap                   | Khoảng trống số thứ tự          | Dấu hiệu client đã bỏ lỡ một hoặc nhiều event.                                        |
| Snapshot                       | Ảnh chụp trạng thái             | Toàn bộ state hiện tại dùng làm mốc phục hồi.                                         |
| Event replay                   | Phát lại sự kiện                | Gửi lại event theo thứ tự để client bắt kịp.                                          |
