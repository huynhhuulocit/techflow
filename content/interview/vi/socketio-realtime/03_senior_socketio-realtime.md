# Senior — Câu hỏi phỏng vấn Socket.IO và realtime

## Mục lục câu hỏi

1. [Scale hàng triệu socket thế nào?](#question-1)
2. [Sticky session có bắt buộc không?](#question-2)
3. [Đặc tả end-to-end realtime guarantee thế nào?](#question-3)
4. [Sống qua adapter outage thế nào?](#question-4)
5. [Ngăn reconnect storm thế nào?](#question-5)
6. [Authorisation phản ứng membership change thế nào?](#question-6)
7. [Capacity-plan realtime infrastructure thế nào?](#question-7)
8. [Chẩn đoán realtime latency tăng thế nào?](#question-8)
9. [Xử lý oversized fan-out thế nào?](#question-9)
10. [Zero-downtime deploy cho socket thế nào?](#question-10)
11. [Hai backend instance có emit room version sai order không?](#question-11)
12. [Có nên buffer emission của disconnected client?](#question-12)
13. [Socket.IO khác Server-Sent Events thế nào?](#question-13)
14. [Khi nào realtime thành service riêng?](#question-14)
15. [SLI nào quan trọng nhất?](#question-15)

<a id="question-1"></a>

## 1. Scale hàng triệu socket thế nào?

**Câu trả lời mẫu:** **Conclusion:** partition connection ownership qua gateway instance/region, tối thiểu per-connection state và externalise coordination cần thiết. **Mechanism:** load balancer, adapter, room affinity phân phối socket. **Trade-off:** global fan-out/recovery đắt. **GameStream:** scale theo active connection/room độc lập command throughput khi có evidence.

<a id="question-2"></a>

## 2. Sticky session có bắt buộc không?

**Câu trả lời mẫu:** **Conclusion:** có thể cần khi long-polling qua nhiều request; pure WebSocket giảm nhu cầu nhưng adapter/recovery vẫn quan trọng. **Mechanism:** session phải đến node giữ transport state. **Trade-off:** stickiness làm load lệch. **GameStream:** document transport/load-balancer contract trước scale.

<a id="question-3"></a>

## 3. Đặc tả end-to-end realtime guarantee thế nào?

**Câu trả lời mẫu:** **Conclusion:** tách ordering, arrival, durability, duplication, max recovery window và authoritative repair. **Mechanism:** Socket.IO, Redis, MongoDB cover boundary khác nhau. **Trade-off:** guarantee mạnh tốn storage/latency. **GameStream:** per-room order, effectively-once client apply và snapshot fallback là thực tế.

<a id="question-4"></a>

## 4. Sống qua adapter outage thế nào?

**Câu trả lời mẫu:** **Conclusion:** local socket có thể còn nhưng cross-node fan-out degrade; surface health và recover sau. **Mechanism:** circuit breaker/version resync repair missed packet. **Trade-off:** force reconnect tạo storm. **GameStream:** commit vẫn ở MongoDB, realtime degraded.

<a id="question-5"></a>

## 5. Ngăn reconnect storm thế nào?

**Câu trả lời mẫu:** **Conclusion:** exponential backoff có jitter, admission limit và staged recovery. **Mechanism:** client trải attempt và fetch snapshot bounded. **Trade-off:** user chờ lâu hơn. **GameStream:** deploy/Wi-Fi recovery không được làm mọi client hit Mongo cùng lúc.

<a id="question-6"></a>

## 6. Authorisation phản ứng membership change thế nào?

**Câu trả lời mẫu:** **Conclusion:** connection auth chưa đủ; action đặc quyền cần current membership/role và revocation. **Mechanism:** authoritative event remove socket hoặc per-command check. **Trade-off:** check mỗi event tăng latency. **GameStream:** kicked/cancelled user mất room/LiveKit permission nhanh.

<a id="question-7"></a>

## 7. Capacity-plan realtime infrastructure thế nào?

**Câu trả lời mẫu:** **Conclusion:** model concurrent connection, message/byte rate, fan-out multiplier, reconnect burst, buffer, Redis traffic, per-socket memory. **Mechanism:** load test room distribution thực. **Trade-off:** average che hot-room peak. **GameStream:** bot mô phỏng join/chat/roll/reconnect, không chỉ idle.

<a id="question-8"></a>

## 8. Chẩn đoán realtime latency tăng thế nào?

**Câu trả lời mẫu:** **Conclusion:** tách command commit, Kafka/Redis propagation, gateway event-loop, adapter và client network. **Mechanism:** timestamp tương quan trace roll-to-render. **Trade-off:** clock skew ảnh hưởng cross-host. **GameStream:** dùng event ID/version qua mọi hop.

<a id="question-9"></a>

## 9. Xử lý oversized fan-out thế nào?

**Câu trả lời mẫu:** **Conclusion:** limit room/payload/frequency, coalesce state và region-local fan-out. **Mechanism:** một event nhân thành hàng nghìn write. **Trade-off:** throttle giảm immediacy. **GameStream:** room capacity 20 bound game/chat fan-out.

<a id="question-10"></a>

## 10. Zero-downtime deploy cho socket thế nào?

**Câu trả lời mẫu:** **Conclusion:** drain instance, cho client reconnect jitter, giữ external recovery state và deadline shutdown. **Mechanism:** readiness remove node trước close. **Trade-off:** long-lived socket kéo dài rollout. **GameStream:** resume theo version làm reconnect an toàn.

<a id="question-11"></a>

## 11. Hai backend instance có emit room version sai order không?

**Câu trả lời mẫu:** **Conclusion:** có, cross-node propagation path có thể race dù mỗi connection giữ send order. **Mechanism:** aggregate version giúp client reorder/recover. **Trade-off:** buffering thêm complexity. **GameStream:** ignore stale, gap thì snapshot, không tin arrival time.

<a id="question-12"></a>

## 12. Có nên buffer emission của disconnected client?

**Câu trả lời mẫu:** **Conclusion:** chỉ retry command idempotent/bounded; volatile action có thể invalid lúc reconnect. **Mechanism:** persist ID và expected version. **Trade-off:** queued command tạo nhiều conflict. **GameStream:** chat retry được; stale roll bị current turn/version reject.

<a id="question-13"></a>

## 13. Socket.IO khác Server-Sent Events thế nào?

**Câu trả lời mẫu:** **Conclusion:** SSE đơn giản one-way server-to-client; Socket.IO bidirectional, ack, room. **Mechanism:** với SSE, client command qua HTTP riêng. **Trade-off:** Socket.IO nặng hơn. **GameStream:** bidirectional chat/realtime justify Socket.IO.

<a id="question-14"></a>

## 14. Khi nào realtime thành service riêng?

**Câu trả lời mẫu:** **Conclusion:** extract khi connection scaling/failure/ownership độc lập rõ và contract ổn định. **Mechanism:** consume room event, gọi authoritative membership API. **Trade-off:** distributed auth/delivery tăng complexity. **GameStream:** giữ gateway trong modular backend tới khi metric justify.

<a id="question-15"></a>

## 15. SLI nào quan trọng nhất?

**Câu trả lời mẫu:** **Conclusion:** connection success, unexpected disconnect, recovery success, delivery latency, gap/full-snapshot rate, dropped/coalesced message. **Mechanism:** đo theo namespace/client version, không user ID. **Trade-off:** synthetic socket không thay real-user data. **GameStream:** nối realtime SLO với roll/chat journey.

## Bảng thuật ngữ kỹ thuật

| Technical term          | Nghĩa tiếng Việt           | Giải thích đơn giản                                                          |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| Connection capacity     | Năng lực kết nối           | Số socket hệ thống phục vụ với memory, CPU và network hiện có.               |
| Sticky session          | Phiên bám máy chủ          | Load balancer tiếp tục chuyển cùng client tới cùng instance.                 |
| End-to-end guarantee    | Bảo đảm xuyên suốt         | Guarantee từ lúc event được tạo tới lúc client áp dụng vào state.            |
| Adapter outage          | Sự cố bộ điều hợp          | Shared broadcast adapter lỗi trong khi gateway vẫn có connection local.      |
| Reconnect storm         | Bão tái kết nối            | Rất nhiều client reconnect đồng thời sau sự cố hoặc deployment.              |
| Dynamic authorisation   | Ủy quyền thay đổi động     | Quyền socket phải phản ánh membership hoặc role mới.                         |
| Fan-out                 | Phát tán một tới nhiều     | Một event được gửi tới số lượng lớn connection.                              |
| Realtime latency        | Độ trễ thời gian thực      | Thời gian từ state change tới khi client nhận và hiển thị.                   |
| Oversized payload       | Payload quá lớn            | Event lớn gây memory, serialization và network pressure.                     |
| Zero-downtime deploy    | Triển khai không gián đoạn | Thay version gateway mà giảm disconnect và mất event.                        |
| Cross-instance ordering | Thứ tự giữa nhiều instance | Event từ nhiều publisher có thể đến khác thứ tự nếu không có sequence chung. |
| Disconnected buffer     | Bộ đệm khi mất kết nối     | Message tạm giữ cho client offline trong giới hạn rõ ràng.                   |
| Server-Sent Events      | Sự kiện do server gửi      | HTTP stream một chiều từ server xuống browser.                               |
| Service extraction      | Tách dịch vụ               | Đưa realtime gateway thành deployment và ownership độc lập.                  |
| SLI                     | Chỉ số mức dịch vụ         | Phép đo như delivery latency, reconnect success hoặc gap rate.               |
