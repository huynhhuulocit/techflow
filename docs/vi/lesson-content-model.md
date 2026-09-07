# Mô hình nội dung bài học

Tài liệu này mô tả contract cho bài học giàu nội dung của TechFlow. Phase 1 hoàn thiện nội dung và trạng thái review; Phase 2 gắn interactive simulation vào đúng lesson version.

## Ba lớp học bắt buộc

Một bài học mới hoặc bài học được đánh dấu hoàn chỉnh phải có đủ:

1. **Trả lời nhanh**: câu trả lời phỏng vấn ngắn, trực tiếp và đủ điều kiện áp dụng.
2. **Hiểu bản chất**: giải thích actor, dữ liệu, trạng thái và thứ tự của cơ chế; không chỉ lặp lại định nghĩa.
3. **Production trade-offs**: nêu lợi ích, chi phí, failure mode và điều kiện lựa chọn trong hệ thống thật.

`appliedExample` và `misconceptions` hỗ trợ ba lớp trên: ví dụ phải làm rõ cơ chế; misconception phải nêu claim sai và correction cụ thể. Chúng không thay thế production trade-offs.

Contract Phase 1 giữ `shortAnswer` làm quick layer và đặt phần còn lại trong optional `LessonContent`:

| Field | Trách nhiệm |
| --- | --- |
| `scope` | Giới hạn product/version/context để tránh biến một flow cụ thể thành quy luật chung. |
| `mentalModel` | Tóm tắt cách các thành phần liên hệ với nhau trước khi đi vào chi tiết. |
| `conceptualExplanation` | Giải thích cơ chế và quan hệ giữa các actor/state. |
| `actors` | Các actor có `id`, label và responsibility rõ ràng. |
| `mechanism` | Các bước có thứ tự, tham chiếu một `actorId` hợp lệ và giải thích điều gì xảy ra. |
| `productionTradeOffs` | Mỗi trade-off nêu title, benefit, cost và decision rule. |
| `appliedExample` | Một flow cụ thể gồm label, summary và các steps. |
| `misconceptions` | Các cặp `claim`/`correction`. |
| `evidence` | Các nguồn hỗ trợ trực tiếp cho technical claims. |

Rich `Lesson` dùng `reviewStatus` làm technical-review discriminant ở lesson level: `draft-needs-review` không có `review`; khi trạng thái là `reviewed`, `review` metadata là bắt buộc. `shortAnswer` không bị sao chép vào `content`, nhưng vẫn nằm trong review hash của toàn lesson.

## Compatibility trong giai đoạn chuyển đổi

Rich content là optional trong shared `Lesson` schema để các lesson legacy vẫn render được trong lúc migrate. Optional là compatibility boundary, không phải tiêu chuẩn publish:

- lesson legacy có thể tiếp tục dùng `shortAnswer`, `workflow` và `followUps`;
- renderer chỉ hiển thị rich sections khi dữ liệu tương ứng tồn tại;
- lesson mới không được dùng generic overview hoặc empty workflow như nội dung hoàn chỉnh;
- thiếu rich content phải được thể hiện là nội dung chưa hoàn thiện, không được ngầm coi là đã review.

Không tạo schema hoặc component riêng cho một topic. Mọi lesson dùng contract chung trong `src/content/types.ts`.

## Evidence và review

Technical claim do người viết, import hoặc AI tạo đều cần evidence/review pass trước khi được xem là verified. Evidence nằm cùng rich content để người đọc truy vết claim; metadata review cần gắn với đúng content version và gồm:

- review status;
- reviewer và thời điểm review;
- danh sách evidence có label và URL;
- content hash để phát hiện nội dung thay đổi sau review.

Trạng thái `reviewed` chỉ hợp lệ khi metadata đầy đủ và `review.contentHash` còn khớp với canonical hash của toàn bộ claim-bearing lesson. `lessonContentHash` bao phủ title, short answer, taxonomy, rich content, workflow và follow-ups; validator loại review metadata, progress và featured state. Nếu nội dung thay đổi, prebuild validation sẽ thất bại cho tới khi bài học được review lại. AI output luôn bắt đầu ở needs-review; evidence URL không tự biến output thành verified.

Ưu tiên official documentation hoặc source code tương ứng với version đang mô tả. Phân biệt rõ fact có evidence, applied example và inference của người biên soạn.

## Parity Vietnamese và English

