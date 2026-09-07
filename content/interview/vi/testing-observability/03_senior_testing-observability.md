# Senior — Câu hỏi phỏng vấn Testing và Observability

## Mục lục câu hỏi

1. [Tạo risk-based test strategy thế nào?](#question-1)
2. [Property-based testing hữu ích ở đâu?](#question-2)
3. [Test effectively-once projection thế nào?](#question-3)
4. [Chaos engineering là gì?](#question-4)
5. [Chuyển load test thành capacity plan thế nào?](#question-5)
6. [Observe distributed causal chain thế nào?](#question-6)
7. [Vì sao alert symptom?](#question-7)
8. [Multi-window burn-rate alerting là gì?](#question-8)
9. [Run incident thế nào?](#question-9)
10. [Postmortem chứa gì?](#question-10)
11. [Test disaster recovery thế nào?](#question-11)
12. [Validate production an toàn thế nào?](#question-12)
13. [Kiểm soát flaky-test debt thế nào?](#question-13)
14. [Không nên thu observability data nào?](#question-14)
15. [Defend project readiness trong interview thế nào?](#question-15)

<a id="question-1"></a>

## 1. Tạo risk-based test strategy thế nào?

**Câu trả lời mẫu:** **Conclusion:** map critical invariant/failure mode vào test rẻ nhất chứng minh được. **Mechanism:** unit/integration/contract/E2E/load/chaos bổ sung nhau. **Trade-off:** exhaustive impossible. **GameStream:** ưu tiên không mất/duplicate roll và resume.

<a id="question-2"></a>

## 2. Property-based testing hữu ích ở đâu?

**Câu trả lời mẫu:** **Conclusion:** generate state/command sequence và assert invariant. **Mechanism:** shrinking tìm minimal case. **Trade-off:** generator cần domain skill. **GameStream:** score không giảm, turn order hợp lệ.

<a id="question-3"></a>

## 3. Test effectively-once projection thế nào?

**Câu trả lời mẫu:** **Conclusion:** replay duplicate/out-of-order quanh crash và assert final version converge. **Mechanism:** restart trước/sau effect/offset. **Trade-off:** timing cần harness. **GameStream:** Elastic/Redis khớp latest room.

<a id="question-4"></a>

## 4. Chaos engineering là gì?

**Câu trả lời mẫu:** **Conclusion:** controlled experiment validate resilience hypothesis. **Mechanism:** inject broker/network/process/resource failure có abort. **Trade-off:** unsafe experiment gây incident. **GameStream:** bắt đầu test Redis/Kafka/LiveKit loss.

<a id="question-5"></a>

## 5. Chuyển load test thành capacity plan thế nào?

**Câu trả lời mẫu:** **Conclusion:** tìm saturation, safe envelope, headroom khi failure. **Mechanism:** correlate throughput với p99/queue/CPU/memory. **Trade-off:** result hết hạn khi workload đổi. **GameStream:** size API/worker/SFU riêng.

<a id="question-6"></a>

## 6. Observe distributed causal chain thế nào?

**Câu trả lời mẫu:** **Conclusion:** trace/correlation ID cùng timestamp/version/offset. **Mechanism:** command tạo linked span/event. **Trade-off:** sampling bỏ rare chain. **GameStream:** trace HTTP commit tới socket/search.

<a id="question-7"></a>

## 7. Vì sao alert symptom?

**Câu trả lời mẫu:** **Conclusion:** user-impact symptom ưu tiên action; cause là diagnostic. **Mechanism:** SLO burn. **Trade-off:** low traffic cần synthetic. **GameStream:** page gameplay/recovery failure.

<a id="question-8"></a>

## 8. Multi-window burn-rate alerting là gì?

**Câu trả lời mẫu:** **Conclusion:** so error-budget burn nhanh/chậm để detect severe/sustained issue. **Mechanism:** nhiều threshold cân speed/noise. **Trade-off:** cần meaningful SLO. **GameStream:** command availability/latency.

<a id="question-9"></a>

## 9. Run incident thế nào?

**Câu trả lời mẫu:** **Conclusion:** impact/commander, mitigate, communicate, preserve evidence, recover, learn blameless. **Mechanism:** timeline/hypothesis. **Trade-off:** diagnosis sâu có thể chờ ổn định. **GameStream:** degrade search/media trước gameplay.

<a id="question-10"></a>

## 10. Postmortem chứa gì?

**Câu trả lời mẫu:** **Conclusion:** impact, timeline, contributing condition, detection/response gap, owned action. **Mechanism:** focus system cause. **Trade-off:** vague action vô ích. **GameStream:** update test/alert/runbook.

<a id="question-11"></a>

## 11. Test disaster recovery thế nào?

**Câu trả lời mẫu:** **Conclusion:** restore isolated và prove RPO/RTO/invariant. **Mechanism:** rebuild derived state sau authority. **Trade-off:** drill tốn capacity. **GameStream:** verify room/event/outbox/receipt rồi Elastic/Redis.

<a id="question-12"></a>

## 12. Validate production an toàn thế nào?

**Câu trả lời mẫu:** **Conclusion:** canary, flag, synthetic probe, SLO compare. **Mechanism:** auto rollback. **Trade-off:** dual path thêm complexity. **GameStream:** canary backend, socket recover version.

<a id="question-13"></a>

## 13. Kiểm soát flaky-test debt thế nào?

**Câu trả lời mẫu:** **Conclusion:** coi flake là defect, quarantine ngắn có owner/deadline, đo retry. **Mechanism:** bỏ sleep/shared state. **Trade-off:** endless retry che fail. **GameStream:** broker test condition wait.

<a id="question-14"></a>

## 14. Không nên thu observability data nào?

**Câu trả lời mẫu:** **Conclusion:** token, secret, raw sensitive payload, unbounded ID. **Mechanism:** redact/minimise tại source. **Trade-off:** privacy giảm debug detail. **GameStream:** audit action, không credential.

<a id="question-15"></a>

## 15. Defend project readiness trong interview thế nào?

**Câu trả lời mẫu:** **Conclusion:** nói rõ proven guarantee, evidence và gap. **Mechanism:** cite executable test/failure drill. **Trade-off:** happy path pass không bằng production ready. **GameStream:** tách verified MVP khỏi HA/sizing/security chưa prove.

## Bảng thuật ngữ kỹ thuật

| Technical term         | Nghĩa tiếng Việt               | Giải thích đơn giản                                                     |
| ---------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Risk-based testing     | Kiểm thử dựa trên rủi ro       | Ưu tiên test theo xác suất lỗi và mức ảnh hưởng.                        |
| Property-based testing | Kiểm thử dựa trên thuộc tính   | Sinh nhiều input để kiểm tra invariant tổng quát.                       |
| Effectively-once       | Hiệu ứng như đúng một lần      | Duplicate delivery vẫn tạo một kết quả cuối cùng nhờ idempotency.       |
| Chaos engineering      | Kỹ thuật hỗn loạn có kiểm soát | Thử nghiệm failure trong điều kiện có guardrail để kiểm tra resilience. |
| Capacity plan          | Kế hoạch năng lực              | Chuyển kết quả load test thành resource và scaling threshold.           |
| Causal chain           | Chuỗi nhân quả                 | Liên kết command, event và downstream effect bằng ID.                   |
| Symptom-based alert    | Cảnh báo theo triệu chứng      | Alert trên tác động user thay vì chỉ lỗi component.                     |
| Burn rate              | Tốc độ tiêu hao ngân sách lỗi  | Tốc độ hệ thống sử dụng error budget.                                   |
| Incident command       | Điều phối sự cố                | Vai trò và quy trình quản lý ứng phó incident.                          |
| Postmortem             | Báo cáo sau sự cố              | Phân tích timeline, impact, nguyên nhân và action mà không đổ lỗi.      |
| Disaster-recovery test | Kiểm thử khôi phục thảm họa    | Chứng minh backup, restore, RPO và RTO hoạt động.                       |
| Production validation  | Xác minh trên production       | Canary, synthetic check hoặc controlled probe với rủi ro giới hạn.      |
| Test debt              | Nợ kiểm thử                    | Chi phí tích lũy từ coverage yếu hoặc flaky test chưa xử lý.            |
| Sensitive telemetry    | Dữ liệu quan sát nhạy cảm      | Token, secret hoặc personal data không nên ghi vào log/metric.          |
| Operational readiness  | Mức sẵn sàng vận hành          | Bằng chứng về test, monitor, runbook, recovery và ownership.            |
