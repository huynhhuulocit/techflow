# Middle — Câu hỏi phỏng vấn TypeScript

## Mục lục câu hỏi

1. [Discriminated union cải thiện domain modelling như thế nào?](#question-1)
2. [Implement exhaustive checking thế nào?](#question-2)
3. [Generic constraint là gì?](#question-3)
4. [Utility type hữu ích khi nào?](#question-4)
5. [Mapped type và conditional type là gì?](#question-5)
6. [Variance là gì và vì sao quan trọng với callback?](#question-6)
7. [Operator `satisfies` cung cấp gì?](#question-7)
8. [Vì sao type assertion nguy hiểm?](#question-8)
9. [Type-only import hỗ trợ architecture thế nào?](#question-9)
10. [Vì sao workspace package nên phát hành declaration file?](#question-10)
11. [DTO type nên liên hệ runtime schema thế nào?](#question-11)
12. [Vì sao `useUnknownInCatchVariables` có giá trị?](#question-12)
13. [Khi nào trả result union thay vì throw?](#question-13)
14. [Immutable state hỗ trợ concurrent system thế nào?](#question-14)
15. [Guarantee TypeScript nào biến mất sau compilation?](#question-15)

<a id="question-1"></a>

## 1. Discriminated union cải thiện domain modelling như thế nào?

**Câu trả lời mẫu:** **Conclusion:** nó biểu diễn tập variant đóng cùng dữ liệu riêng của từng variant. **Mechanism:** literal property chung narrowing các field còn lại. **Trade-off:** thêm variant buộc mọi exhaustive consumer cập nhật. **GameStream:** integration event switch theo `type`, ngăn code đọc field không tồn tại trên event đó.

<a id="question-2"></a>

## 2. Implement exhaustive checking thế nào?

**Câu trả lời mẫu:** **Conclusion:** xử lý mọi union member rồi gán default branch vào `never`. **Mechanism:** khi thêm variant, giá trị default không còn narrowing thành `never`, tạo compile error. **Trade-off:** cách này tốt nhất cho union cố ý đóng. **GameStream:** projector có thể fail compilation khi room event mới chưa có projection handler.

<a id="question-3"></a>

## 3. Generic constraint là gì?

**Câu trả lời mẫu:** **Conclusion:** constraint giới hạn type argument được chấp nhận nhưng vẫn giữ khả năng tái sử dụng. **Mechanism:** `T extends { id: string }` cho phép generic code dùng `id` an toàn. **Trade-off:** constraint quá rộng ít an toàn, quá hẹp giảm reuse. **GameStream:** event utility có thể giới hạn input theo integration-event envelope chung.

<a id="question-4"></a>

## 4. Utility type hữu ích khi nào?

**Câu trả lời mẫu:** **Conclusion:** `Pick`, `Omit`, `Partial`, `Required`, `Readonly` và `Record` tạo shape liên quan từ một nguồn. **Mechanism:** mapped type biến đổi key và modifier. **Trade-off:** utility lồng sâu che mất API thật. **GameStream:** public room summary có thể được hình dung là dẫn xuất từ internal room document nhưng loại invite hash.

<a id="question-5"></a>

## 5. Mapped type và conditional type là gì?

**Câu trả lời mẫu:** **Conclusion:** mapped type biến đổi property; conditional type chọn type theo assignability. **Mechanism:** conditional type có thể distribute trên union và infer subtype. **Trade-off:** type program quá thông minh tăng chi phí compiler và người đọc. **GameStream:** map event-to-payload có thể tạo handler signature chính xác mà không viết nhiều overload.

<a id="question-6"></a>

## 6. Variance là gì và vì sao quan trọng với callback?

**Câu trả lời mẫu:** **Conclusion:** variance mô tả quan hệ subtype lan qua generic type thế nào. **Mechanism:** function parameter được kiểm tra contravariant trong strict mode, return type covariant. **Trade-off:** method bivariance và mutable container vẫn có soundness gap. **GameStream:** handler chỉ nhận `game.started` không thể đăng ký ở nơi có thể gửi mọi integration event.

<a id="question-7"></a>

## 7. Operator `satisfies` cung cấp gì?

**Câu trả lời mẫu:** **Conclusion:** `satisfies` kiểm tra compatibility mà không thay thế inferred type chi tiết của expression. **Mechanism:** nó validate value với target contract nhưng giữ literal key/value. **Trade-off:** nó không runtime validate. **GameStream:** configuration map có thể được kiểm tra đủ key mà vẫn giữ service name dạng hẹp.

<a id="question-8"></a>

## 8. Vì sao type assertion nguy hiểm?

**Câu trả lời mẫu:** **Conclusion:** assertion yêu cầu compiler tin developer, không chứng minh gì ở runtime. **Mechanism:** `value as RoomView` bỏ qua bằng chứng compatibility thông thường. **Trade-off:** assertion đôi khi cần ở library boundary đã audit. **GameStream:** JSON từ Redis nên được parse và validate tại boundary quan trọng thay vì cast mù.

<a id="question-9"></a>

## 9. Type-only import hỗ trợ architecture thế nào?

**Câu trả lời mẫu:** **Conclusion:** nó làm rõ compile-time dependency và tránh emitted import không mong muốn. **Mechanism:** TypeScript xoá `import type`. **Trade-off:** type không dùng được như runtime token. **GameStream:** web app phụ thuộc protocol shape dùng chung mà không vô tình import server implementation.

<a id="question-10"></a>

## 10. Vì sao workspace package nên phát hành declaration file?

**Câu trả lời mẫu:** **Conclusion:** `.d.ts` công bố public type contract cho consumer. **Mechanism:** `declaration` và `declarationMap` phát sinh signature và source mapping. **Trade-off:** mọi exported type trở thành phần phải quản lý compatibility. **GameStream:** domain và contracts build declaration trước backend, worker và web.

<a id="question-11"></a>

## 11. DTO type nên liên hệ runtime schema thế nào?

**Câu trả lời mẫu:** **Conclusion:** runtime schema nên định nghĩa hoặc được xác minh khớp boundary type. **Mechanism:** infer type từ Zod khi phù hợp rồi chỉ chuyển parsed value vào trong. **Trade-off:** framework metadata đôi khi cần class riêng và có nguy cơ drift. **GameStream:** Zod validation pipe bảo đảm controller input đạt command contract trước khi service chạy.

<a id="question-12"></a>

## 12. Vì sao `useUnknownInCatchVariables` có giá trị?

**Câu trả lời mẫu:** **Conclusion:** JavaScript có thể throw bất kỳ value nào, nên caught value không mặc nhiên là `Error`. **Mechanism:** `unknown` buộc kiểm tra `instanceof Error` hoặc guard trước khi đọc `.message`. **Trade-off:** handler dài hơn một chút. **GameStream:** worker có thể chuẩn hoá an toàn mọi thrown value khi log projection failure.

<a id="question-13"></a>

## 13. Khi nào trả result union thay vì throw?

**Câu trả lời mẫu:** **Conclusion:** dùng result union cho outcome domain dự kiến và exception cho infrastructure failure hoặc framework control flow. **Mechanism:** `{ ok: true, value } | { ok: false, error }` buộc caller branch. **Trade-off:** result plumbing khá dài. **GameStream:** domain transition có thể trả rule failure có type, còn Nest xử lý database failure bất ngờ như server error.

<a id="question-14"></a>

## 14. Immutable state hỗ trợ concurrent system thế nào?

**Câu trả lời mẫu:** **Conclusion:** immutable transition làm rõ state trước/sau và giảm side effect ẩn. **Mechanism:** function dựng object mới cùng event từ input state. **Trade-off:** copy tốn allocation và không thay thế database concurrency control. **GameStream:** pure dice transition kết hợp với expected-version update của MongoDB.

<a id="question-15"></a>

## 15. Guarantee TypeScript nào biến mất sau compilation?

**Câu trả lời mẫu:** **Conclusion:** mọi type annotation và phần lớn type-only construct đều biến mất. **Mechanism:** JavaScript runtime vẫn có thể gặp JSON sai, race hoặc service unavailable. **Trade-off:** runtime guard, test và operational control vẫn bắt buộc. **GameStream:** TypeScript không tự bảo đảm socket payload, JWT, MongoDB document hay Kafka event hợp lệ.

## Bảng thuật ngữ kỹ thuật

| Technical term      | Nghĩa tiếng Việt               | Giải thích đơn giản                                                            |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| Discriminated union | Kiểu hợp có trường phân biệt   | Union có một field chung giúp xác định chính xác từng biến thể.                |
| Exhaustive checking | Kiểm tra đầy đủ mọi trường hợp | Buộc code xử lý tất cả biến thể và phát hiện case bị bỏ sót.                   |
| Generic constraint  | Ràng buộc kiểu tổng quát       | Giới hạn những kiểu được phép truyền vào generic.                              |
| Utility type        | Kiểu tiện ích                  | Kiểu có sẵn như `Pick`, `Omit` hoặc `Partial` để biến đổi kiểu khác.           |
| Mapped type         | Kiểu ánh xạ                    | Tạo kiểu mới bằng cách duyệt qua các property của kiểu cũ.                     |
| Conditional type    | Kiểu có điều kiện              | Chọn kiểu kết quả dựa trên quan hệ kiểu ở compile time.                        |
| Variance            | Tính biến thiên kiểu           | Quy tắc xác định generic hoặc callback có thể thay thế nhau an toàn hay không. |
| Satisfies operator  | Toán tử kiểm tra thỏa mãn      | Kiểm tra một giá trị phù hợp contract mà vẫn giữ kiểu suy luận chi tiết.       |
| Type assertion      | Khẳng định kiểu                | Yêu cầu compiler tin developer mà không tạo kiểm tra runtime.                  |
| Declaration file    | Tệp khai báo kiểu              | File `.d.ts` mô tả public type cho JavaScript package.                         |
| DTO                 | Đối tượng truyền dữ liệu       | Cấu trúc dùng để trao đổi dữ liệu qua boundary như HTTP hoặc message.          |
| Runtime schema      | Lược đồ lúc chạy               | Schema có thể thật sự parse và validate dữ liệu khi chương trình chạy.         |
| Result union        | Kiểu hợp kết quả               | Biểu diễn success và failure thành các biến thể dữ liệu rõ ràng.               |
| Immutable state     | Trạng thái bất biến            | Trạng thái cũ không bị sửa trực tiếp mà được thay bằng giá trị mới.            |
| Type erasure        | Xóa thông tin kiểu             | Type annotation biến mất sau khi TypeScript được biên dịch thành JavaScript.   |
