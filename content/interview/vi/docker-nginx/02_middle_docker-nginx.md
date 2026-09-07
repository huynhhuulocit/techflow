# Middle — Câu hỏi phỏng vấn Docker và Nginx

## Mục lục câu hỏi

1. [Build reproducible image thế nào?](#question-1)
2. [Layer cache ảnh hưởng build thế nào?](#question-2)
3. [Vì sao chạy non-root?](#question-3)
4. [Container shutdown thế nào?](#question-4)
5. [Startup, liveness, readiness khác nhau thế nào?](#question-5)
6. [Đưa secret vào container thế nào?](#question-6)
7. [Backup volume thế nào?](#question-7)
8. [Vì sao set resource limit?](#question-8)
9. [Forwarding header nào quan trọng?](#question-9)
10. [Nginx timeout ảnh hưởng realtime thế nào?](#question-10)
11. [CORS và same-origin proxy liên hệ thế nào?](#question-11)
12. [Trust LAN certificate thế nào?](#question-12)
13. [Vì sao validate Compose config?](#question-13)
14. [Production khác local Compose thế nào?](#question-14)
15. [Test gateway gì?](#question-15)

<a id="question-1"></a>

## 1. Build reproducible image thế nào?

**Câu trả lời mẫu:** **Conclusion:** pin base/dependency, lockfile, deterministic input. **Mechanism:** CI build immutable tag. **Trade-off:** pin cần update plan. **GameStream:** production không dùng floating tag.

<a id="question-2"></a>

## 2. Layer cache ảnh hưởng build thế nào?

**Câu trả lời mẫu:** **Conclusion:** copy stable dependency file trước changing source. **Mechanism:** reuse unchanged layer. **Trade-off:** cache sai che stale artifact. **GameStream:** install workspace deps trước source build.

<a id="question-3"></a>

## 3. Vì sao chạy non-root?

**Câu trả lời mẫu:** **Conclusion:** giảm impact khi compromise. **Mechanism:** runtime user ít privilege. **Trade-off:** permission/low port cần setup. **GameStream:** production app stage drop root.

<a id="question-4"></a>

## 4. Container shutdown thế nào?

**Câu trả lời mẫu:** **Conclusion:** PID1 nhận signal và app drain trong deadline. **Mechanism:** exec command/signal handler close resource. **Trade-off:** forced kill là bound cuối. **GameStream:** worker handle SIGTERM.

<a id="question-5"></a>

## 5. Startup, liveness, readiness khác nhau thế nào?

**Câu trả lời mẫu:** **Conclusion:** startup bảo vệ boot chậm, liveness phát hiện stuck, readiness điều khiển traffic. **Mechanism:** remediation khác nhau. **Trade-off:** conflation gây restart loop. **GameStream:** projection health nằm readiness.

<a id="question-6"></a>

## 6. Đưa secret vào container thế nào?

**Câu trả lời mẫu:** **Conclusion:** orchestrator secret/mounted file, không bake image. **Mechanism:** runtime identity lấy scoped credential. **Trade-off:** rotation cần app support. **GameStream:** local `.env` không phải production secret.

<a id="question-7"></a>

## 7. Backup volume thế nào?

**Câu trả lời mẫu:** **Conclusion:** backup database-consistent data, không copy file live mù. **Mechanism:** DB snapshot/tool và restore test. **Trade-off:** app-consistent backup cần coordination. **GameStream:** mỗi stateful service có plan riêng.

<a id="question-8"></a>

## 8. Vì sao set resource limit?

**Câu trả lời mẫu:** **Conclusion:** reserve capacity và bound noisy container. **Mechanism:** orchestrator schedule/throttle/OOM. **Trade-off:** limit thấp gây OOM/latency. **GameStream:** Elasticsearch/media size khác API.

<a id="question-9"></a>

## 9. Forwarding header nào quan trọng?

**Câu trả lời mẫu:** **Conclusion:** host, client chain, original scheme. **Mechanism:** trusted proxy set `X-Forwarded-*`. **Trade-off:** trust client header gây spoof. **GameStream:** cookie/redirect cần forwarded proto đúng.

<a id="question-10"></a>

## 10. Nginx timeout ảnh hưởng realtime thế nào?

**Câu trả lời mẫu:** **Conclusion:** default timeout có thể close healthy long connection. **Mechanism:** set proxy timeout/heartbeat. **Trade-off:** idle connection dài tốn resource. **GameStream:** LAN dùng long timeout.

<a id="question-11"></a>

## 11. CORS và same-origin proxy liên hệ thế nào?

**Câu trả lời mẫu:** **Conclusion:** một proxy origin đơn giản CORS/cookie; direct dev origin cần allowlist. **Mechanism:** gateway route path nội bộ. **Trade-off:** wildcard credential unsafe. **GameStream:** `WEB_ORIGINS` validated allowlist.

<a id="question-12"></a>

## 12. Trust LAN certificate thế nào?

**Câu trả lời mẫu:** **Conclusion:** chỉ install public dev CA, giữ private key kín. **Mechanism:** cert có LAN IP SAN và chain CA. **Trade-off:** CA chỉ development. **GameStream:** không share `lan-key.pem`/root private key.

<a id="question-13"></a>

## 13. Vì sao validate Compose config?

**Câu trả lời mẫu:** **Conclusion:** render merged env/profile để bắt missing var/routing. **Mechanism:** Compose config resolve interpolation. **Trade-off:** không chứng minh runtime reachability. **GameStream:** LAN cần IP/origin/LiveKit URL.

<a id="question-14"></a>

## 14. Production khác local Compose thế nào?

**Câu trả lời mẫu:** **Conclusion:** cần HA, backup, TLS, auth, secrets, observability, limits, rolling deploy. **Mechanism:** managed service/orchestrator cung cấp. **Trade-off:** local convenience yếu hơn có chủ ý. **GameStream:** one-node/no-security chỉ learning.

<a id="question-15"></a>

## 15. Test gateway gì?

**Câu trả lời mẫu:** **Conclusion:** SPA fallback, API route, header, body limit, cookie, WS upgrade, TLS, failure. **Mechanism:** smoke qua public origin. **Trade-off:** internal test miss proxy bug. **GameStream:** test HTTPS/API/Socket.IO/LiveKit WSS.

## Bảng thuật ngữ kỹ thuật

| Technical term     | Nghĩa tiếng Việt              | Giải thích đơn giản                                                           |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------- |
| Reproducible build | Bản dựng tái lập              | Cùng source và dependency tạo ra artifact tương đương.                        |
| Layer cache        | Bộ nhớ đệm lớp image          | Tái sử dụng layer không đổi để build nhanh hơn.                               |
| Non-root user      | Người dùng không phải root    | Chạy process với ít đặc quyền hơn để giảm impact khi bị xâm nhập.             |
| Graceful shutdown  | Dừng có kiểm soát             | Xử lý signal, ngừng nhận việc và đóng connection đúng cách.                   |
| Startup probe      | Kiểm tra khởi động            | Cho service thời gian khởi động trước khi đánh giá liveness.                  |
| Liveness probe     | Kiểm tra còn sống             | Phát hiện process cần được restart.                                           |
| Readiness probe    | Kiểm tra sẵn sàng             | Quyết định instance có nên nhận traffic.                                      |
| Secret injection   | Cấp secret lúc chạy           | Đưa credential qua secret store hoặc runtime mechanism thay vì ghi vào image. |
| Volume backup      | Sao lưu volume                | Backup dữ liệu persistent với consistency và restore test.                    |
| Resource limit     | Giới hạn tài nguyên           | Giới hạn CPU hoặc memory để bảo vệ host và workload khác.                     |
| Forwarded header   | Header chuyển tiếp            | Metadata proxy gửi về original host, protocol hoặc client address.            |
| Proxy timeout      | Thời gian chờ proxy           | Giới hạn proxy giữ connection hoặc chờ upstream.                              |
| Same-origin        | Cùng nguồn                    | Cùng scheme, host và port theo security model của browser.                    |
| CORS               | Chia sẻ tài nguyên khác nguồn | Cơ chế HTTP header cho browser quyết định cross-origin request.               |
| Gateway smoke test | Kiểm thử nhanh cổng vào       | Test public ingress, TLS, routing và upgrade sau deployment.                  |
