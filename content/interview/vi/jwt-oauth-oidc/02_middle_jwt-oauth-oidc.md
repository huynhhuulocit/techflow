# Middle — Câu hỏi phỏng vấn JWT, OAuth và OIDC

## Mục lục câu hỏi

1. [Resource server validate JWT thế nào?](#question-1)
2. [Algorithm-confusion attack là gì?](#question-2)
3. [Refresh-token reuse detection hoạt động thế nào?](#question-3)
4. [CSRF và XSS khác nhau thế nào?](#question-4)
5. [Revoke JWT thế nào?](#question-5)
6. [Signing-key rotation hoạt động thế nào?](#question-6)
7. [Scope khác role thế nào?](#question-7)
8. [WebSocket auth/refresh thế nào?](#question-8)
9. [Service-to-service authentication thế nào?](#question-9)
10. [Vì sao audience validation thiết yếu?](#question-10)
11. [OIDC discovery là gì?](#question-11)
12. [Vì sao lưu refresh-token hash?](#question-12)
13. [Logout nên hoạt động thế nào?](#question-13)
14. [BFF token pattern là gì?](#question-14)
15. [Nên audit gì?](#question-15)

<a id="question-1"></a>

## 1. Resource server validate JWT thế nào?

**Câu trả lời mẫu:** **Conclusion:** pin algorithm và validate signature, issuer, audience, time, required claim trước principal. **Mechanism:** key từ trusted config/JWKS. **Trade-off:** decode không phải validate. **GameStream:** guard reject malformed/expired/wrong-purpose token.

<a id="question-2"></a>

## 2. Algorithm-confusion attack là gì?

**Câu trả lời mẫu:** **Conclusion:** verifier chấp nhận attacker-chosen algorithm hoặc dùng public key như symmetric secret. **Mechanism:** unsafe library tin header `alg`. **Trade-off:** allowlist/key type đúng ngăn được. **GameStream:** không chọn verification policy từ untrusted header.

<a id="question-3"></a>

## 3. Refresh-token reuse detection hoạt động thế nào?

**Câu trả lời mẫu:** **Conclusion:** token đã rotate được dùng lại báo theft, nên revoke family/session. **Mechanism:** store hashed ID/successor state transactionally. **Trade-off:** concurrent legitimate refresh có thể giống reuse. **GameStream:** serialise rotation và client thay old token.

<a id="question-4"></a>

## 4. CSRF và XSS khác nhau thế nào?

**Câu trả lời mẫu:** **Conclusion:** CSRF abuse automatically sent credential; XSS chạy script trong trusted origin. **Mechanism:** SameSite/anti-CSRF so với encoding/CSP. **Trade-off:** localStorage tránh auto-send nhưng lộ token cho XSS. **GameStream:** chọn cookie/frontend policy theo threat model chung.

<a id="question-5"></a>

## 5. Revoke JWT thế nào?

**Câu trả lời mẫu:** **Conclusion:** short access TTL giới hạn delay; refresh session revoke server-side; deny-list chỉ cho exception. **Mechanism:** reject future refresh và disconnect khi cần. **Trade-off:** deny-list mỗi request giảm statelessness. **GameStream:** revoke admin/session phải vô hiệu refresh/socket.

<a id="question-6"></a>

## 6. Signing-key rotation hoạt động thế nào?

**Câu trả lời mẫu:** **Conclusion:** publish old/new key overlap, sign mới bằng key mới, retire cũ sau token expiry. **Mechanism:** `kid` chọn verifier key. **Trade-off:** cache/emergency revocation phức tạp. **GameStream:** unknown `kid` trigger safe JWKS refresh.

<a id="question-7"></a>

## 7. Scope khác role thế nào?

**Câu trả lời mẫu:** **Conclusion:** scope là delegated API permission; role là application/organisation authority. **Mechanism:** API map claim và vẫn check resource ownership. **Trade-off:** conflation tạo overbroad token. **GameStream:** admin role bảo vệ dashboard; owner check từ room data.

<a id="question-8"></a>

## 8. WebSocket auth/refresh thế nào?

**Câu trả lời mẫu:** **Conclusion:** verify token handshake, tránh query leak và reconnect/re-authorise khi expire. **Mechanism:** auth metadata qua TLS. **Trade-off:** long connection khó revoke ngay. **GameStream:** admin namespace fail closed.

<a id="question-9"></a>

## 9. Service-to-service authentication thế nào?

**Câu trả lời mẫu:** **Conclusion:** dedicated workload identity với narrow audience/scope, không shared user token/universal secret. **Mechanism:** client credentials, mTLS hoặc signed service token. **Trade-off:** rotation thêm ops. **GameStream:** backend-worker shared secret local cần nâng cấp production.

<a id="question-10"></a>

## 10. Vì sao audience validation thiết yếu?

**Câu trả lời mẫu:** **Conclusion:** ngăn token service A replay vào B. **Mechanism:** resource server require identifier mình trong `aud`. **Trade-off:** multi-audience tăng blast radius. **GameStream:** backend/admin/LiveKit grant purpose-specific.

<a id="question-11"></a>

## 11. OIDC discovery là gì?

**Câu trả lời mẫu:** **Conclusion:** discovery publish issuer metadata/endpoints. **Mechanism:** fetch well-known config và verify issuer consistency. **Trade-off:** startup/cache phải chịu provider outage an toàn. **GameStream:** Docker internal URL không được làm yếu external issuer validation.

<a id="question-12"></a>

## 12. Vì sao lưu refresh-token hash?

**Câu trả lời mẫu:** **Conclusion:** DB leak không lộ ngay bearer credential dùng được. **Mechanism:** compare cryptographic hash. **Trade-off:** không recover original token. **GameStream:** session record store verifier, không plaintext.

<a id="question-13"></a>

## 13. Logout nên hoạt động thế nào?

**Câu trả lời mẫu:** **Conclusion:** revoke local refresh session, clear cookie/client, optional provider logout. **Mechanism:** access token còn sống tới short expiry. **Trade-off:** global device logout cần policy. **GameStream:** định nghĩa single/all-session rõ.

<a id="question-14"></a>

## 14. BFF token pattern là gì?

**Câu trả lời mẫu:** **Conclusion:** BFF giữ OAuth token server-side và browser chỉ có protected session cookie. **Mechanism:** BFF gọi API thay browser. **Trade-off:** BFF stateful và CSRF-sensitive. **GameStream:** có thể giảm browser token exposure sau này.

<a id="question-15"></a>

## 15. Nên audit gì?

**Câu trả lời mẫu:** **Conclusion:** login outcome, session/token issue/rotate/revoke, role change và privileged access; không token content. **Mechanism:** immutable event có actor/target/time/correlation. **Trade-off:** audit data nhạy cảm. **GameStream:** admin dashboard đọc recent audit.

## Bảng thuật ngữ kỹ thuật

| Technical term       | Nghĩa tiếng Việt           | Giải thích đơn giản                                                   |
| -------------------- | -------------------------- | --------------------------------------------------------------------- |
| Resource server      | Máy chủ tài nguyên         | API nhận access token và bảo vệ resource.                             |
| JWT validation       | Kiểm tra JWT               | Kiểm tra chữ ký, algorithm, issuer, audience, time và claim bắt buộc. |
| Algorithm confusion  | Tấn công nhầm thuật toán   | Lừa verifier chấp nhận thuật toán hoặc key không được phép.           |
| Refresh-token reuse  | Tái sử dụng refresh token  | Một refresh token đã rotate bị dùng lại, có thể báo hiệu bị đánh cắp. |
| CSRF                 | Giả mạo yêu cầu liên trang | Ép browser đã đăng nhập gửi request ngoài ý muốn.                     |
| XSS                  | Thực thi script liên trang | Code độc hại chạy trong origin của ứng dụng.                          |
| Token revocation     | Thu hồi token              | Làm credential không còn được chấp nhận trước khi tự hết hạn.         |
| Signing-key rotation | Luân chuyển khóa ký        | Thay key theo kế hoạch trong khi vẫn xác minh token hợp lệ cũ.        |
| Scope                | Phạm vi quyền              | Quyền được ủy quyền cho client hoặc token.                            |
| Role                 | Vai trò                    | Nhóm permission gắn với user hoặc principal.                          |
| OIDC discovery       | Khám phá cấu hình OIDC     | Metadata endpoint công bố issuer, authorization, token và JWKS URL.   |
| Token hash           | Giá trị băm token          | Lưu fingerprint một chiều thay vì lưu refresh token thô.              |
| Logout               | Đăng xuất                  | Kết thúc session và thu hồi hoặc xóa credential phù hợp.              |
| BFF pattern          | Mẫu backend cho frontend   | Backend giữ token và frontend giao tiếp qua secure session cookie.    |
| Audit trail          | Dấu vết kiểm toán          | Lịch sử sự kiện security phục vụ điều tra và compliance.              |
