# Junior — Câu hỏi phỏng vấn JWT, OAuth và OIDC

## Mục lục câu hỏi

1. [JWT là gì?](#question-1)
2. [JWT signature chứng minh gì?](#question-2)
3. [Claim nào phải validate?](#question-3)
4. [Access token khác refresh token thế nào?](#question-4)
5. [OAuth 2.0 là gì?](#question-5)
6. [OpenID Connect là gì?](#question-6)
7. [Authorization Code flow là gì?](#question-7)
8. [PKCE là gì?](#question-8)
9. [`state` và `nonce` là gì?](#question-9)
10. [JWKS là gì?](#question-10)
11. [Vì sao rotate refresh token?](#question-11)
12. [Cookie khác browser storage thế nào?](#question-12)
13. [Authentication khác authorisation thế nào?](#question-13)
14. [Keycloak đóng vai trò gì?](#question-14)
15. [Vì sao tránh Password Grant?](#question-15)

<a id="question-1"></a>

## 1. JWT là gì?

**Câu trả lời mẫu:** **Conclusion:** JWT là compact signed claims format, mặc định không mã hoá. **Mechanism:** header, payload, signature được Base64URL và nối lại. **Trade-off:** ai giữ bearer JWT thường dùng được. **GameStream:** short-lived access token định danh API/socket user.

<a id="question-2"></a>

## 2. JWT signature chứng minh gì?

**Câu trả lời mẫu:** **Conclusion:** chứng minh integrity và signer authenticity khi trust key/algorithm. **Mechanism:** verification kiểm tra signature. **Trade-off:** không giấu claim. **GameStream:** không đặt secret trong payload.

<a id="question-3"></a>

## 3. Claim nào phải validate?

**Câu trả lời mẫu:** **Conclusion:** signature, algorithm allowlist, issuer, audience, expiry và required claim. **Mechanism:** reject ngoài clock-skew policy. **Trade-off:** thiếu audience check cho phép token service khác. **GameStream:** API/LiveKit token có purpose riêng.

<a id="question-4"></a>

## 4. Access token khác refresh token thế nào?

**Câu trả lời mẫu:** **Conclusion:** access token gọi API ngắn hạn; refresh token lấy access mới, dài hạn và nhạy cảm hơn. **Mechanism:** refresh qua auth endpoint. **Trade-off:** refresh session cần storage/revocation. **GameStream:** refresh value opaque và rotate.

<a id="question-5"></a>

## 5. OAuth 2.0 là gì?

**Câu trả lời mẫu:** **Conclusion:** OAuth là framework cho delegated authorisation. **Mechanism:** client lấy access token từ authorisation server để gọi resource server. **Trade-off:** OAuth không tự chuẩn hoá user identity. **GameStream:** Keycloak authorise web client.

<a id="question-6"></a>

## 6. OpenID Connect là gì?

**Câu trả lời mẫu:** **Conclusion:** OIDC là identity layer trên OAuth. **Mechanism:** `openid` scope và ID Token cho relying party verify authentication/claim. **Trade-off:** ID Token dành cho client, không phải general API auth. **GameStream:** Keycloak là OpenID Provider.

<a id="question-7"></a>

## 7. Authorization Code flow là gì?

**Câu trả lời mẫu:** **Conclusion:** browser nhận short-lived code rồi client exchange token. **Mechanism:** authorisation/token endpoint tách issuance. **Trade-off:** redirect URI/state validation rất quan trọng. **GameStream:** `/oidc/login` và callback implement flow.

<a id="question-8"></a>

## 8. PKCE là gì?

**Câu trả lời mẫu:** **Conclusion:** PKCE bind code vào client khởi tạo flow. **Mechanism:** random verifier tạo challenge; token endpoint cần verifier. **Trade-off:** không thay state/redirect validation. **GameStream:** browser login dùng Code plus PKCE.

<a id="question-9"></a>

## 9. `state` và `nonce` là gì?

**Câu trả lời mẫu:** **Conclusion:** `state` bind callback với flow; OIDC `nonce` bind ID Token với auth request. **Mechanism:** random one-time value được verify. **Trade-off:** cần short-lived server state. **GameStream:** state lưu Redis TTL và consume một lần.

<a id="question-10"></a>

## 10. JWKS là gì?

**Câu trả lời mẫu:** **Conclusion:** JWKS publish public key verify asymmetric JWT. **Mechanism:** chọn key theo `kid`, cache và handle rotation. **Trade-off:** unknown key cần refresh nhưng không insecure fallback. **GameStream:** backend validate Keycloak ID token qua JWKS.

<a id="question-11"></a>

## 11. Vì sao rotate refresh token?

**Câu trả lời mẫu:** **Conclusion:** mỗi refresh invalidate token cũ và cấp token mới để hạn chế replay. **Mechanism:** store hash/session family và detect reuse. **Trade-off:** concurrent refresh cần race policy. **GameStream:** Mongo transaction update session atomically.

<a id="question-12"></a>

## 12. Cookie khác browser storage thế nào?

**Câu trả lời mẫu:** **Conclusion:** HttpOnly Secure cookie giảm JS theft; in-memory token giảm automatic CSRF. **Mechanism:** SameSite/CSRF defence kiểm soát cookie. **Trade-off:** không lựa chọn nào sửa XSS. **GameStream:** refresh credential không cho frontend JS đọc.

<a id="question-13"></a>

## 13. Authentication khác authorisation thế nào?

**Câu trả lời mẫu:** **Conclusion:** authentication xác lập identity; authorisation quyết định action. **Mechanism:** verify JWT tạo principal rồi check role/resource. **Trade-off:** role-only bỏ sót ownership. **GameStream:** logged-in không đồng nghĩa owner/admin.

<a id="question-14"></a>

## 14. Keycloak đóng vai trò gì?

**Câu trả lời mẫu:** **Conclusion:** Keycloak là identity/authorisation server, không phải game DB. **Mechanism:** quản lý login, client, user, role, OIDC endpoint/key. **Trade-off:** thêm critical service. **GameStream:** backend map claim sang local user/session.

<a id="question-15"></a>

## 15. Vì sao tránh Password Grant?

**Câu trả lời mẫu:** **Conclusion:** modern guidance không cho client thu password; grant đã bị deprecate. **Mechanism:** redirect code flow giữ auth tại identity provider. **Trade-off:** redirect UX phức tạp hơn. **GameStream:** dùng Keycloak Authorization Code.

## Bảng thuật ngữ kỹ thuật

| Technical term          | Nghĩa tiếng Việt                   | Giải thích đơn giản                                                   |
| ----------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| JWT                     | Mã thông báo web JSON              | Token có các phần được mã hóa base64url và thường có chữ ký.          |
| Digital signature       | Chữ ký số                          | Bằng chứng token được ký bởi bên giữ key và nội dung không bị sửa.    |
| Claim                   | Thuộc tính khai báo                | Thông tin trong token như issuer, subject, audience và expiry.        |
| Issuer                  | Bên phát hành                      | Hệ thống tạo và ký token.                                             |
| Audience                | Đối tượng nhận                     | Service mà token được phát hành để sử dụng.                           |
| Expiration              | Thời điểm hết hạn                  | Thời điểm token không còn hợp lệ.                                     |
| Access token            | Token truy cập                     | Credential ngắn hạn dùng để gọi protected resource.                   |
| Refresh token           | Token làm mới                      | Credential dài hơn dùng để xin access token mới.                      |
| OAuth 2.0               | Khung ủy quyền OAuth 2.0           | Framework cho phép client nhận quyền truy cập resource.               |
| OpenID Connect          | Giao thức định danh OpenID Connect | Identity layer trên OAuth 2.0 để xác thực user.                       |
| Authorization Code flow | Luồng mã ủy quyền                  | Client nhận code rồi đổi code lấy token qua token endpoint.           |
| PKCE                    | Bằng chứng khóa cho trao đổi mã    | Liên kết authorization request với token exchange để chống chặn code. |
| State                   | Giá trị trạng thái                 | Giá trị ngẫu nhiên liên kết request/callback và hỗ trợ chống CSRF.    |
| Nonce                   | Giá trị dùng một lần               | Liên kết ID token với authentication request và giảm replay.          |
| JWKS                    | Tập khóa web JSON                  | Endpoint công bố public key dùng để kiểm tra chữ ký token.            |
