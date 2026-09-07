# Junior — Câu hỏi phỏng vấn System Design và Pattern

## Mục lục câu hỏi

1. [System design là gì?](#question-1)
2. [Functional và non-functional requirement khác nhau thế nào?](#question-2)
3. [Modular monolith là gì?](#question-3)
4. [Microservice là gì?](#question-4)
5. [Domain model là gì?](#question-5)
6. [Aggregate là gì?](#question-6)
7. [Invariant là gì?](#question-7)
8. [Layered architecture là gì?](#question-8)
9. [Repository pattern là gì?](#question-9)
10. [Sync và async communication khác nhau thế nào?](#question-10)
11. [Stateless service là gì?](#question-11)
12. [Source of truth là gì?](#question-12)
13. [Eventual consistency là gì?](#question-13)
14. [CQRS là gì?](#question-14)
15. [Vì sao document architecture decision?](#question-15)

<a id="question-1"></a>

## 1. System design là gì?

**Câu trả lời mẫu:** **Conclusion:** map requirement thành component, data, communication và guarantee. **Mechanism:** bắt đầu từ use case/quality attribute. **Trade-off:** mọi design tối ưu constraint nào đó. **GameStream:** resume, chat, video dẫn tới component khác nhau.

<a id="question-2"></a>

## 2. Functional và non-functional requirement khác nhau thế nào?

**Câu trả lời mẫu:** **Conclusion:** functional là behaviour; non-functional là latency, availability, security. **Mechanism:** NFR đo được guide architecture. **Trade-off:** “fast/scalable” mơ hồ không test được. **GameStream:** resume cần window/SLO.

<a id="question-3"></a>

## 3. Modular monolith là gì?

**Câu trả lời mẫu:** **Conclusion:** một deployable có capability module rõ. **Mechanism:** in-process interface/ownership hạn chế coupling. **Trade-off:** module scale/deploy cùng. **GameStream:** Nest business modules trong một backend.

<a id="question-4"></a>

## 4. Microservice là gì?

**Câu trả lời mẫu:** **Conclusion:** independently deployable capability có ownership/data boundary. **Mechanism:** giao tiếp qua unreliable network. **Trade-off:** autonomy thêm distributed complexity. **GameStream:** container count không định nghĩa microservice.

<a id="question-5"></a>

## 5. Domain model là gì?

**Câu trả lời mẫu:** **Conclusion:** biểu diễn business concept/rule/transition độc lập transport/storage. **Mechanism:** command apply invariant và tạo outcome/event. **Trade-off:** modelling thêm upfront work. **GameStream:** dice domain không phụ thuộc Nest/Mongo.

<a id="question-6"></a>

## 6. Aggregate là gì?

**Câu trả lời mẫu:** **Conclusion:** consistency boundary thay đổi qua một root. **Mechanism:** command giữ invariant atomically. **Trade-off:** aggregate lớn tạo contention. **GameStream:** room/game versioned như một aggregate.

<a id="question-7"></a>

## 7. Invariant là gì?

**Câu trả lời mẫu:** **Conclusion:** điều luôn đúng sau valid transition. **Mechanism:** enforce trong domain và DB constraint. **Trade-off:** duplicate rule có thể drift. **GameStream:** chỉ owner start, current player roll.

<a id="question-8"></a>

## 8. Layered architecture là gì?

**Câu trả lời mẫu:** **Conclusion:** transport, application, domain, infrastructure có dependency direction. **Mechanism:** outer adapter gọi business inward. **Trade-off:** quá nhiều layer thêm ceremony. **GameStream:** controller/gateway delegate service/domain.

<a id="question-9"></a>

## 9. Repository pattern là gì?

**Câu trả lời mẫu:** **Conclusion:** ẩn persistence sau aggregate operation. **Mechanism:** application phụ thuộc port. **Trade-off:** generic CRUD che DB capability. **GameStream:** expose versioned transition, không arbitrary collection.

<a id="question-10"></a>

## 10. Sync và async communication khác nhau thế nào?

**Câu trả lời mẫu:** **Conclusion:** sync trả immediate result; async event decouple completion. **Mechanism:** HTTP command, Kafka fact. **Trade-off:** async thêm eventual consistency. **GameStream:** roll commit sync, projection async.

<a id="question-11"></a>

## 11. Stateless service là gì?

**Câu trả lời mẫu:** **Conclusion:** replica nào cũng serve vì durable/session truth external. **Mechanism:** local cache disposable. **Trade-off:** external store thêm latency. **GameStream:** Mongo/Redis shared; L1 optional.

<a id="question-12"></a>

## 12. Source of truth là gì?

**Câu trả lời mẫu:** **Conclusion:** authority giải quyết conflicting copy. **Mechanism:** cache/index rebuild từ nó. **Trade-off:** authority có thể chậm. **GameStream:** MongoDB quyết room version.

<a id="question-13"></a>

## 13. Eventual consistency là gì?

**Câu trả lời mẫu:** **Conclusion:** projection converge sau delay. **Mechanism:** event update read model async. **Trade-off:** UX/repair phải handle lag. **GameStream:** Elastic search lag room creation.

<a id="question-14"></a>

## 14. CQRS là gì?

**Câu trả lời mẫu:** **Conclusion:** tách write/read model khi nhu cầu khác. **Mechanism:** command update authority, event build projection. **Trade-off:** thêm consistency work. **GameStream:** Mongo command và Elastic search là CQRS-style.

<a id="question-15"></a>

## 15. Vì sao document architecture decision?

**Câu trả lời mẫu:** **Conclusion:** lưu context, option, trade-off. **Mechanism:** ADR ghi decision/status/consequence. **Trade-off:** doc stale gây hại. **GameStream:** docs song ngữ update cùng implementation.

## Bảng thuật ngữ kỹ thuật

| Technical term             | Nghĩa tiếng Việt               | Giải thích đơn giản                                                                     |
| -------------------------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| System design              | Thiết kế hệ thống              | Quá trình chọn component, data flow và guarantee để đáp ứng requirement.                |
| Functional requirement     | Yêu cầu chức năng              | Hệ thống phải làm được hành vi nào cho user.                                            |
| Non-functional requirement | Yêu cầu phi chức năng          | Mục tiêu như latency, availability, security và scale.                                  |
| Modular monolith           | Khối nguyên khối theo mô-đun   | Một deployment chứa nhiều module có boundary rõ.                                        |
| Microservice               | Dịch vụ vi mô                  | Service có capability, ownership và vòng đời deploy độc lập.                            |
| Domain model               | Mô hình miền nghiệp vụ         | Code và dữ liệu biểu diễn rule, entity và hành vi nghiệp vụ.                            |
| Aggregate                  | Cụm nhất quán                  | Nhóm entity được thay đổi qua một root để bảo vệ invariant.                             |
| Invariant                  | Bất biến nghiệp vụ             | Điều kiện luôn phải đúng trước và sau operation hợp lệ.                                 |
| Layered architecture       | Kiến trúc phân lớp             | Chia presentation, application, domain và infrastructure concern.                       |
| Repository pattern         | Mẫu kho dữ liệu                | Abstraction truy cập aggregate hoặc entity mà domain không phụ thuộc database chi tiết. |
| Synchronous communication  | Giao tiếp đồng bộ              | Caller chờ response trực tiếp trong cùng request.                                       |
| Asynchronous communication | Giao tiếp bất đồng bộ          | Caller và consumer được tách theo thời gian qua message/event.                          |
| Stateless service          | Dịch vụ không giữ phiên cục bộ | Request không phụ thuộc state chỉ tồn tại trong một instance.                           |
| Source of truth            | Nguồn dữ liệu chuẩn            | Nơi có thẩm quyền xác định state đúng.                                                  |
| CQRS                       | Tách lệnh và truy vấn          | Tách write model khỏi read model khi nhu cầu của chúng khác nhau.                       |
