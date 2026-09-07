# Senior — Câu hỏi phỏng vấn Node.js và NestJS

## Mục lục câu hỏi

1. [Phân tích Node.js throughput và latency thế nào?](#question-1)
2. [Nên monitor runtime signal nào của Node.js?](#question-2)
3. [Node.js process nên sử dụng nhiều CPU core thế nào?](#question-3)
4. [Làm deployment graceful với long-lived connection thế nào?](#question-4)
5. [Vì sao ban đầu giữ business backend là modular monolith?](#question-5)
6. [Nest service nên tham gia consistency boundary thế nào?](#question-6)
7. [Version API và realtime contract thế nào?](#question-7)
8. [Implement load shedding thế nào?](#question-8)
9. [Quản lý configuration và secret xuyên môi trường thế nào?](#question-9)
10. [Cách ly failure trong modular monolith thế nào?](#question-10)
11. [Scale Socket.IO an toàn cần gì?](#question-11)
12. [Dependency-injection anti-pattern phổ biến là gì?](#question-12)
13. [Chẩn đoán Node.js memory leak thế nào?](#question-13)
14. [Observability nên bám Nest architecture thế nào?](#question-14)
15. [Evidence nào đủ để tách Nest module thành microservice?](#question-15)

<a id="question-1"></a>

## 1. Phân tích Node.js throughput và latency thế nào?

**Câu trả lời mẫu:** **Conclusion:** concurrency cao không bảo đảm latency thấp; phải đo event-loop utilisation, dependency queue và tail latency. **Mechanism:** callback chậm hoặc pool saturated làm nhiều request chờ. **Trade-off:** batching tăng throughput nhưng có thể làm p95/p99 xấu. **GameStream:** tối ưu end-to-end roll-to-broadcast path, không chỉ average handler time.

<a id="question-2"></a>

## 2. Nên monitor runtime signal nào của Node.js?

**Câu trả lời mẫu:** **Conclusion:** event-loop delay/utilisation, heap/RSS, garbage collection, active handle, request rate/error/latency và dependency pool. **Mechanism:** chúng phân biệt CPU blocking, memory pressure và external wait. **Trade-off:** label cardinality cao làm monitoring quá tải. **GameStream:** process memory và API latency mới là khởi đầu; production cần event-loop và GC metric.

<a id="question-3"></a>

## 3. Node.js process nên sử dụng nhiều CPU core thế nào?

**Câu trả lời mẫu:** **Conclusion:** scale stateless process/container qua nhiều core và đặt shared truth bên ngoài. **Mechanism:** load balancer phân phối connection; Redis/MongoDB phối hợp shared concern. **Trade-off:** sticky WebSocket và socket adapter cần thiết kế rõ. **GameStream:** replica phục vụ HTTP được, nhưng Socket.IO room cần shared adapter và recovery tương thích.

<a id="question-4"></a>

## 4. Làm deployment graceful với long-lived connection thế nào?

**Câu trả lời mẫu:** **Conclusion:** đặt instance unready, drain HTTP/socket, dừng nhận work rồi close sau deadline. **Mechanism:** client reconnect tới replica khoẻ và recover missed state. **Trade-off:** drain dài làm rollout chậm; timeout đột ngột có thể ngắt command. **GameStream:** persisted receipt và room resume cho phép retry an toàn sau backend restart.

<a id="question-5"></a>

## 5. Vì sao ban đầu giữ business backend là modular monolith?

**Câu trả lời mẫu:** **Conclusion:** rule và transaction cohesive đơn giản hơn trong một deployable khi chưa có scale evidence. **Mechanism:** module enforce code boundary mà không có network hop. **Trade-off:** backend scale cùng nhau và cần modularity kỷ luật. **GameStream:** rooms, chat, auth là module; async projection đã có worker boundary hợp lý.

<a id="question-6"></a>

## 6. Nest service nên tham gia consistency boundary thế nào?

**Câu trả lời mẫu:** **Conclusion:** application service định nghĩa một transaction boundary rõ cho mỗi command. **Mechanism:** domain tạo state/event; repository persist state, event và outbox atomically. **Trade-off:** transaction dài tăng contention. **GameStream:** room transition để Redis/Kafka bên ngoài MongoDB transaction và invalidate cache sau commit.

<a id="question-7"></a>

## 7. Version API và realtime contract thế nào?

**Câu trả lời mẫu:** **Conclusion:** version semantic contract, không version mọi implementation change, và có deprecation window đo được. **Mechanism:** URL, header, event name hoặc envelope version route handler tương thích. **Trade-off:** chạy nhiều version nhân đôi test/ops cost. **GameStream:** Kafka topic đã có `.v1`; HTTP/socket payload nên dùng cùng compatibility policy.

<a id="question-8"></a>

## 8. Implement load shedding thế nào?

**Câu trả lời mẫu:** **Conclusion:** từ chối sớm excess hoặc low-priority work để bảo vệ critical game command. **Mechanism:** bounded queue, concurrency limit, timeout và admission control trả retry signal rõ. **Trade-off:** cố ý fail một số request để giữ availability. **GameStream:** search/monitoring có thể degrade trước authoritative room command; bot load phải được cap.

<a id="question-9"></a>

## 9. Quản lý configuration và secret xuyên môi trường thế nào?

**Câu trả lời mẫu:** **Conclusion:** validate immutable config lúc startup và lấy secret từ secret store. **Mechanism:** deploy tooling inject value; app không log secret và rotate theo overlap plan. **Trade-off:** central secret system thêm operational dependency. **GameStream:** Compose default chỉ dành development; production secret của JWT, Keycloak, LiveKit và monitoring phải externalise.

<a id="question-10"></a>

## 10. Cách ly failure trong modular monolith thế nào?

**Câu trả lời mẫu:** **Conclusion:** áp dụng timeout, bulkhead, bounded concurrency và fallback quanh infrastructure dependency. **Mechanism:** capability phụ fail mà không làm cạn event loop/connection pool chung. **Trade-off:** process isolation bên trong monolith yếu hơn service riêng. **GameStream:** Elasticsearch/search có thể degrade trong khi MongoDB game recovery vẫn hoạt động.

<a id="question-11"></a>

## 11. Scale Socket.IO an toàn cần gì?

**Câu trả lời mẫu:** **Conclusion:** chia sẻ room broadcast giữa instance, xác định affinity và giữ reconnect recovery. **Mechanism:** adapter tương thích truyền packet; client gửi offset/version để repair missed state. **Trade-off:** Redis Pub/Sub đơn thuần không persist missed packet. **GameStream:** Redis Streams cùng MongoDB snapshot mạnh hơn chỉ dựa ephemeral adapter.

<a id="question-12"></a>

## 12. Dependency-injection anti-pattern phổ biến là gì?

**Câu trả lời mẫu:** **Conclusion:** service locator, global module khắp nơi, service quá lớn và circular dependency làm ẩn architecture. **Mechanism:** provider bất kỳ chạm infrastructure bất kỳ và bypass capability boundary. **Trade-off:** strict DI boundary cần port/adapter rõ hơn. **GameStream:** domain code nên là pure function không constructor; infrastructure chỉ nằm trong application provider.

<a id="question-13"></a>

## 13. Chẩn đoán Node.js memory leak thế nào?

**Câu trả lời mẫu:** **Conclusion:** xác nhận retained memory tăng bền vững rồi so sánh heap snapshot và allocation profile. **Mechanism:** listener, timer, closure, map hoặc cache không giới hạn giữ object reachable. **Trade-off:** profiling ảnh hưởng performance và cần traffic đại diện. **GameStream:** kiểm tra socket listener, presence timer và L1 cache size trước khi chỉ nhìn RSS.

<a id="question-14"></a>

## 14. Observability nên bám Nest architecture thế nào?

**Câu trả lời mẫu:** **Conclusion:** instrument user journey và module boundary với context nhất quán. **Mechanism:** middleware ghi request metric; application service phát domain counter; adapter expose dependency latency. **Trade-off:** per-user label gây cardinality explosion. **GameStream:** room latency, version conflict, reconnect outcome, outbox age và projection lag tạo causal chain.

<a id="question-15"></a>

## 15. Evidence nào đủ để tách Nest module thành microservice?

**Câu trả lời mẫu:** **Conclusion:** cần evidence về independent scaling, failure isolation, ownership hoặc release lớn hơn chi phí network/distributed data. **Mechanism:** trước hết tạo clean in-process port, đo coupling và định nghĩa data ownership. **Trade-off:** tách sớm thay local call bằng distributed communication không đáng tin. **GameStream:** livestream infrastructure và projection worker có natural boundary; core room/game rule hiện chưa có.

## Bảng thuật ngữ kỹ thuật

| Technical term        | Nghĩa tiếng Việt             | Giải thích đơn giản                                                           |
| --------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Throughput            | Thông lượng                  | Số request hoặc công việc hệ thống xử lý trong một đơn vị thời gian.          |
| Latency               | Độ trễ                       | Thời gian từ lúc gửi yêu cầu đến khi nhận kết quả.                            |
| Event-loop lag        | Độ trễ vòng lặp sự kiện      | Mức chậm trễ trước khi event loop xử lý được callback tiếp theo.              |
| Heap                  | Vùng nhớ heap                | Bộ nhớ động nơi JavaScript object được cấp phát.                              |
| CPU core              | Lõi xử lý                    | Đơn vị phần cứng có thể thực thi công việc song song.                         |
| Long-lived connection | Kết nối sống lâu             | Connection được giữ mở lâu như WebSocket.                                     |
| Modular monolith      | Khối nguyên khối theo mô-đun | Một ứng dụng deploy chung nhưng chia module có boundary rõ.                   |
| Consistency boundary  | Ranh giới nhất quán          | Phạm vi dữ liệu cần được thay đổi với cùng guarantee.                         |
| Contract versioning   | Đánh phiên bản hợp đồng      | Quản lý thay đổi API hoặc event mà không phá consumer.                        |
| Load shedding         | Chủ động loại tải            | Từ chối công việc ít quan trọng để bảo vệ chức năng cốt lõi.                  |
| Failure isolation     | Cô lập lỗi                   | Ngăn lỗi một capability làm sập toàn hệ thống.                                |
| Socket adapter        | Bộ điều hợp socket           | Cơ chế chia sẻ broadcast hoặc room state giữa nhiều gateway instance.         |
| Memory leak           | Rò rỉ bộ nhớ                 | Object không còn cần thiết nhưng vẫn bị giữ reference nên không được thu hồi. |
| Observability         | Khả năng quan sát            | Khả năng hiểu trạng thái hệ thống qua metrics, logs và traces.                |
| Service extraction    | Tách dịch vụ                 | Đưa một module thành service deploy độc lập dựa trên bằng chứng.              |