Vietnamese là nội dung mặc định. Hai locale dùng cùng `slug` và phải giữ structural parity:

- cùng các rich-content blocks và cùng thứ tự trade-off/misconception;
- cùng applied example, follow-up intent và evidence scope;
- không âm thầm fallback sang locale còn lại khi thiếu block;
- technical review và translation review là hai kiểm tra riêng. Rich English lesson dùng `translationStatus`, `translatedFromHash` và `translationReview`; source hash stale hoặc translated content thay đổi sau review đều làm validation thất bại.

Text không cần dịch từng chữ, nhưng không được thêm hoặc bỏ technical claim giữa hai locale. Technical terms nên giữ bằng English khi bản dịch làm giảm độ chính xác.

## Phase 2: lesson-bound simulation

Rich lesson có thể gắn `LessonSimulationSpec` schema v2. Contract này dùng chung deterministic playback model với Question Studio nhưng có source và provenance phù hợp với lesson:

- `source.kind = lesson`, `source.slug` và `source.contentHash` liên kết simulation với đúng narrative lesson version;
- `provenance` phân biệt bản biên soạn và AI-generated content, không bắt manual content giả làm AI output;
- `stateFields` cung cấp label/description theo locale cho các machine state keys;
- `scenarios`, full state snapshots, transitions và invariants vẫn được validator kiểm tra chặt; terminal state của failure scenario phải vi phạm ít nhất một invariant để failure được chứng minh bằng machine state;
- `status` và `review` thuộc simulation lifecycle riêng, không tự nâng lesson sang `reviewed`.

`lessonContentHash` cố ý không chứa `simulation` để tránh vòng lặp hash. Validator so sánh `simulation.source.contentHash` với narrative hash hiện tại; khi title, quick answer, rich content hoặc follow-up thay đổi, simulation trở thành stale và UI fail closed. Simulation review hash bao phủ source binding, state metadata, playback content và provenance.

Question Studio tiếp tục dùng question-bound schema v1 để không phá các draft đang lưu và chủ động reject schema v2 tại validation/storage boundary. PWA Kit là lesson đầu tiên dùng schema v2 với ba scenario deterministic: cache miss qua SSR/hydration/Add to Cart, cache hit và failure do personalized output bị tái sử dụng qua shared cache. Cả VI/EN phải giữ cùng actor IDs, scenario/transition topology, machine snapshots và invariant semantics.

Phase 3 thêm AI Simulation Studio cho rich lesson nhưng không thay đổi publication boundary. Server nhận exact claim-bearing lesson source, tự xác minh source hash và chỉ trả schema v2 ở trạng thái `generated-needs-review`. Preview có thể được apply thành local browser override hoặc export JSON; không action nào tự sửa lesson registry hay tạo review metadata. Draft local stale được giữ để recovery nhưng không được player chạy.

Trong playback, actor có bốn learning states: `waiting`, `active`, `visited` khi đã tham gia nhưng còn quay lại, và `complete` chỉ sau transition cuối cùng của actor. Khi scenario kết thúc, actor chưa từng xuất hiện được trình bày là không tham gia thay vì đã hoàn tất. Reduced motion tắt autoplay nhưng giữ Step/Back; state descriptions phải duy trì contrast đọc được.

Simulation chỉ minh họa claim đã có trong rich lesson. Nó không được chạy executable markup, tự đánh dấu verified hoặc biến cache/personalization policy cụ thể thành quy luật chung.

## Checklist authoring và merge

- Cả ba learning layers đều topic-specific và không còn placeholder.
- Misconception có correction; applied example giải thích một flow cụ thể.
- Trade-offs nêu cả lợi ích và chi phí/failure mode.
- VI/EN có cùng `slug`, cấu trúc và claim scope.
- Evidence hỗ trợ trực tiếp cho các claim quan trọng.
- Lesson simulation khớp source slug/hash, locale và bilingual machine topology.
- Review metadata chỉ xuất hiện khi review thật sự hoàn tất.
- Lesson legacy vẫn render mà không lỗi trong giai đoạn migrate.
- Chạy `npm run content:check`, `npm run content:validate`, `npm run lessons:validate`, `npm test`, `npm run lint`, `npm run build` và `npm run test:browser` trước khi merge. `npm run build` tự chạy lesson validation qua prebuild hook; browser smoke check chạy Vite ở port cô lập `4173` và kiểm tra lesson navigation trên desktop/mobile.
