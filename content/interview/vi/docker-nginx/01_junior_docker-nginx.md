# Junior — Câu hỏi phỏng vấn Docker và Nginx

## Mục lục câu hỏi

1. [Docker image là gì?](#question-1)
2. [Container là gì?](#question-2)
3. [Dockerfile là gì?](#question-3)
4. [Multi-stage build là gì?](#question-4)
5. [Docker Compose là gì?](#question-5)
6. [Compose service giao tiếp thế nào?](#question-6)
7. [Volume là gì?](#question-7)
8. [Health check là gì?](#question-8)
9. [`depends_on` có bảo đảm ready không?](#question-9)
10. [Nginx là gì?](#question-10)
11. [Reverse proxy là gì?](#question-11)
12. [Vì sao WebSocket cần proxy header đặc biệt?](#question-12)
13. [Vì sao SPA cần fallback?](#question-13)
14. [TLS termination là gì?](#question-14)
15. [Nhiều container có nghĩa microservices không?](#question-15)

<a id="question-1"></a>

## 1. Docker image là gì?

**Câu trả lời mẫu:** **Conclusion:** image là immutable layered filesystem và runtime metadata. **Mechanism:** Dockerfile build layer. **Trade-off:** image lớn/unpinned làm chậm và kém reproducible. **GameStream:** multi-stage Dockerfile build backend, worker, web target.

<a id="question-2"></a>

## 2. Container là gì?

**Câu trả lời mẫu:** **Conclusion:** container là isolated process từ image, không phải VM. **Mechanism:** namespace/cgroup isolate. **Trade-off:** share host kernel. **GameStream:** toàn stack chạy container local.

<a id="question-3"></a>

## 3. Dockerfile là gì?

**Câu trả lời mẫu:** **Conclusion:** mô tả declarative cách build image. **Mechanism:** instruction tạo cached layer/runtime config. **Trade-off:** copy dư phá cache/đưa file không cần. **GameStream:** `.dockerignore` loại local/build data.

<a id="question-4"></a>

## 4. Multi-stage build là gì?

**Câu trả lời mẫu:** **Conclusion:** nhiều stage cho final image chỉ chứa runtime artifact. **Mechanism:** compiler/dependency ở builder. **Trade-off:** build logic phức tạp hơn. **GameStream:** compile TS trước app runtime target nhỏ.

<a id="question-5"></a>

## 5. Docker Compose là gì?

**Câu trả lời mẫu:** **Conclusion:** Compose định nghĩa/chạy multi-container app. **Mechanism:** YAML khai service, network, volume, env, health. **Trade-off:** tốt local/single host, không full orchestrator. **GameStream:** `compose.yaml` start learning stack.

<a id="question-6"></a>

## 6. Compose service giao tiếp thế nào?

**Câu trả lời mẫu:** **Conclusion:** cùng network resolve nhau bằng service name. **Mechanism:** container DNS map `mongodb`, `redis`. **Trade-off:** `localhost` trong container là chính nó. **GameStream:** backend gọi `mongodb:27017`.

<a id="question-7"></a>

## 7. Volume là gì?

**Câu trả lời mẫu:** **Conclusion:** volume persist data độc lập container lifecycle. **Mechanism:** mount managed storage. **Trade-off:** cần backup/ownership. **GameStream:** database/broker dùng named volume.

<a id="question-8"></a>

## 8. Health check là gì?

**Câu trả lời mẫu:** **Conclusion:** định kỳ test health condition. **Mechanism:** Docker ghi healthy/unhealthy. **Trade-off:** quá nông miss failure, quá sâu flap. **GameStream:** backend/worker có readiness.

<a id="question-9"></a>

## 9. `depends_on` có bảo đảm ready không?

**Câu trả lời mẫu:** **Conclusion:** start order không đồng nghĩa ready; cần health condition/retry. **Mechanism:** Compose chờ `service_healthy`/init complete. **Trade-off:** dependency vẫn fail sau startup. **GameStream:** backend chờ Mongo init/Redis/Elastic.

<a id="question-10"></a>

## 10. Nginx là gì?

**Câu trả lời mẫu:** **Conclusion:** Nginx là web/reverse-proxy server. **Mechanism:** serve static, TLS, proxy upstream. **Trade-off:** proxy config là phần correctness. **GameStream:** serve React, route API/socket/LiveKit.

<a id="question-11"></a>

## 11. Reverse proxy là gì?

**Câu trả lời mẫu:** **Conclusion:** nhận client traffic và forward internal server. **Mechanism:** thêm header/TLS/routing. **Trade-off:** header/timeout sai phá auth/realtime. **GameStream:** client dùng một origin.

<a id="question-12"></a>

## 12. Vì sao WebSocket cần proxy header đặc biệt?

**Câu trả lời mẫu:** **Conclusion:** Nginx phải forward HTTP upgrade. **Mechanism:** `Upgrade`/`Connection` switch protocol. **Trade-off:** buffering/timeout cũng cần tune. **GameStream:** Socket.IO/LiveKit dùng upgraded connection.

<a id="question-13"></a>

## 13. Vì sao SPA cần fallback?

**Câu trả lời mẫu:** **Conclusion:** client route cần `index.html` khi không có static file. **Mechanism:** `try_files` fallback. **Trade-off:** phải exclude API. **GameStream:** refresh React route vẫn load.

<a id="question-14"></a>

## 14. TLS termination là gì?

**Câu trả lời mẫu:** **Conclusion:** gateway xử lý HTTPS rồi forward nội bộ. **Mechanism:** present cert/key và negotiate TLS. **Trade-off:** trust/internal encryption phải rõ. **GameStream:** LAN Nginx dùng locally trusted cert.

<a id="question-15"></a>

## 15. Nhiều container có nghĩa microservices không?

**Câu trả lời mẫu:** **Conclusion:** không; container là deployment unit, microservice cần business capability/ownership/data boundary. **Mechanism:** modular monolith vẫn dùng nhiều infra container. **Trade-off:** gọi tất cả là service che architecture. **GameStream:** business backend là monolith; worker/LiveKit có runtime role riêng.

## Bảng thuật ngữ kỹ thuật

| Technical term    | Nghĩa tiếng Việt             | Giải thích đơn giản                                                           |
| ----------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Docker image      | Ảnh Docker                   | Gói filesystem và metadata bất biến dùng để tạo container.                    |
| Container         | Vùng chạy cô lập             | Process được cô lập dùng image và cấu hình runtime.                           |
| Dockerfile        | Tệp xây dựng Docker          | Danh sách instruction để tạo image.                                           |
| Multi-stage build | Xây dựng nhiều giai đoạn     | Dùng stage riêng để build rồi chỉ chép artifact cần thiết vào image cuối.     |
| Docker Compose    | Công cụ phối hợp container   | Khai báo và chạy nhiều service, network và volume bằng YAML.                  |
| Compose service   | Dịch vụ Compose              | Cấu hình cho một loại container trong Compose project.                        |
| Container network | Mạng container               | Mạng ảo cho container giao tiếp bằng service name.                            |
| Volume            | Ổ dữ liệu gắn ngoài          | Storage tồn tại độc lập với vòng đời container.                               |
| Health check      | Kiểm tra sức khỏe            | Lệnh xác định container hoặc service đang healthy hay không.                  |
| depends_on        | Khai báo phụ thuộc khởi động | Điều khiển thứ tự start cơ bản nhưng không luôn chứng minh ứng dụng đã ready. |
| Nginx             | Máy chủ Nginx                | Web server và reverse proxy hiệu năng cao.                                    |
| Reverse proxy     | Proxy ngược                  | Nhận request công khai rồi chuyển tới upstream nội bộ.                        |
| WebSocket upgrade | Nâng cấp kết nối WebSocket   | Chuyển HTTP connection thành WebSocket qua header phù hợp.                    |
| SPA fallback      | Đường dẫn dự phòng cho SPA   | Trả `index.html` để client router xử lý route không phải file tĩnh.           |
| TLS termination   | Kết thúc TLS                 | Proxy xử lý HTTPS rồi chuyển request tới upstream.                            |
