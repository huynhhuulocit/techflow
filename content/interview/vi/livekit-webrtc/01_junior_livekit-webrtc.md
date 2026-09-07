# Junior — Câu hỏi phỏng vấn LiveKit và WebRTC

## Mục lục câu hỏi

1. [WebRTC là gì?](#question-1)
2. [LiveKit là gì?](#question-2)
3. [Room, participant, track là gì?](#question-3)
4. [SFU là gì?](#question-4)
5. [Publisher khác subscriber thế nào?](#question-5)
6. [Signalling là gì?](#question-6)
7. [ICE, STUN, TURN là gì?](#question-7)
8. [Vì sao camera browser cần HTTPS?](#question-8)
9. [LiveKit access token là gì?](#question-9)
10. [Vì sao tách game JWT và LiveKit token?](#question-10)
11. [Media packet có qua Nest backend không?](#question-11)
12. [Muting làm gì?](#question-12)
13. [Cần browser permission gì?](#question-13)
14. [Port nào quan trọng trong LAN mode?](#question-14)
15. [Livestream disconnect thì sao?](#question-15)

<a id="question-1"></a>

## 1. WebRTC là gì?

**Câu trả lời mẫu:** **Conclusion:** WebRTC là tập browser/native API và protocol cho realtime audio/video/data. **Mechanism:** peer negotiate encrypted media path bằng ICE và secure RTP. **Trade-off:** NAT traversal/media quality phức tạp. **GameStream:** owner camera/microphone dùng WebRTC.

<a id="question-2"></a>

## 2. LiveKit là gì?

**Câu trả lời mẫu:** **Conclusion:** LiveKit là realtime media platform open-source xây trên WebRTC. **Mechanism:** server quản lý room, participant, track và SFU. **Trade-off:** thêm media infrastructure nhưng bỏ nhiều custom signalling/routing. **GameStream:** backend cấp token, web publish/subscribe.

<a id="question-3"></a>

## 3. Room, participant, track là gì?

**Câu trả lời mẫu:** **Conclusion:** room là không gian, participant tham gia, track là audio/video/data được publish/subscribe. **Mechanism:** publication metadata tách media subscription. **Trade-off:** application room membership phải map cẩn thận. **GameStream:** game room ID cũng là LiveKit room name.

<a id="question-4"></a>

## 4. SFU là gì?

**Câu trả lời mẫu:** **Conclusion:** SFU nhận encoded track và forward selected layer tới subscriber. **Mechanism:** khác MCU, thường không compose video. **Trade-off:** server dùng nhiều bandwidth. **GameStream:** một owner upload được forward tới member.

<a id="question-5"></a>

## 5. Publisher khác subscriber thế nào?

**Câu trả lời mẫu:** **Conclusion:** publisher gửi track, subscriber nhận. **Mechanism:** token grant/client setting kiểm soát. **Trade-off:** subscription thừa tốn bandwidth. **GameStream:** chỉ owner publish camera/mic; member watch.

<a id="question-6"></a>

## 6. Signalling là gì?

**Câu trả lời mẫu:** **Conclusion:** signalling trao đổi metadata để thiết lập media connection. **Mechanism:** offer, answer, ICE candidate và room state qua secure control channel. **Trade-off:** signalling success không chứng minh media connected. **GameStream:** Nginx proxy LiveKit signalling qua WSS.

<a id="question-7"></a>

## 7. ICE, STUN, TURN là gì?

**Câu trả lời mẫu:** **Conclusion:** ICE tìm path; STUN cho biết public-facing address; TURN relay khi direct fail. **Mechanism:** candidate pair được connectivity-check. **Trade-off:** TURN tăng reachability nhưng tốn bandwidth. **GameStream:** LAN có thể direct; internet production cần TURN.

<a id="question-8"></a>

## 8. Vì sao camera browser cần HTTPS?

**Câu trả lời mẫu:** **Conclusion:** `getUserMedia` chỉ hoạt động trong secure context trừ localhost đặc biệt. **Mechanism:** browser cần trusted HTTPS và permission. **Trade-off:** LAN local cần trusted dev CA. **GameStream:** Nginx LAN gateway serve `https://<LAN-IP>:5443`.

<a id="question-9"></a>

## 9. LiveKit access token là gì?

**Câu trả lời mẫu:** **Conclusion:** signed short-lived JWT chứa identity, room và media grant. **Mechanism:** trusted backend sign bằng LiveKit API secret. **Trade-off:** grant rộng/lâu tăng abuse. **GameStream:** client không nhận API secret.

<a id="question-10"></a>

## 10. Vì sao tách game JWT và LiveKit token?

**Câu trả lời mẫu:** **Conclusion:** chúng target service/privilege khác nhau. **Mechanism:** backend authenticate user rồi mint narrow media token. **Trade-off:** thêm token endpoint. **GameStream:** game auth chứng minh identity; LiveKit grant publish/subscribe một room.

<a id="question-11"></a>

## 11. Media packet có qua Nest backend không?

**Câu trả lời mẫu:** **Conclusion:** không; API authorise, LiveKit transport media. **Mechanism:** client connect trực tiếp SFU. **Trade-off:** cần networking/monitoring riêng. **GameStream:** LiveKit TCP/UDP port tách HTTP command.

<a id="question-12"></a>

## 12. Muting làm gì?

**Câu trả lời mẫu:** **Conclusion:** mute dừng/disable media contribution trong khi participant vẫn connected. **Mechanism:** SDK disable local track hoặc server manage publication. **Trade-off:** mute state khác track availability. **GameStream:** stop live unpublish/disable track mà không end game.

<a id="question-13"></a>

## 13. Cần browser permission gì?

**Câu trả lời mẫu:** **Conclusion:** camera/mic permission cho exact secure origin. **Mechanism:** `getUserMedia` prompt và trả device track. **Trade-off:** denial phải có recoverable UI. **GameStream:** game/chat tiếp tục khi media permission fail.

<a id="question-14"></a>

## 14. Port nào quan trọng trong LAN mode?

**Câu trả lời mẫu:** **Conclusion:** TCP 5443 cho HTTPS/WSS, TCP 7881 ICE fallback, UDP 50000–50020 media. **Mechanism:** signalling/media theo path khác. **Trade-off:** firewall chỉ mở trusted private network. **GameStream:** setup script document boundary này.

<a id="question-15"></a>

## 15. Livestream disconnect thì sao?

**Câu trả lời mẫu:** **Conclusion:** media reconnect độc lập và không được corrupt game/chat. **Mechanism:** LiveKit quản lý participant/track reconnect, app state ở nơi khác. **Trade-off:** UI phải show degraded media. **GameStream:** Mongo/Socket.IO gameplay vẫn hoạt động.

## Bảng thuật ngữ kỹ thuật

| Technical term     | Nghĩa tiếng Việt                  | Giải thích đơn giản                                                  |
| ------------------ | --------------------------------- | -------------------------------------------------------------------- |
| WebRTC             | Giao tiếp thời gian thực trên web | Stack truyền audio, video và data độ trễ thấp.                       |
| LiveKit            | Nền tảng LiveKit                  | Platform quản lý room, participant, track và SFU trên WebRTC.        |
| Room               | Phòng media                       | Không gian logic nơi participant publish và subscribe track.         |
| Participant        | Người tham gia                    | Client hoặc identity đang kết nối vào room.                          |
| Track              | Luồng media                       | Một nguồn audio, video hoặc data được publish.                       |
| SFU                | Đơn vị chuyển tiếp chọn lọc       | Server nhận track và chuyển tiếp tới subscriber mà không trộn media. |
| Publisher          | Bên phát                          | Participant gửi track lên room.                                      |
| Subscriber         | Bên nhận                          | Participant nhận track đã publish.                                   |
| Signalling         | Trao đổi tín hiệu                 | Trao đổi metadata để thiết lập và điều khiển WebRTC connection.      |
| ICE                | Thiết lập kết nối tương tác       | Quy trình tìm đường network phù hợp giữa các endpoint.               |
| STUN               | Tiện ích dò địa chỉ NAT           | Giúp client biết public address và kiểu NAT.                         |
| TURN               | Máy chủ chuyển tiếp media         | Relay traffic khi không thể kết nối trực tiếp.                       |
| Media token        | Token truy cập media              | Credential ngắn hạn chứa room và publish/subscribe grant.            |
| Browser permission | Quyền trình duyệt                 | Sự cho phép truy cập camera và microphone.                           |
| Media reconnect    | Tái kết nối media                 | Khôi phục participant hoặc track khi network gián đoạn.              |
