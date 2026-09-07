# Senior — Câu hỏi phỏng vấn Docker và Nginx

## Mục lục câu hỏi

1. [Khi nào Compose không đủ?](#question-1)
2. [Zero-downtime container deploy thế nào?](#question-2)
3. [Secure image supply chain thế nào?](#question-3)
4. [Segment container network thế nào?](#question-4)
5. [Nginx HA thế nào?](#question-5)
6. [Capacity-plan Nginx thế nào?](#question-6)
7. [Rate limiting nằm đâu?](#question-7)
8. [Rotate TLS certificate thế nào?](#question-8)
9. [Container observability minimum là gì?](#question-9)
10. [Recover bad gateway config thế nào?](#question-10)
11. [Disaster-recovery scope là gì?](#question-11)
12. [UDP media port thay deployment thế nào?](#question-12)
13. [Stateful upgrade thế nào?](#question-13)
14. [Container incident sequence nào hữu ích?](#question-14)
15. [Vì sao container count là architecture metric kém?](#question-15)

<a id="question-1"></a>

## 1. Khi nào Compose không đủ?

**Câu trả lời mẫu:** **Conclusion:** khi cần multi-host scheduling, self-heal, autoscale, controlled rollout, secret/network policy. **Mechanism:** orchestrator quản lý desired state. **Trade-off:** Kubernetes/managed platform phức tạp. **GameStream:** chỉ adopt khi reliability justify.

<a id="question-2"></a>

## 2. Zero-downtime container deploy thế nào?

**Câu trả lời mẫu:** **Conclusion:** start healthy replica mới, shift traffic, drain cũ, rollback khi SLO xấu. **Mechanism:** readiness/immutable tag. **Trade-off:** data/event compatibility xuyên version. **GameStream:** socket resume hỗ trợ drain.

<a id="question-3"></a>

## 3. Secure image supply chain thế nào?

**Câu trả lời mẫu:** **Conclusion:** pin digest/provenance, scan, minimise, SBOM, sign/verify. **Mechanism:** CI promote immutable tested image. **Trade-off:** scan cần triage. **GameStream:** runtime image không có dev tool/secret.

<a id="question-4"></a>

## 4. Segment container network thế nào?

**Câu trả lời mẫu:** **Conclusion:** chỉ gateway/media port public; restrict east-west theo need. **Mechanism:** network policy/security group. **Trade-off:** policy sai gây outage. **GameStream:** DB/broker không internet-facing.

<a id="question-5"></a>

## 5. Nginx HA thế nào?

**Câu trả lời mẫu:** **Conclusion:** nhiều stateless gateway sau LB, externalise cert/config. **Mechanism:** health remove failed replica. **Trade-off:** drain quan trọng cho socket. **GameStream:** không single gateway production.

<a id="question-6"></a>

## 6. Capacity-plan Nginx thế nào?

**Câu trả lời mẫu:** **Conclusion:** model connection, request/byte, TLS handshake, upstream, buffer, file descriptor. **Mechanism:** load test HTTP/upgrade riêng. **Trade-off:** media không proxy qua app gateway. **GameStream:** UDP bypass Nginx.

<a id="question-7"></a>

## 7. Rate limiting nằm đâu?

**Câu trả lời mẫu:** **Conclusion:** coarse edge protection ở gateway; identity/business limit ở app. **Mechanism:** Nginx IP zone, Redis principal limit. **Trade-off:** IP limit hại shared network. **GameStream:** login/chat user-aware.

<a id="question-8"></a>

## 8. Rotate TLS certificate thế nào?

**Câu trả lời mẫu:** **Conclusion:** automate issuance/renewal, validate, reload không drop connection. **Mechanism:** cert manager distribute. **Trade-off:** lifecycle cần audit. **GameStream:** mkcert chỉ LAN dev.

<a id="question-9"></a>

## 9. Container observability minimum là gì?

**Câu trả lời mẫu:** **Conclusion:** central log, metric/trace, saturation, restart/OOM, health, deploy version. **Mechanism:** attach correlation/image revision. **Trade-off:** container log thiếu business context. **GameStream:** correlate gateway/backend/worker/infra.

<a id="question-10"></a>

## 10. Recover bad gateway config thế nào?

**Câu trả lời mẫu:** **Conclusion:** CI validate, canary, monitor, instant rollback artifact. **Mechanism:** immutable versioned config. **Trade-off:** manual hot edit nhanh nhưng unaudited. **GameStream:** test WS path trước rollout.

<a id="question-11"></a>

## 11. Disaster-recovery scope là gì?

**Câu trả lời mẫu:** **Conclusion:** rebuild stateless từ image/config, restore stateful theo RPO/RTO. **Mechanism:** IaC và tested backup. **Trade-off:** volume không phải DR plan. **GameStream:** Mongo restore trước derived state.

<a id="question-12"></a>

## 12. UDP media port thay deployment thế nào?

**Câu trả lời mẫu:** **Conclusion:** cần advertised address, UDP range và WebRTC-compatible LB. **Mechanism:** HTTP ingress không xử lý RTP. **Trade-off:** firewall/NAT chuyên biệt. **GameStream:** LiveKit là concern riêng.

<a id="question-13"></a>

## 13. Stateful upgrade thế nào?

**Câu trả lời mẫu:** **Conclusion:** theo supported order, giữ quorum/replication, test compatibility/rollback. **Mechanism:** upgrade incremental. **Trade-off:** migration có thể irreversible. **GameStream:** không treat DB như stateless container.

<a id="question-14"></a>

## 14. Container incident sequence nào hữu ích?

**Câu trả lời mẫu:** **Conclusion:** confirm impact, recent deploy, health/restart/resource/network, isolate/rollback, preserve evidence. **Mechanism:** correlate version/host. **Trade-off:** restart mù mất clue. **GameStream:** tách app unhealthy khỏi dependency unavailable.

<a id="question-15"></a>

## 15. Vì sao container count là architecture metric kém?

**Câu trả lời mẫu:** **Conclusion:** infra/app process cần container riêng; business service quality phụ thuộc boundary/ownership. **Mechanism:** deployment topology không đồng nhất domain architecture. **Trade-off:** nhiều deployable vẫn thêm ops. **GameStream:** một web, modular backend, worker và specialised infra.

## Bảng thuật ngữ kỹ thuật

| Technical term           | Nghĩa tiếng Việt               | Giải thích đơn giản                                                       |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------------- |
| Orchestrator             | Bộ điều phối container         | Hệ thống quản lý scheduling, rollout, health và scale của container.      |
| Zero-downtime deployment | Triển khai không gián đoạn     | Thay instance mà vẫn duy trì capacity và connection cần thiết.            |
| Software supply chain    | Chuỗi cung ứng phần mềm        | Toàn bộ nguồn, dependency, build, registry và artifact trước khi deploy.  |
| Image provenance         | Nguồn gốc image                | Bằng chứng image được build từ source và pipeline đáng tin.               |
| Network segmentation     | Phân đoạn mạng                 | Chỉ cho phép service giao tiếp theo boundary cần thiết.                   |
| High availability        | Tính sẵn sàng cao              | Nhiều instance hoặc failure domain giúp giảm single point of failure.     |
| Capacity planning        | Lập kế hoạch năng lực          | Ước lượng connection, request rate, CPU, memory và bandwidth.             |
| Rate limiting            | Giới hạn tần suất              | Giới hạn request để chống abuse và quá tải.                               |
| Certificate rotation     | Luân chuyển chứng chỉ          | Thay certificate/key trước khi hết hạn mà giảm gián đoạn.                 |
| Container observability  | Khả năng quan sát container    | Metrics, logs và traces gắn với instance, image và deployment.            |
| Configuration rollback   | Hoàn tác cấu hình              | Quay lại gateway config đã biết hoạt động khi bản mới lỗi.                |
| Disaster recovery        | Khôi phục thảm họa             | Phục hồi service và dữ liệu sau sự cố lớn.                                |
| UDP media port           | Cổng media UDP                 | Cổng truyền media không đi qua reverse proxy HTTP thông thường.           |
| Stateful upgrade         | Nâng cấp dịch vụ có trạng thái | Upgrade cần giữ compatibility và migration cho persistent state.          |
| Architecture metric      | Chỉ số kiến trúc               | Phép đo phản ánh boundary hoặc coupling; số container đơn thuần không đủ. |
