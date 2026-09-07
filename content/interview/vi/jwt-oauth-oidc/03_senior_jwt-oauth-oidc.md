# Senior — Câu hỏi phỏng vấn JWT, OAuth và OIDC

## Mục lục câu hỏi

1. [Current OAuth security guidance yêu cầu gì?](#question-1)
2. [Threat-model GameStream auth thế nào?](#question-2)
3. [JWT hay opaque access token?](#question-3)
4. [Thiết kế refresh-token family thế nào?](#question-4)
5. [Auth state scale đa region thế nào?](#question-5)
6. [Keycloak unavailable thì sao?](#question-6)
7. [Xử lý emergency key compromise thế nào?](#question-7)
8. [Authorisation data có nên nằm hết trong JWT?](#question-8)
9. [Least privilege xuyên token thế nào?](#question-9)
10. [Secure account linking thế nào?](#question-10)
11. [Privacy principle nào áp dụng cho claim?](#question-11)
12. [Detect credential abuse thế nào?](#question-12)
13. [LiveKit grant nhất quán game role thế nào?](#question-13)
14. [Auth SLI nào cần monitor?](#question-14)
15. [Ứng phó suspected refresh-token theft thế nào?](#question-15)

<a id="question-1"></a>

## 1. Current OAuth security guidance yêu cầu gì?

**Câu trả lời mẫu:** **Conclusion:** Code plus PKCE, exact redirect, sender constraint khi hợp, least privilege, tránh implicit/password grant. **Mechanism:** RFC 9700 cập nhật old guidance. **Trade-off:** secure flow thêm state. **GameStream:** theo current BCP, không legacy tutorial.

<a id="question-2"></a>

## 2. Threat-model GameStream auth thế nào?

**Câu trả lời mẫu:** **Conclusion:** bảo vệ credential, code, token, key, session và role/membership khỏi theft/replay/substitution/escalation. **Mechanism:** map browser, backend, Keycloak, Redis/Mongo, LiveKit boundary. **Trade-off:** ưu tiên theo impact/likelihood. **GameStream:** media-token escalation và refresh reuse là path riêng.

<a id="question-3"></a>

## 3. JWT hay opaque access token?

**Câu trả lời mẫu:** **Conclusion:** JWT local validation; opaque central introspection/revocation. **Mechanism:** chọn theo audience/risk. **Trade-off:** JWT claim stale tới expiry; introspection thêm dependency. **GameStream:** short JWT cho API, admin risk cao có thể fresh-check.

<a id="question-4"></a>

## 4. Thiết kế refresh-token family thế nào?

**Câu trả lời mẫu:** **Conclusion:** session family có current hash, reuse/revoke state, expiry, device, atomic rotation. **Mechanism:** reuse revoke family và audit. **Trade-off:** concurrent tab cần coordination. **GameStream:** một transaction ngăn hai successor.

<a id="question-5"></a>

## 5. Auth state scale đa region thế nào?

**Câu trả lời mẫu:** **Conclusion:** region affinity hoặc consistency ngăn concurrent refresh/stale revoke. **Mechanism:** ownership/strong conditional write serialise. **Trade-off:** global consistency tăng latency. **GameStream:** JWT validation local; refresh mutation cần stronger ownership.

<a id="question-6"></a>

## 6. Keycloak unavailable thì sao?

**Câu trả lời mẫu:** **Conclusion:** existing locally verified access token dùng tới expiry; login/refresh/discovery degrade, không bypass. **Mechanism:** cache known JWKS bounded. **Trade-off:** TTL dài cải thiện availability nhưng chậm emergency revoke. **GameStream:** auth dependency health riêng.

<a id="question-7"></a>

## 7. Xử lý emergency key compromise thế nào?

**Câu trả lời mẫu:** **Conclusion:** stop signing, activate replacement, revoke credential/session, shorten acceptance và communicate. **Mechanism:** verifier refresh JWKS/reject compromised `kid`. **Trade-off:** abrupt removal logout user hợp lệ. **GameStream:** cần tested rotation runbook.

<a id="question-8"></a>

## 8. Authorisation data có nên nằm hết trong JWT?

**Câu trả lời mẫu:** **Conclusion:** coarse stable role được; dynamic ownership/membership phải từ authority/cache ngắn. **Mechanism:** token claim là snapshot. **Trade-off:** DB check tốn latency. **GameStream:** admin role là claim; owner/publish check MongoDB.

<a id="question-9"></a>

## 9. Least privilege xuyên token thế nào?

**Câu trả lời mẫu:** **Conclusion:** token riêng ngắn theo audience, room, capability thay universal token. **Mechanism:** resource server reject wrong audience/scope. **Trade-off:** token exchange thêm complexity. **GameStream:** LiveKit token room-scoped và subscribe-only.

<a id="question-10"></a>

## 10. Secure account linking thế nào?

**Câu trả lời mẫu:** **Conclusion:** link bằng issuer-plus-subject ổn định và authenticated proof; không chỉ email chưa verify. **Mechanism:** `iss` + `sub` là external identity key. **Trade-off:** provider migration cần reconciliation. **GameStream:** local user ID không đổi theo display name.

<a id="question-11"></a>

## 11. Privacy principle nào áp dụng cho claim?

**Câu trả lời mẫu:** **Conclusion:** minimise theo audience, tránh sensitive data, bound retention, không log token. **Mechanism:** scope/claim mapping chỉ disclose cần thiết. **Trade-off:** API cần profile lookup thêm. **GameStream:** media/socket token không cần full profile.

<a id="question-12"></a>

## 12. Detect credential abuse thế nào?

**Câu trả lời mẫu:** **Conclusion:** alert refresh reuse, impossible session change, repeated failure, escalation, abnormal issuance; tránh IP-only rule. **Mechanism:** correlate session/device/audit. **Trade-off:** false positive lock user. **GameStream:** phân biệt bot traffic và compromise.

<a id="question-13"></a>

## 13. LiveKit grant nhất quán game role thế nào?

**Câu trả lời mẫu:** **Conclusion:** mint just-in-time từ room state, short-lived, revoke/remove khi role mất. **Mechanism:** không copy owner power lâu vào general token. **Trade-off:** ownership transfer cần refresh/rejoin. **GameStream:** publish grant là capability token từ backend.

<a id="question-14"></a>

## 14. Auth SLI nào cần monitor?

**Câu trả lời mẫu:** **Conclusion:** login/refresh success/latency, invalid reason, provider/JWKS health, reuse, revocation delay, privileged denial. **Mechanism:** label flow/client, không user. **Trade-off:** telemetry nhạy cảm. **GameStream:** tách user error khỏi Keycloak/backend failure.

<a id="question-15"></a>

## 15. Ứng phó suspected refresh-token theft thế nào?

**Câu trả lời mẫu:** **Conclusion:** revoke family, invalidate privileged connection, giữ audit, notify/re-auth user và investigate. **Mechanism:** reuse detection trigger. **Trade-off:** false positive interrupt session. **GameStream:** không chỉ cấp token khác sau reuse.

## Bảng thuật ngữ kỹ thuật

| Technical term           | Nghĩa tiếng Việt                 | Giải thích đơn giản                                                            |
| ------------------------ | -------------------------------- | ------------------------------------------------------------------------------ |
| OAuth security BCP       | Thực hành tốt nhất bảo mật OAuth | Hướng dẫn hiện hành giảm flow và cấu hình dễ bị tấn công.                      |
| Threat model             | Mô hình mối đe dọa               | Phân tích asset, attacker, trust boundary và abuse path.                       |
| Opaque token             | Token không tự mô tả             | Chuỗi ngẫu nhiên cần introspection hoặc lookup ở authorization server.         |
| Token family             | Họ token làm mới                 | Chuỗi refresh token liên quan qua các lần rotation.                            |
| Multi-region auth state  | Trạng thái xác thực đa vùng      | Session, revocation và key được phục vụ ở nhiều region.                        |
| Identity-provider outage | Sự cố nhà cung cấp định danh     | Authorization server không thể login, refresh hoặc công bố key.                |
| Key compromise           | Lộ khóa                          | Private signing key bị attacker lấy hoặc dùng trái phép.                       |
| Stale authorisation      | Quyền đã lỗi thời                | Token vẫn chứa role cũ sau khi quyền thực tế thay đổi.                         |
| Least privilege          | Đặc quyền tối thiểu              | Chỉ cấp đúng quyền, resource và thời gian cần thiết.                           |
| Account linking          | Liên kết tài khoản               | Kết nối nhiều identity với cùng account nội bộ.                                |
| Data minimisation        | Tối thiểu hóa dữ liệu            | Chỉ đưa claim thật sự cần thiết vào token và log.                              |
| Credential abuse         | Lạm dụng thông tin xác thực      | Dùng token, password hoặc session trái phép.                                   |
| Media grant              | Quyền truy cập media             | Claim giới hạn khả năng join, publish hoặc subscribe media.                    |
| Auth SLI                 | Chỉ số mức dịch vụ xác thực      | Đo login success, refresh latency, validation error hoặc revocation freshness. |
| Incident response        | Ứng phó sự cố                    | Quy trình phát hiện, cô lập, thu hồi và phục hồi sau security event.           |
