# Senior — Câu hỏi phỏng vấn System Design và Pattern

## Mục lục câu hỏi

1. [Bắt đầu system-design interview thế nào?](#question-1)
2. [Estimate capacity thế nào?](#question-2)
3. [SLI, SLO, SLA khác nhau thế nào?](#question-3)
4. [Design reliability thế nào?](#question-4)
5. [Chọn consistency theo feature thế nào?](#question-5)
6. [Scale write path thế nào?](#question-6)
7. [Design multi-region thế nào?](#question-7)
8. [Failure domain là gì?](#question-8)
9. [Backpressure end-to-end thế nào?](#question-9)
10. [Contract evolve độc lập thế nào?](#question-10)
11. [Security shape architecture thế nào?](#question-11)
12. [Observable distributed flow thế nào?](#question-12)
13. [Cân bằng cost/performance thế nào?](#question-13)
14. [Defend technology choice thế nào?](#question-14)
15. [Defend hybrid architecture của GameStream.](#question-15)

<a id="question-1"></a>

## 1. Bắt đầu system-design interview thế nào?

**Câu trả lời mẫu:** **Conclusion:** clarify user, critical flow, scale, consistency, availability, security, constraint trước khi vẽ. **Mechanism:** quantify assumption. **Trade-off:** time-box depth. **GameStream:** hỏi room size, concurrency, recovery window, media quality.

<a id="question-2"></a>

## 2. Estimate capacity thế nào?

**Câu trả lời mẫu:** **Conclusion:** derive peak request/event/connection/byte/storage từ behaviour, thêm headroom. **Mechanism:** ghi unit/sensitivity. **Trade-off:** estimate guide test. **GameStream:** chat retention và media egress chi phối dimension khác.

<a id="question-3"></a>

## 3. SLI, SLO, SLA khác nhau thế nào?

**Câu trả lời mẫu:** **Conclusion:** SLI là measure, SLO là internal target, SLA là external commitment. **Mechanism:** critical journey có indicator. **Trade-off:** quá nhiều SLO mất focus. **GameStream:** roll-to-render/recovery cần SLI.

<a id="question-4"></a>

## 4. Design reliability thế nào?

**Câu trả lời mẫu:** **Conclusion:** bỏ SPOF, bound work, idempotent retry, durable truth, failure test. **Mechanism:** redundancy/recovery procedure. **Trade-off:** tốn capacity/complexity. **GameStream:** authority sống qua process/cache/media loss.

<a id="question-5"></a>

## 5. Chọn consistency theo feature thế nào?

**Câu trả lời mẫu:** **Conclusion:** invariant cần strong/conditional write; discovery eventual. **Mechanism:** classify stale impact. **Trade-off:** strong consistency tốn latency/availability. **GameStream:** turn strict, search lag được.

<a id="question-6"></a>

## 6. Scale write path thế nào?

**Câu trả lời mẫu:** **Conclusion:** partition aggregate, transaction local, control hot key. **Mechanism:** room ID là ownership. **Trade-off:** global query cần projection. **GameStream:** room independent, Elastic discovery.

<a id="question-7"></a>

## 7. Design multi-region thế nào?

**Câu trả lời mẫu:** **Conclusion:** assign room write region, media gần participant. **Mechanism:** route room, async replicate. **Trade-off:** failover có RPO/RTO. **GameStream:** tránh active-active same room.

<a id="question-8"></a>

## 8. Failure domain là gì?

**Câu trả lời mẫu:** **Conclusion:** process, host, zone, region, provider, credential có thể fail cùng. **Mechanism:** redundancy phải cross target domain. **Trade-off:** resilience rộng tốn hơn. **GameStream:** one-node local không chứng minh HA.

<a id="question-9"></a>

## 9. Backpressure end-to-end thế nào?

**Câu trả lời mẫu:** **Conclusion:** bound mọi queue/concurrency và shed optional trước critical. **Mechanism:** lag/age drive admission. **Trade-off:** intentional reject bảo vệ availability. **GameStream:** search replay nhường room command.

<a id="question-10"></a>

## 10. Contract evolve độc lập thế nào?

**Câu trả lời mẫu:** **Conclusion:** tolerant reader, additive change, explicit version, deprecation telemetry. **Mechanism:** compatibility test gate. **Trade-off:** parallel version tốn. **GameStream:** HTTP/socket/Kafka cùng governance.

<a id="question-11"></a>

## 11. Security shape architecture thế nào?

**Câu trả lời mẫu:** **Conclusion:** trust boundary, least privilege, secret isolation, audit, abuse control là input. **Mechanism:** token/service capability hẹp. **Trade-off:** thêm latency/ops. **GameStream:** backend mint owner media grant.

<a id="question-12"></a>

## 12. Observable distributed flow thế nào?

**Câu trả lời mẫu:** **Conclusion:** propagate correlation/causation ID và đo từng hop/end-to-end. **Mechanism:** join log/metric/trace quanh event ID. **Trade-off:** tránh cardinality cao. **GameStream:** command ID theo outbox/Kafka/projection.

<a id="question-13"></a>

## 13. Cân bằng cost/performance thế nào?

**Câu trả lời mẫu:** **Conclusion:** tối ưu scarce resource theo workload/SLO. **Mechanism:** model marginal cost và controlled degrade. **Trade-off:** headroom tốn tiền. **GameStream:** adaptive video đáng hơn micro-opt dice.

<a id="question-14"></a>

## 14. Defend technology choice thế nào?

**Câu trả lời mẫu:** **Conclusion:** nối tool với guarantee, alternative, exit/recovery plan. **Mechanism:** evidence/ownership justify complexity. **Trade-off:** learning goal phải label. **GameStream:** Kafka/Elastic vừa research vừa projection role.

<a id="question-15"></a>

## 15. Defend hybrid architecture của GameStream.

**Câu trả lời mẫu:** **Conclusion:** business invariant cohesive ở modular monolith; projection/media workload tách. **Mechanism:** Mongo authority, outbox/Kafka, Redis realtime, Elastic search, LiveKit media có boundary rõ. **Trade-off:** stack giàu ops nên production adoption dựa evidence. **GameStream:** chỉ extract thêm business microservice khi có evidence về scaling, ownership hoặc deployment.

## Bảng thuật ngữ kỹ thuật

| Technical term          | Nghĩa tiếng Việt        | Giải thích đơn giản                                                         |
| ----------------------- | ----------------------- | --------------------------------------------------------------------------- |
| Capacity estimation     | Ước lượng năng lực      | Tính request, event, storage, connection và bandwidth từ workload giả định. |
| SLI                     | Chỉ số mức dịch vụ      | Phép đo thực tế về độ tin cậy hoặc hiệu năng.                               |
| SLO                     | Mục tiêu mức dịch vụ    | Target nội bộ cho một SLI trong khoảng thời gian.                           |
| SLA                     | Thỏa thuận mức dịch vụ  | Cam kết bên ngoài có thể kèm hậu quả khi không đạt.                         |
| Reliability             | Độ tin cậy              | Khả năng hệ thống tạo kết quả đúng và phục hồi khi có lỗi.                  |
| Strong consistency      | Nhất quán mạnh          | Read/write tuân theo guarantee chặt để bảo vệ invariant.                    |
| Write path              | Đường ghi               | Chuỗi component từ command tới khi state được commit.                       |
| Multi-region design     | Thiết kế đa vùng        | Phân phối traffic và data qua nhiều khu vực địa lý.                         |
| Failure domain          | Miền lỗi                | Nhóm component có thể cùng hỏng vì một nguyên nhân.                         |
| End-to-end backpressure | Áp lực ngược xuyên suốt | Giới hạn tải được truyền qua mọi queue và dependency.                       |
| Contract compatibility  | Tương thích hợp đồng    | Producer và consumer version khác nhau vẫn giao tiếp an toàn.               |
| Trust boundary          | Ranh giới tin cậy       | Điểm cần xác thực, validate và giới hạn quyền.                              |
| Distributed tracing     | Theo vết phân tán       | Theo một request hoặc event qua nhiều service và hop.                       |
| Cost efficiency         | Hiệu quả chi phí        | Đạt SLO với tài nguyên và chi phí hợp lý.                                   |
| Hybrid architecture     | Kiến trúc lai           | Kết hợp nhiều style hoặc deployment boundary theo từng workload.            |
