# Senior — Câu hỏi phỏng vấn LiveKit và WebRTC

## Mục lục câu hỏi

1. [Scale SFU thế nào?](#question-1)
2. [Chọn region thế nào?](#question-2)
3. [Capacity-plan bandwidth thế nào?](#question-3)
4. [Capacity-plan TURN thế nào?](#question-4)
5. [Media security boundary nào quan trọng?](#question-5)
6. [Làm media failure độc lập thế nào?](#question-6)
7. [Định nghĩa media SLO thế nào?](#question-7)
8. [SFU node fail thì sao?](#question-8)
9. [Kiểm soát media cost thế nào?](#question-9)
10. [Thiết kế recording thế nào?](#question-10)
11. [Điều tra “connected nhưng không video” thế nào?](#question-11)
12. [Schema/version change ảnh hưởng media client thế nào?](#question-12)
13. [Ngăn livestream abuse thế nào?](#question-13)
14. [Managed hay self-host media?](#question-14)
15. [LiveKit có là microservice không?](#question-15)

<a id="question-1"></a>

## 1. Scale SFU thế nào?

**Câu trả lời mẫu:** **Conclusion:** phân phối room qua media node/region, giữ participant của room trên routing path tương thích. **Mechanism:** placement/load metric chọn node. **Trade-off:** cross-node/region media tăng bandwidth/latency. **GameStream:** scale theo publisher/subscriber/bitrate, không API request.

<a id="question-2"></a>

## 2. Chọn region thế nào?

**Câu trả lời mẫu:** **Conclusion:** giảm participant latency/loss, xét geography và capacity. **Mechanism:** geo-routing chọn trước room placement. **Trade-off:** room global không có region hoàn hảo. **GameStream:** owner location có thể chi phối one-to-many placement.

<a id="question-3"></a>

## 3. Capacity-plan bandwidth thế nào?

**Câu trả lời mẫu:** **Conclusion:** tính publisher ingress cộng per-subscriber layer, overhead, TURN relay, headroom. **Mechanism:** fan-out nhân egress. **Trade-off:** resolution/frame rate tăng cost nhanh. **GameStream:** room cap bound viewer nhưng vẫn phải đo bitrate.

<a id="question-4"></a>

## 4. Capacity-plan TURN thế nào?

**Câu trả lời mẫu:** **Conclusion:** estimate relay percentage, bidirectional bitrate, regional peak, redundancy. **Mechanism:** TURN mang toàn media cho relayed participant. **Trade-off:** thiếu capacity block network chặt, dư tốn. **GameStream:** đo actual relay ratio trước sizing.

<a id="question-5"></a>

## 5. Media security boundary nào quan trọng?

**Câu trả lời mẫu:** **Conclusion:** bảo vệ signing secret, least-privilege short grant, validate room, secure signalling/TURN, define recording/E2EE. **Mechanism:** media permission tách app auth. **Trade-off:** privacy mạnh hạn chế moderation/recording. **GameStream:** API secret chỉ ở backend.

<a id="question-6"></a>

## 6. Làm media failure độc lập thế nào?

**Câu trả lời mẫu:** **Conclusion:** game transaction không chờ SFU, media event không mutate score. **Mechanism:** token, connection, health, UI state riêng. **Trade-off:** user chơi không video. **GameStream:** tốt hơn biến optional livestream thành dependency core.

<a id="question-7"></a>

## 7. Định nghĩa media SLO thế nào?

**Câu trả lời mẫu:** **Conclusion:** join success/time, time-to-first-frame/audio, reconnect, freeze, packet loss, usable session. **Mechanism:** đo client experience theo cohort. **Trade-off:** server uptime không đủ. **GameStream:** Watch-to-first-frame là critical journey.

<a id="question-8"></a>

## 8. SFU node fail thì sao?

**Câu trả lời mẫu:** **Conclusion:** participant mất media session và rejoin healthy capacity; room state ở nơi khác. **Mechanism:** detect failure, client retry với token. **Trade-off:** migration không giữ track seamless. **GameStream:** UI media reconnecting, game/chat tiếp tục.

<a id="question-9"></a>

## 9. Kiểm soát media cost thế nào?

**Câu trả lời mẫu:** **Conclusion:** cap resolution/frame rate, simulcast/adaptive, unsubscribe invisible track, limit room duration/size. **Mechanism:** chỉ forward layer cần. **Trade-off:** giảm cost có thể giảm quality. **GameStream:** chỉ owner publish đơn giản hơn everyone publish.

<a id="question-10"></a>

## 10. Thiết kế recording thế nào?

**Câu trả lời mẫu:** **Conclusion:** recording là privileged workflow riêng có consent, retention, encryption, audit. **Mechanism:** egress service ghi durable storage. **Trade-off:** mở rộng privacy/compliance. **GameStream:** livestream không mặc nhiên recording; ngoài MVP nếu chưa approve.

<a id="question-11"></a>

## 11. Điều tra “connected nhưng không video” thế nào?

**Câu trả lời mẫu:** **Conclusion:** trace publication, subscription, mute, permission, codec, ICE, packet, render riêng. **Mechanism:** so SDK state với WebRTC stats/server log. **Trade-off:** green signalling không chứng minh media. **GameStream:** verify owner publish rồi subscriber bytes.

<a id="question-12"></a>

## 12. Schema/version change ảnh hưởng media client thế nào?

**Câu trả lời mẫu:** **Conclusion:** coordinate SDK/server compatibility và version app metadata riêng. **Mechanism:** rolling upgrade cần tested matrix. **Trade-off:** old browser/SDK kéo support cost. **GameStream:** pin server/client version và test.

<a id="question-13"></a>

## 13. Ngăn livestream abuse thế nào?

**Câu trả lời mẫu:** **Conclusion:** owner grant, rate limit, room cap, report/moderation, revoke nhanh. **Mechanism:** server API remove/mute, token expire. **Trade-off:** moderation thêm legal/ops. **GameStream:** không tin client `publish` flag.

<a id="question-14"></a>

## 14. Managed hay self-host media?

**Câu trả lời mẫu:** **Conclusion:** so expertise, global edge/TURN, compliance, cost, control. **Mechanism:** managed hấp thụ SFU/network ops; self-host tự chịu. **Trade-off:** vendor cost/dependence so với on-call burden. **GameStream:** local self-host tốt để học, không tự động là production choice.

<a id="question-15"></a>

## 15. LiveKit có là microservice không?

**Câu trả lời mẫu:** **Conclusion:** là specialised media service/deployment riêng; business backend vẫn modular monolith. **Mechanism:** boundary qua signed token, signalling, media protocol. **Trade-off:** networking thêm nhưng isolate workload khác biệt. **GameStream:** evidence-based separation, không phải fashion.

## Bảng thuật ngữ kỹ thuật

| Technical term          | Nghĩa tiếng Việt           | Giải thích đơn giản                                                      |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------ |
| SFU scaling             | Mở rộng SFU                | Phân phối room và participant qua nhiều media node.                      |
| Region affinity         | Ưu tiên vùng địa lý        | Chọn region gần participant hoặc owner để giảm latency.                  |
| Bandwidth capacity      | Năng lực băng thông        | Tổng ingress/egress cần cho số track và subscriber.                      |
| TURN capacity           | Năng lực TURN              | Bandwidth và connection cần khi media phải relay.                        |
| Media security boundary | Ranh giới bảo mật media    | Phạm vi secret, token grant, signalling và encrypted media.              |
| Failure isolation       | Cô lập lỗi                 | Media lỗi không được làm hỏng game hoặc chat state.                      |
| Media SLO               | Mục tiêu mức dịch vụ media | Target cho join success, reconnect, packet loss hoặc quality.            |
| Node failure            | Sự cố node                 | Media server dừng và participant phải reconnect hoặc migrate.            |
| Media egress            | Lưu lượng media đi ra      | Bandwidth SFU gửi tới subscriber và thường quyết định chi phí.           |
| Recording pipeline      | Luồng ghi hình             | Capture, encode, lưu trữ và quản lý recording.                           |
| WebRTC stats            | Thống kê WebRTC            | Số liệu connection, candidate, codec, bitrate, loss và jitter.           |
| Client compatibility    | Tương thích client         | Khả năng client version khác nhau hoạt động với protocol và server.      |
| Abuse prevention        | Ngăn lạm dụng              | Giới hạn quyền, thời lượng, bitrate và hành vi phát media.               |
| Managed service         | Dịch vụ được quản lý       | Nhà cung cấp chịu phần lớn vận hành media infrastructure.                |
| Self-hosted             | Tự vận hành                | Team tự triển khai, bảo mật, scale và xử lý incident của media platform. |
