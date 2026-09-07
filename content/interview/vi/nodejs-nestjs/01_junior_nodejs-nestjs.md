# Junior — Câu hỏi phỏng vấn Node.js và NestJS

## Mục lục câu hỏi

1. [Node.js là gì?](#question-1)
2. [Event loop là gì?](#question-2)
3. [Asynchronous có đồng nghĩa parallel không?](#question-3)
4. [Promise là gì?](#question-4)
5. [NestJS là gì?](#question-5)
6. [Nest module là gì?](#question-6)
7. [Controller là gì?](#question-7)
8. [Provider là gì?](#question-8)
9. [Dependency injection là gì?](#question-9)
10. [Middleware, guard và pipe khác nhau thế nào?](#question-10)
11. [Interceptor và exception filter làm gì?](#question-11)
12. [Provider scope là gì?](#question-12)
13. [Vì sao validate environment configuration lúc startup?](#question-13)
14. [Graceful shutdown là gì?](#question-14)
15. [Khi nào GameStream dùng HTTP, khi nào dùng Socket.IO?](#question-15)

<a id="question-1"></a>

## 1. Node.js là gì?

**Câu trả lời mẫu:** **Conclusion:** Node.js là JavaScript runtime dành cho server và tooling workload. **Mechanism:** JavaScript chạy trên event loop, còn nhiều I/O operation được giao cho hệ điều hành hoặc worker pool. **Trade-off:** nó mạnh ở concurrent I/O nhưng CPU-heavy work có thể block. **GameStream:** API, async worker và bot runner đều chạy trên Node.js.

<a id="question-2"></a>

## 2. Event loop là gì?

**Câu trả lời mẫu:** **Conclusion:** event loop lập lịch JavaScript callback khi asynchronous work sẵn sàng. **Mechanism:** nó đi qua các phase và xử lý microtask giữa các công việc. **Trade-off:** một synchronous callback dài làm chậm request không liên quan. **GameStream:** callback HTTP, Socket.IO, Redis và MongoDB dùng chung event loop của backend.

<a id="question-3"></a>

## 3. Asynchronous có đồng nghĩa parallel không?

**Câu trả lời mẫu:** **Conclusion:** không; async nghĩa caller có thể yield, còn parallel nghĩa công việc chạy đồng thời. **Mechanism:** I/O có thể tiến triển ngoài JavaScript thread nhưng callback vẫn chạy trên event loop. **Trade-off:** CPU work cần worker thread hoặc process khác. **GameStream:** database call có thể overlap, còn video processing phải nằm ngoài API process.

<a id="question-4"></a>

## 4. Promise là gì?

**Câu trả lời mẫu:** **Conclusion:** Promise biểu diễn một giá trị sẽ fulfilled hoặc rejection trong tương lai. **Mechanism:** `async/await` là cú pháp trên promise chaining và error propagation. **Trade-off:** unhandled rejection và concurrency không giới hạn gây vấn đề vận hành. **GameStream:** service await transaction và chuyển failure tới exception layer của Nest.

<a id="question-5"></a>

## 5. NestJS là gì?

**Câu trả lời mẫu:** **Conclusion:** NestJS là Node.js framework có module, dependency injection và transport abstraction. **Mechanism:** decorator cung cấp metadata để dựng application graph. **Trade-off:** convention framework thêm abstraction và reflection overhead. **GameStream:** Nest host HTTP controller, Socket.IO gateway, guard, pipe và infrastructure provider.

<a id="question-6"></a>

## 6. Nest module là gì?

**Câu trả lời mẫu:** **Conclusion:** module nhóm controller/provider liên quan và xác định import/export. **Mechanism:** metadata `@Module` tạo dependency boundary. **Trade-off:** export mọi thứ phá encapsulation. **GameStream:** rooms, chat, auth, live, search, realtime và admin là module riêng trong cùng backend.

<a id="question-7"></a>

## 7. Controller là gì?

**Câu trả lời mẫu:** **Conclusion:** controller map transport request tới application operation. **Mechanism:** route decorator bind HTTP method và parameter vào class method. **Trade-off:** đặt business logic trong controller khiến khó test. **GameStream:** room controller validate command rồi delegate state change cho `RoomsService`.

<a id="question-8"></a>

## 8. Provider là gì?

**Câu trả lời mẫu:** **Conclusion:** provider là object do DI container của Nest quản lý. **Mechanism:** container resolve constructor dependency theo token. **Trade-off:** global provider ẩn làm ownership mơ hồ. **GameStream:** Mongo, Redis, memory cache và room service đều là injected provider.

<a id="question-9"></a>

## 9. Dependency injection là gì?

**Câu trả lời mẫu:** **Conclusion:** dependency injection cung cấp collaborator từ bên ngoài thay vì class tự khởi tạo. **Mechanism:** Nest map token tới provider instance. **Trade-off:** DI cải thiện substitution/testing nhưng lạm dụng làm call graph khó nhìn. **GameStream:** `RoomsService` nhận Mongo, Redis và memory cache qua constructor.

<a id="question-10"></a>

## 10. Middleware, guard và pipe khác nhau thế nào?

**Câu trả lời mẫu:** **Conclusion:** middleware xử lý request chung, guard quyết định quyền truy cập, pipe validate/transform argument. **Mechanism:** chúng chạy ở các stage khác nhau của request lifecycle. **Trade-off:** đặt concern sai stage gây duplication. **GameStream:** request context là middleware, JWT/role là guard, Zod parsing là pipe.

<a id="question-11"></a>

## 11. Interceptor và exception filter làm gì?

**Câu trả lời mẫu:** **Conclusion:** interceptor wrap execution cho cross-cutting behaviour; filter chuyển unhandled exception thành response. **Mechanism:** interceptor quan sát trước/sau observable hoặc promise. **Trade-off:** chain phức tạp khó debug. **GameStream:** admin auditing là interceptor, còn Nest map HTTP exception nhất quán.

<a id="question-12"></a>

## 12. Provider scope là gì?

**Câu trả lời mẫu:** **Conclusion:** scope điều khiển lifetime; singleton là mặc định của Nest. **Mechanism:** request/transient scope tạo nhiều instance hơn. **Trade-off:** request scope tăng allocation và có thể lan trong dependency graph. **GameStream:** Mongo và Redis client phải là singleton resource tái sử dụng giữa request.

<a id="question-13"></a>

## 13. Vì sao validate environment configuration lúc startup?

**Câu trả lời mẫu:** **Conclusion:** fail-fast validation ngăn service cấu hình thiếu nhận traffic. **Mechanism:** parse environment string thành typed object và từ chối URL, secret hoặc number sai. **Trade-off:** startup nghiêm ngặt giảm linh hoạt nhưng dễ chẩn đoán. **GameStream:** Zod validate port, origin và infrastructure endpoint trước khi boot.

<a id="question-14"></a>

## 14. Graceful shutdown là gì?

**Câu trả lời mẫu:** **Conclusion:** graceful shutdown dừng nhận việc mới và đóng resource sau khi xử lý in-flight work. **Mechanism:** bắt termination signal, đặt readiness false, stop consumer và close connection. **Trade-off:** cần timeout để shutdown không treo vô hạn. **GameStream:** worker dừng projection, producer, Kafka admin, Redis, Mongo và HTTP server.

<a id="question-15"></a>

## 15. Khi nào GameStream dùng HTTP, khi nào dùng Socket.IO?

**Câu trả lời mẫu:** **Conclusion:** HTTP hợp với command/query request-response có thể recover; Socket.IO hợp với live fan-out. **Mechanism:** HTTP trả authoritative response, socket push update cho client đang kết nối. **Trade-off:** realtime delivery cần reconnect logic. **GameStream:** room mutation dùng HTTP, sau đó room/chat event được broadcast qua Socket.IO.

## Bảng thuật ngữ kỹ thuật

| Technical term       | Nghĩa tiếng Việt           | Giải thích đơn giản                                                       |
| -------------------- | -------------------------- | ------------------------------------------------------------------------- |
| Node.js              | Môi trường chạy Node.js    | Runtime chạy JavaScript phía server dựa trên V8.                          |
| Event loop           | Vòng lặp sự kiện           | Cơ chế điều phối callback và I/O bất đồng bộ trên luồng JavaScript chính. |
| Asynchronous         | Bất đồng bộ                | Công việc có thể hoàn tất sau mà không chặn toàn bộ luồng hiện tại.       |
| Parallel             | Song song                  | Nhiều công việc thật sự chạy đồng thời trên nhiều core hoặc worker.       |
| Promise              | Đối tượng lời hứa          | Đại diện cho kết quả sẽ thành công hoặc thất bại trong tương lai.         |
| NestJS               | Framework NestJS           | Framework Node.js tổ chức backend theo module, controller và provider.    |
| Module               | Mô-đun                     | Nhóm capability và dependency có boundary rõ ràng.                        |
| Controller           | Bộ điều khiển              | Nhận request và chuyển việc xử lý cho application service.                |
| Provider             | Thành phần được cung cấp   | Object do dependency-injection container tạo và quản lý.                  |
| Dependency injection | Tiêm phụ thuộc             | Cung cấp dependency từ bên ngoài thay vì class tự khởi tạo.               |
| Middleware           | Phần mềm trung gian        | Logic chạy trong request pipeline trước handler.                          |
| Guard                | Bộ bảo vệ                  | Quyết định request hoặc socket có được phép đi tiếp hay không.            |
| Pipe                 | Bộ chuyển đổi và kiểm tra  | Transform hoặc validate input trước khi handler sử dụng.                  |
| Interceptor          | Bộ chặn                    | Bọc quanh handler để đo lường, biến đổi hoặc thêm hành vi dùng chung.     |
| Graceful shutdown    | Dừng hệ thống có kiểm soát | Ngừng nhận việc mới và hoàn tất hoặc đóng tài nguyên đang dùng.           |
