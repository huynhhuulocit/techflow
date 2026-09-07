# Middle — Câu hỏi phỏng vấn LiveKit và WebRTC

## Mục lục câu hỏi

1. [SFU khác mesh thế nào?](#question-1)
2. [ICE candidate selection hoạt động thế nào?](#question-2)
3. [Simulcast và adaptive stream là gì?](#question-3)
4. [Authorise media grant thế nào?](#question-4)
5. [End-to-end encryption trong SFU là gì?](#question-5)
6. [Map track lifecycle vào UI thế nào?](#question-6)
7. [Đổi device thế nào?](#question-7)
8. [LiveKit webhook cung cấp gì?](#question-8)
9. [Xử lý reconnect thế nào?](#question-9)
10. [Đánh giá network quality thế nào?](#question-10)
11. [Production networking cần gì?](#question-11)
12. [Monitor media service thế nào?](#question-12)
13. [Test camera hai thiết bị thế nào?](#question-13)
14. [Ngăn non-owner publish thế nào?](#question-14)
15. [Media unavailable thì sao?](#question-15)

<a id="question-1"></a>

## 1. SFU khác mesh thế nào?

**Câu trả lời mẫu:** **Conclusion:** mesh gửi một stream cho mỗi peer; SFU nhận một upload và forward. **Mechanism:** SFU centralise bandwidth routing. **Trade-off:** tốn server nhưng scale group tốt. **GameStream:** one-to-many owner stream hợp SFU.

<a id="question-2"></a>

## 2. ICE candidate selection hoạt động thế nào?

**Câu trả lời mẫu:** **Conclusion:** ICE gather host, server-reflexive, relay candidate và check pair. **Mechanism:** connectivity check nominate working path. **Trade-off:** NAT/firewall chặt buộc TURN. **GameStream:** LAN host candidate chỉ work khi route/firewall cho phép.

<a id="question-3"></a>

## 3. Simulcast và adaptive stream là gì?

**Câu trả lời mẫu:** **Conclusion:** simulcast publish nhiều quality layer; adaptive subscription chọn layer theo display/network. **Mechanism:** SFU forward encoding phù hợp. **Trade-off:** publisher CPU/uplink tăng. **GameStream:** phone nhận layer thấp hơn desktop.

<a id="question-4"></a>

## 4. Authorise media grant thế nào?

**Câu trả lời mẫu:** **Conclusion:** derive grant từ current membership/role trên server. **Mechanism:** verify game JWT, query room, mint short room-scoped grant. **Trade-off:** revocation không ngay lập tức. **GameStream:** chỉ owner nhận `canPublish=true`.

<a id="question-5"></a>

## 5. End-to-end encryption trong SFU là gì?

**Câu trả lời mẫu:** **Conclusion:** transport encryption bảo vệ hop; true E2EE còn ngăn SFU đọc payload. **Mechanism:** client transform frame bằng shared key. **Trade-off:** recording/moderation/key management khó hơn. **GameStream:** định nghĩa privacy trước khi claim E2EE.

<a id="question-6"></a>

## 6. Map track lifecycle vào UI thế nào?

**Câu trả lời mẫu:** **Conclusion:** tách participant connected, publication, subscribed, muted, receiving. **Mechanism:** SDK event drive state. **Trade-off:** một boolean “live” che failure. **GameStream:** show connecting/live/muted/reconnecting/unavailable.

<a id="question-7"></a>

## 7. Đổi device thế nào?

**Câu trả lời mẫu:** **Conclusion:** enumerate permitted device và replace/restart local track không rời room. **Mechanism:** SDK switch media source. **Trade-off:** permission/device ID khác browser. **GameStream:** owner đổi camera, member vẫn subscribe.

<a id="question-8"></a>

## 8. LiveKit webhook cung cấp gì?

**Câu trả lời mẫu:** **Conclusion:** notify backend về room/participant/track lifecycle. **Mechanism:** verify signature, process idempotent. **Trade-off:** retry và có thể tới sau UI event. **GameStream:** dùng audit/analytics, không authoritative game transition.

<a id="question-9"></a>

## 9. Xử lý reconnect thế nào?

**Câu trả lời mẫu:** **Conclusion:** expose state, để LiveKit retry, refresh credential khi cần. **Mechanism:** interruption tạm có thể recover không rebuild app state. **Trade-off:** outage dài cần rejoin. **GameStream:** game membership persist độc lập.

<a id="question-10"></a>

## 10. Đánh giá network quality thế nào?

**Câu trả lời mẫu:** **Conclusion:** xem RTT, packet loss, jitter, bitrate và quality limitation reason. **Mechanism:** WebRTC stats/LiveKit event surface signal. **Trade-off:** một score che direction/track. **GameStream:** giảm video layer trước audio.

<a id="question-11"></a>

## 11. Production networking cần gì?

**Câu trả lời mẫu:** **Conclusion:** trusted TLS signalling, reachable UDP, TCP fallback và TURN. **Mechanism:** DNS/cert/advertised address khớp route public. **Trade-off:** publish container port chưa đủ sau NAT. **GameStream:** LAN `nodeIP` chỉ cho development.

<a id="question-12"></a>

## 12. Monitor media service thế nào?

**Câu trả lời mẫu:** **Conclusion:** connection success/time, participant, track, loss, RTT, bitrate, reconnect, TURN use, CPU/bandwidth. **Mechanism:** kết hợp server/client telemetry. **Trade-off:** metric volume cao. **GameStream:** aggregate theo region/device, không user.

<a id="question-13"></a>

## 13. Test camera hai thiết bị thế nào?

**Câu trả lời mẫu:** **Conclusion:** trusted HTTPS cả hai, user riêng, owner publish/member subscribe, test permission/network loss. **Mechanism:** verify signalling và UDP/TCP riêng. **Trade-off:** localhost test bỏ sót NAT/firewall. **GameStream:** LAN runbook song ngữ ghi port/CA trust.

<a id="question-14"></a>

## 14. Ngăn non-owner publish thế nào?

**Câu trả lời mẫu:** **Conclusion:** enforce bằng server-issued grant, không chỉ hide button. **Mechanism:** backend check owner và sign subscribe-only token. **Trade-off:** owner change cần grant mới. **GameStream:** request `publish:true` được validate ownership.

<a id="question-15"></a>

## 15. Media unavailable thì sao?

**Câu trả lời mẫu:** **Conclusion:** degrade về game/chat với status/retry rõ. **Mechanism:** media có health boundary/timeout riêng. **Trade-off:** giảm feature nhưng core sống. **GameStream:** đây là architecture invariant.

## Bảng thuật ngữ kỹ thuật

| Technical term        | Nghĩa tiếng Việt         | Giải thích đơn giản                                                    |
| --------------------- | ------------------------ | ---------------------------------------------------------------------- |
| Mesh topology         | Mô hình kết nối lưới     | Mỗi participant gửi media trực tiếp tới các participant khác.          |
| ICE candidate         | Ứng viên kết nối ICE     | Một địa chỉ và transport có thể dùng để thiết lập đường media.         |
| Candidate pair        | Cặp ứng viên             | Cặp local/remote candidate được kiểm tra để chọn đường kết nối.        |
| Simulcast             | Phát đồng thời nhiều lớp | Publisher gửi nhiều mức chất lượng của cùng video.                     |
| Adaptive stream       | Luồng thích ứng          | Subscriber nhận chất lượng phù hợp với network và kích thước hiển thị. |
| Media grant           | Quyền media              | Quyền join, publish, subscribe hoặc publish data trong token.          |
| End-to-end encryption | Mã hóa đầu cuối          | Media chỉ được giải mã ở participant endpoint, không ở SFU.            |
| Track lifecycle       | Vòng đời track           | Các trạng thái publish, subscribe, mute, unpublish và disconnect.      |
| Device switching      | Chuyển thiết bị          | Đổi camera hoặc microphone trong một media session.                    |
| LiveKit webhook       | Webhook LiveKit          | Callback server-to-server báo participant, room hoặc track event.      |
| Network quality       | Chất lượng mạng          | Đánh giá RTT, packet loss, jitter và bandwidth.                        |
| NAT traversal         | Vượt qua NAT             | Cơ chế thiết lập đường media qua router và firewall.                   |
| Media observability   | Khả năng quan sát media  | Theo dõi bitrate, loss, jitter, reconnect và quality.                  |
| Publish authorisation | Ủy quyền phát media      | Chỉ participant có grant phù hợp được publish.                         |
| Graceful degradation  | Suy giảm có kiểm soát    | Giảm video trước nhưng giữ chức năng cốt lõi như audio hoặc game.      |
