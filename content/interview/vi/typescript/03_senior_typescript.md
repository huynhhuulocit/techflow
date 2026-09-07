# Senior — Câu hỏi phỏng vấn TypeScript

## Mục lục câu hỏi

1. [TypeScript có sound hoàn toàn không?](#question-1)
2. [Thiết kế boundary đáng tin cậy từ untyped data thế nào?](#question-2)
3. [Shared event contract nên evolve thế nào?](#question-3)
4. [Có nên dùng branded identifier không?](#question-4)
5. [Làm sao để type khiến illegal game state khó biểu diễn?](#question-5)
6. [TypeScript có giải quyết concurrency correctness không?](#question-6)
7. [Nên cấu trúc TypeScript monorepo lớn thế nào?](#question-7)
8. [Kiểm soát TypeScript compiler performance thế nào?](#question-8)
9. [Compatibility contract của exported type là gì?](#question-9)
10. [Rủi ro của decorator metadata là gì?](#question-10)
11. [CommonJS và ESM khác nhau ảnh hưởng architecture thế nào?](#question-11)
12. [Dual-package hazard là gì?](#question-12)
13. [Tách domain type khỏi transport type thế nào?](#question-13)
14. [Compile-time test nên kiểm tra gì?](#question-14)
15. [Migrate JavaScript service sang strict TypeScript thế nào?](#question-15)

<a id="question-1"></a>

## 1. TypeScript có sound hoàn toàn không?

**Câu trả lời mẫu:** **Conclusion:** không; TypeScript chủ ý ưu tiên JavaScript ergonomics và gradual adoption hơn proof-level soundness. **Mechanism:** assertion, `any`, array covariance, external data chưa kiểm tra và một số callback rule có thể phá giả định. **Trade-off:** interoperability thực dụng đổi lấy guarantee không tuyệt đối. **GameStream:** strict setting giảm gap, còn Zod và database invariant bảo vệ runtime boundary.

<a id="question-2"></a>

## 2. Thiết kế boundary đáng tin cậy từ untyped data thế nào?

**Câu trả lời mẫu:** **Conclusion:** nhận dữ liệu dưới dạng `unknown`, parse một lần và chỉ đưa validated domain type vào trong. **Mechanism:** schema kiểm tra shape, bound và discriminant rồi trả typed value hoặc structured error. **Trade-off:** validation tốn latency và cần schema evolution. **GameStream:** HTTP, socket, OAuth token và Kafka event đều cần anti-corruption boundary rõ ràng.

<a id="question-3"></a>

## 3. Shared event contract nên evolve thế nào?

**Câu trả lời mẫu:** **Conclusion:** dùng envelope có identity ổn định và schema version tường minh; thay đổi additive tương thích hoặc phát hành version mới. **Mechanism:** consumer validate version và chỉ bỏ qua optional addition đã quy ước. **Trade-off:** mang nhiều version tăng độ phức tạp vận hành. **GameStream:** `schemaVersion`, event ID, aggregate version, correlation ID và versioned Kafka topic hỗ trợ evolution.

<a id="question-4"></a>

## 4. Có nên dùng branded identifier không?

**Câu trả lời mẫu:** **Conclusion:** nên dùng khi nhầm lẫn các primitive ID cùng cấu trúc là defect thực tế. **Mechanism:** intersect string với phantom marker duy nhất và tạo value qua validated constructor. **Trade-off:** serialization boundary phải brand lại. **GameStream:** brand có thể ngăn truyền `UserId` vào vị trí cần `RoomId` hoặc `GameId`.

<a id="question-5"></a>

## 5. Làm sao để type khiến illegal game state khó biểu diễn?

**Câu trả lời mẫu:** **Conclusion:** mô hình game bằng discriminated state machine thay vì object có nhiều nullable field. **Mechanism:** mỗi status variant chỉ chứa field hợp lệ cho phase đó. **Trade-off:** transition và persistence mapping rõ nhưng dài hơn. **GameStream:** chỉ `ACTIVE` cần current player và turn deadline; `COMPLETED` phải có winner.

<a id="question-6"></a>

## 6. TypeScript có giải quyết concurrency correctness không?

**Câu trả lời mẫu:** **Conclusion:** không; nó mô hình command và version nhưng không enforce ordering xuyên process. **Mechanism:** guarantee đến từ atomic database filter, transaction, idempotency key và broker semantics. **Trade-off:** encode version trong type vẫn làm protocol khó bị dùng sai. **GameStream:** `expectedVersion` có type, nhưng conditional update của MongoDB mới thực sự ngăn lost update.

<a id="question-7"></a>

## 7. Nên cấu trúc TypeScript monorepo lớn thế nào?

**Câu trả lời mẫu:** **Conclusion:** định nghĩa package không cyclic, public API hẹp và build/test boundary độc lập. **Mechanism:** project reference hoặc workspace build order tạo declaration cho application tiêu thụ. **Trade-off:** quá nhiều package gây overhead release/tooling. **GameStream:** domain và contracts là shared package; backend, worker, web và bot runner là consumer riêng.

<a id="question-8"></a>

## 8. Kiểm soát TypeScript compiler performance thế nào?

**Câu trả lời mẫu:** **Conclusion:** đo trước, rồi giảm union khổng lồ, recursive conditional type, duplicate compilation và public surface quá lớn. **Mechanism:** incremental/project build và declaration boundary tránh recheck toàn bộ. **Trade-off:** type đơn giản hơn có thể giảm độ chính xác compile time. **GameStream:** contract tường minh và domain package nhỏ giá trị hơn type-level program quá phức tạp.

<a id="question-9"></a>

## 9. Compatibility contract của exported type là gì?

**Câu trả lời mẫu:** **Conclusion:** exported type là API surface; thêm required property hoặc thu hẹp accepted input có thể phá consumer dù runtime vẫn chạy. **Mechanism:** declaration file tham gia semantic versioning và consumer compilation. **Trade-off:** export internal type quá mức làm implementation bị đóng băng. **GameStream:** chỉ command, event và view contract có chủ ý mới nên ra khỏi shared package.

<a id="question-10"></a>

## 10. Rủi ro của decorator metadata là gì?

**Câu trả lời mẫu:** **Conclusion:** decorator metadata hỗ trợ reflection nhưng tạo runtime coupling và không giữ rich TypeScript type. **Mechanism:** emitted metadata thường chỉ ghi constructor-level type, không ghi union hay generic argument. **Trade-off:** decorator tiện cho framework nhưng vẫn cần explicit schema. **GameStream:** Nest DI dùng decorator, còn Zod validate payload chi tiết.

<a id="question-11"></a>

## 11. CommonJS và ESM khác nhau ảnh hưởng architecture thế nào?

**Câu trả lời mẫu:** **Conclusion:** module format thay đổi resolution, loading, interop, top-level feature và package publishing. **Mechanism:** CommonJS dùng `require`, ESM dùng static import và package/module rule. **Trade-off:** dual support có thể gây duplicate module và default import khó hiểu. **GameStream:** server compile CommonJS, Vite web là ESM, nên shared package phải có output tương thích.

<a id="question-12"></a>

## 12. Dual-package hazard là gì?

**Câu trả lời mẫu:** **Conclusion:** khi CommonJS và ESM load hai bản của cùng package, hệ thống có hai identity và singleton state tách biệt. **Mechanism:** resolution path khác nhau chọn export khác nhau. **Trade-off:** conditional export tăng compatibility nhưng cần test. **GameStream:** infrastructure client có state không được vô tình instantiate từ hai module copy.

<a id="question-13"></a>

## 13. Tách domain type khỏi transport type thế nào?

**Câu trả lời mẫu:** **Conclusion:** transport DTO biểu diễn wire compatibility; domain type biểu diễn business invariant. **Mechanism:** adapter validate/map DTO thành domain command rồi map result thành view. **Trade-off:** mapping code thêm công nhưng ngăn HTTP, Socket.IO hoặc Kafka concern làm bẩn game model. **GameStream:** pure game package không nên phụ thuộc Nest, MongoDB hay Socket.IO type.

<a id="question-14"></a>

## 14. Compile-time test nên kiểm tra gì?

**Câu trả lời mẫu:** **Conclusion:** kiểm tra public type relationship quan trọng và expected failure, không test chi tiết compiler. **Mechanism:** type-test file dùng assignability assertion hoặc expected-error cùng runtime test. **Trade-off:** type test giòn cản refactor. **GameStream:** test có thể bảo đảm mọi event có handler và private document field không lọt vào public room view.

<a id="question-15"></a>

## 15. Migrate JavaScript service sang strict TypeScript thế nào?

**Câu trả lời mẫu:** **Conclusion:** migrate theo boundary và risk, siết flag dần đồng thời cấm unsafe code mới. **Mechanism:** external input là `unknown`, thêm schema, annotate public API, bỏ `any`, rồi bật strict check. **Trade-off:** flag-day rewrite làm chậm giá trị và che behavioural regression. **GameStream:** domain contract và critical persistence command nên được harden trước module chỉ liên quan UI.

## Bảng thuật ngữ kỹ thuật

| Technical term          | Nghĩa tiếng Việt                | Giải thích đơn giản                                                        |
| ----------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| Type soundness          | Tính đúng đắn của hệ thống kiểu | Mức độ mà kết luận của type system luôn đúng với hành vi runtime.          |
| Trust boundary          | Ranh giới tin cậy               | Điểm dữ liệu đi từ nguồn chưa tin cậy vào phần code được tin cậy.          |
| Untyped data            | Dữ liệu chưa có kiểu đáng tin   | Dữ liệu bên ngoài chưa được kiểm tra về shape và constraint.               |
| Contract evolution      | Tiến hóa hợp đồng               | Thay đổi schema hoặc type mà vẫn quản lý tương thích với consumer cũ.      |
| Branded type            | Kiểu có nhãn định danh          | Gắn dấu ở type level để các giá trị cùng kiểu nền không bị dùng lẫn.       |
| Illegal state           | Trạng thái không hợp lệ         | Tổ hợp dữ liệu vi phạm quy tắc nghiệp vụ và không nên biểu diễn được.      |
| Concurrency correctness | Tính đúng đắn khi đồng thời     | Bảo đảm kết quả đúng khi nhiều thao tác xảy ra cùng lúc.                   |
| Monorepo                | Kho mã nguồn đơn                | Một repository chứa nhiều application hoặc package có liên hệ.             |
| Compiler performance    | Hiệu năng trình biên dịch       | Thời gian và bộ nhớ TypeScript cần để kiểm tra và build project.           |
| Compatibility contract  | Hợp đồng tương thích            | Cam kết public type nào consumer có thể tiếp tục phụ thuộc.                |
| Decorator metadata      | Siêu dữ liệu decorator          | Thông tin runtime sinh từ decorator và reflection.                         |
| CommonJS                | Hệ module CommonJS              | Cơ chế module Node.js truyền thống dựa trên `require` và `module.exports`. |
| ECMAScript module       | Hệ module ECMAScript            | Chuẩn module JavaScript dùng `import` và `export`.                         |
| Dual-package hazard     | Rủi ro package hai định dạng    | Cùng package bị load thành hai instance qua CommonJS và ESM.               |
| Transport type          | Kiểu dữ liệu tầng truyền tải    | Kiểu mô tả dữ liệu trên wire, tách khỏi domain type.                       |
