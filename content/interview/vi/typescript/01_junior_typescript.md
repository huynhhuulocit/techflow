# Junior — Câu hỏi phỏng vấn TypeScript

## Mục lục câu hỏi

1. [TypeScript là gì và tại sao nên dùng?](#question-1)
2. [Compile-time validation khác runtime validation thế nào?](#question-2)
3. [Type inference là gì?](#question-3)
4. [Khi nào dùng `interface`, khi nào dùng `type`?](#question-4)
5. [Giải thích `any`, `unknown` và `never`.](#question-5)
6. [Union type là gì và được narrowing như thế nào?](#question-6)
7. [`null`, `undefined` và optional property khác nhau thế nào?](#question-7)
8. [Vì sao thường ưu tiên string-literal union hơn enum?](#question-8)
9. [`readonly` bảo đảm điều gì?](#question-9)
10. [Generic giải quyết vấn đề gì?](#question-10)
11. [Nên khai báo type cho `async` function thế nào?](#question-11)
12. [Structural typing là gì?](#question-12)
13. [ES module và type-only import là gì?](#question-13)
14. [Vì sao bật strict compiler options?](#question-14)
15. [Vì sao GameStream dùng cả TypeScript type và Zod schema?](#question-15)

<a id="question-1"></a>

## 1. TypeScript là gì và tại sao nên dùng?

**Câu trả lời mẫu:** **Conclusion:** TypeScript là JavaScript được bổ sung type system tại compile time. **Mechanism:** compiler kiểm tra type rồi phát sinh JavaScript; type bị xoá ở runtime. **Trade-off:** dự án phải thêm bước build và modelling nhưng phát hiện sớm nhiều lỗi tích hợp. **GameStream:** package domain và contract dùng chung giữ shape của room, command và event nhất quán giữa backend, worker và web.

<a id="question-2"></a>

## 2. Compile-time validation khác runtime validation thế nào?

**Câu trả lời mẫu:** **Conclusion:** TypeScript bảo vệ code compiler nhìn thấy, còn runtime validation bảo vệ dữ liệu thực sự đi vào process. **Mechanism:** JSON từ network là `unknown` cho tới khi được parser như Zod kiểm tra. **Trade-off:** runtime check tốn CPU và công bảo trì. **GameStream:** Zod kiểm tra payload HTTP và Socket.IO dù caller cũng dùng TypeScript type.

<a id="question-3"></a>

## 3. Type inference là gì?

**Câu trả lời mẫu:** **Conclusion:** type inference cho phép compiler suy ra type mà không cần annotation tường minh. **Mechanism:** nó dựa trên giá trị khởi tạo, control flow, function signature và contextual typing. **Trade-off:** inference giảm nhiễu, nhưng exported boundary nên có return type rõ ràng. **GameStream:** biến cục bộ trong transition được infer, còn service method công khai khai báo `Promise<RoomView>`.

<a id="question-4"></a>

## 4. Khi nào dùng `interface`, khi nào dùng `type`?

**Câu trả lời mẫu:** **Conclusion:** cả hai mô tả shape; `interface` phù hợp object contract có thể mở rộng, còn `type` mô tả thêm union, tuple và alias. **Mechanism:** interface hỗ trợ declaration merging; type alias kết hợp union và intersection. **Trade-off:** tính nhất quán quan trọng hơn tranh luận tuyệt đối. **GameStream:** event union dùng `type`, còn document hoặc view object có thể dùng interface.

<a id="question-5"></a>

## 5. Giải thích `any`, `unknown` và `never`.

**Câu trả lời mẫu:** **Conclusion:** `any` tắt kiểm tra, `unknown` bắt buộc chứng minh trước khi dùng, còn `never` biểu diễn giá trị không thể xảy ra. **Mechanism:** narrowing chuyển `unknown`; exhaustive switch đưa union đã xử lý hết về `never`. **Trade-off:** `any` tiện nhưng lan truyền mất an toàn. **GameStream:** caught error là `unknown`, còn `never` có thể xác minh đã xử lý mọi game event hoặc state.

<a id="question-6"></a>

## 6. Union type là gì và được narrowing như thế nào?

**Câu trả lời mẫu:** **Conclusion:** union cho phép một trong nhiều type; narrowing chứng minh member cụ thể. **Mechanism:** `typeof`, `in`, equality hoặc discriminant property làm hẹp type theo control flow. **Trade-off:** union rộng đòi hỏi xử lý kỷ luật. **GameStream:** discriminant `status` hoặc event `type` giúp branch an toàn giữa lobby, active, completed và cancelled.

<a id="question-7"></a>

## 7. `null`, `undefined` và optional property khác nhau thế nào?

**Câu trả lời mẫu:** **Conclusion:** `undefined` thường là chưa có/chưa khởi tạo, `null` là giá trị rỗng có chủ ý, còn `prop?: T` cho phép property vắng mặt. **Mechanism:** `strictNullChecks` cấm dùng chúng như `T`. **Trade-off:** convention không nhất quán làm API mơ hồ. **GameStream:** `turnDeadlineAt: null` nghĩa rõ là không có deadline; invite code optional chỉ được trả khi tạo.

<a id="question-8"></a>

## 8. Vì sao thường ưu tiên string-literal union hơn enum?

**Câu trả lời mẫu:** **Conclusion:** literal union thường mô hình protocol value với ít emitted code và JSON tự nhiên hơn. **Mechanism:** `'LOBBY' | 'ACTIVE'` chỉ tồn tại trong type system. **Trade-off:** enum hữu ích khi thực sự cần runtime namespace. **GameStream:** room/game status truyền dưới dạng JSON string ổn định nên literal union phù hợp.

<a id="question-9"></a>

## 9. `readonly` bảo đảm điều gì?

**Câu trả lời mẫu:** **Conclusion:** `readonly` chặn phép gán qua typed reference; nó không làm object immutable sâu ở runtime. **Mechanism:** compiler từ chối write vào property được đánh dấu. **Trade-off:** nested value vẫn cần modelling đệ quy hoặc kỷ luật immutable update. **GameStream:** domain transition trả state mới thay vì sửa state cũ.

<a id="question-10"></a>

## 10. Generic giải quyết vấn đề gì?

**Câu trả lời mẫu:** **Conclusion:** generic giữ quan hệ type giữa input và output trong khi tái sử dụng code. **Mechanism:** type parameter như `T` được chọn hoặc infer tại call site. **Trade-off:** generic quá trừu tượng làm code khó đọc. **GameStream:** `memoryCache.get<RoomSummary[]>()` trả đúng type cached value mà không cast ở mọi nơi.

<a id="question-11"></a>

## 11. Nên khai báo type cho `async` function thế nào?

**Câu trả lời mẫu:** **Conclusion:** `async` function luôn trả `Promise`, nên boundary rõ ràng có thể là `Promise<RoomView>`. **Mechanism:** return value được bọc và thrown error làm promise reject. **Trade-off:** quên `await` có thể tạo unhandled work hoặc race condition. **GameStream:** database transaction và cache invalidation được await trước khi command hoàn tất.

<a id="question-12"></a>

## 12. Structural typing là gì?

**Câu trả lời mẫu:** **Conclusion:** tính tương thích của TypeScript chủ yếu dựa trên member chứ không dựa vào danh tính class. **Mechanism:** value có đủ property bắt buộc sẽ thoả target shape. **Trade-off:** các ID có cùng cấu trúc dễ bị dùng nhầm. **GameStream:** plain room view đi qua package dễ dàng, nhưng branded type có thể phân biệt `RoomId` và `UserId` tốt hơn.

<a id="question-13"></a>

## 13. ES module và type-only import là gì?

**Câu trả lời mẫu:** **Conclusion:** module định nghĩa boundary của file; `import type` chỉ nhập thông tin compile time. **Mechanism:** type-only import bị xoá khỏi JavaScript output. **Trade-off:** trộn runtime và type import có thể tạo dependency hoặc cycle không cần thiết. **GameStream:** contract type dùng chung có thể được import mà không kéo theo runtime implementation.

<a id="question-14"></a>

## 14. Vì sao bật strict compiler options?

**Câu trả lời mẫu:** **Conclusion:** strict option biến các giả định thiếu an toàn thành compile error. **Mechanism:** `strictNullChecks`, `noImplicitAny`, `noUncheckedIndexedAccess` và `useUnknownInCatchVariables` tăng độ chặt của analysis. **Trade-off:** migration cần sửa nhiều lỗi hơn. **GameStream:** base config bật các flag này để mọi workspace có cùng safety baseline.

<a id="question-15"></a>

## 15. Vì sao GameStream dùng cả TypeScript type và Zod schema?

**Câu trả lời mẫu:** **Conclusion:** type bảo vệ quá trình phát triển nội bộ, còn schema bảo vệ external boundary. **Mechanism:** Zod parse runtime value rồi infer hoặc khớp static type. **Trade-off:** model trùng lặp có thể drift nếu không coi schema là nguồn của boundary. **GameStream:** command qua HTTP hoặc socket được parse trước khi vào domain transition có type.

## Bảng thuật ngữ kỹ thuật

| Technical term     | Nghĩa tiếng Việt        | Giải thích đơn giản                                                               |
| ------------------ | ----------------------- | --------------------------------------------------------------------------------- |
| TypeScript         | Ngôn ngữ TypeScript     | JavaScript được bổ sung hệ thống kiểu để phát hiện nhiều lỗi trước khi chạy.      |
| Compile time       | Thời điểm biên dịch     | Giai đoạn compiler phân tích và chuyển mã nguồn trước khi chương trình chạy.      |
| Runtime validation | Kiểm tra lúc chạy       | Kiểm tra dữ liệu thật khi chương trình đang hoạt động.                            |
| Type inference     | Suy luận kiểu           | Compiler tự xác định kiểu từ giá trị và cách sử dụng.                             |
| Interface          | Giao diện kiểu          | Khai báo hình dạng mà object hoặc class cần tuân theo.                            |
| Type alias         | Bí danh kiểu            | Đặt tên cho một kiểu, union hoặc cấu trúc phức tạp.                               |
| Any                | Kiểu bất kỳ             | Tắt phần lớn kiểm tra kiểu cho giá trị và làm giảm an toàn.                       |
| Unknown            | Kiểu chưa biết          | Buộc code kiểm tra giá trị trước khi sử dụng.                                     |
| Never              | Kiểu không thể xảy ra   | Biểu diễn giá trị không bao giờ tồn tại hoặc nhánh không thể tới.                 |
| Union type         | Kiểu hợp                | Cho phép một giá trị thuộc một trong nhiều kiểu đã liệt kê.                       |
| Type narrowing     | Thu hẹp kiểu            | Dùng điều kiện để compiler biết kiểu cụ thể hơn.                                  |
| Optional property  | Thuộc tính tùy chọn     | Thuộc tính có thể không xuất hiện trong object.                                   |
| Readonly           | Chỉ đọc                 | Ngăn gán lại qua type ở compile time, không tự đóng băng object lúc chạy.         |
| Generic            | Kiểu tổng quát          | Viết code tái sử dụng mà vẫn giữ quan hệ kiểu giữa input và output.               |
| Structural typing  | Định kiểu theo cấu trúc | Hai giá trị tương thích khi hình dạng của chúng phù hợp, không cần cùng tên kiểu. |
