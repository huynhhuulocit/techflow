# Soạn câu hỏi song ngữ và AI simulation

Tài liệu này mô tả baseline authoring của TechFlow. Đây là công cụ dành cho người biên soạn nội dung khi chạy local; nó không biến Question Bank thành một hệ thống CMS public và không tự động công bố nội dung do AI tạo.

## Phạm vi hiện tại

- Vietnamese (`vi`) vẫn là ngôn ngữ mặc định.
- Question Bank gốc vẫn giữ nguyên 585 câu Vietnamese được import từ GameStream.
- English (`en`) là pilot gồm 45 câu TypeScript có cùng `questionId` với bản Vietnamese.
- Nếu một câu chưa có bản English, UI không âm thầm hiển thị Vietnamese thay thế. Bộ đếm phải thể hiện rõ phạm vi English hiện có.
- Question Studio lưu draft trong browser local. Draft không được trộn vào snapshot generated hoặc nội dung đã publish.
- Ba tác vụ AI được hỗ trợ: tạo question draft, tạo simulation schema v1 từ một question draft, và tạo lesson-bound simulation schema v2 từ một rich lesson.

## Mô hình dữ liệu và trạng thái review

Bản dịch English là overlay theo `questionId`; nó không sao chép metadata nguồn và không thay đổi ID hoặc thứ tự của bản Vietnamese. Mỗi bản dịch giữ `translatedFromHash` để phát hiện khi nội dung nguồn đã đổi.

Các trạng thái quan trọng:

- `imported-needs-review`: câu Vietnamese parse hợp lệ nhưng chưa được technical review.
- `ai-translated-needs-review`: bản English là bản dịch pilot chưa qua language review; technical review của câu nguồn được theo dõi riêng.
- `draft-needs-review`: draft được nhập tay hoặc import.
- `generated-needs-review`: question/simulation do AI tạo; tuyệt đối không đồng nghĩa với verified.
- `reviewed`: chỉ dùng khi có reviewer, timestamp, evidence và content hash hợp lệ.

## Question Studio

Question Studio hỗ trợ:

1. Nhập tay locale, topic, level và bốn learning blocks.
2. Import JSON theo schema draft hoặc import Markdown dùng các marker `Conclusion`, `Mechanism`, `Trade-off`, `GameStream`.
3. Cảnh báo câu trùng hoặc gần trùng trước khi lưu.
4. Copy một câu đã localized từ Question Bank thành unsaved draft mà không sửa câu nguồn.
5. Export các draft đã lưu cùng nội dung form hiện tại nếu hợp lệ thành JSON để review hoặc đưa vào workflow khác.
6. Tạo question draft bằng AI khi local author API đã được cấu hình.
7. Tạo simulation draft cho câu đang chọn và preview bằng deterministic player.

Storage có version riêng. Locale dùng `localStorage["techflow.locale"]`, draft dùng `localStorage["techflow.author.question-drafts.v1"]`, còn token chỉ được ghi vào `sessionStorage["techflow.author.token.v1"]` sau khi người soạn bấm **Giữ token trong tab**. Nếu browser chặn storage, dữ liệu hỏng hoặc vượt quota, UI phải báo lỗi rõ ràng và không âm thầm ghi đè dữ liệu còn lại.

Question batch do AI tạo được append vào local draft storage sau validation và duplicate check. Simulation vừa generate chỉ được attach vào form chưa lưu và cần bấm Save rõ ràng. TechFlow gỡ simulation khi generation input hoặc source binding của nó đã stale.

## Lesson Simulation Studio — Phase 3

Rich lesson có một author panel riêng ngay trên simulation đang áp dụng. Panel chỉ xuất hiện trong development hoặc khi production build được bật rõ ràng bằng `VITE_ENABLE_AUTHOR_STUDIO=true`; legacy lesson không có tool này.

Luồng authoring:

1. Chọn `Sequence`, `Flow` hoặc `State machine`, rồi mô tả failure/what-if cần kiểm tra nếu có.
2. **Generate preview** gửi exact claim-bearing lesson source tới local Author API. Simulation đang áp dụng không đổi trong lúc chờ hoặc khi request lỗi.
3. Server tự gắn ID, source hash, `generated-needs-review` và AI provenance. Browser kiểm tra lại schema v2, locale, slug, source hash, actor topology, generation input hash, full snapshots và invariants trước khi hiển thị.
4. Preview dùng cùng deterministic player với learner view. **Generate lại** chỉ thay preview sau khi response mới vượt qua validation; response cũ hoặc trả về trễ bị bỏ qua. Nếu đổi kind/failure settings sau khi generate, Apply/Export của candidate cũ bị khóa cho tới khi settings được hoàn nguyên hoặc preview được generate lại.
5. **Apply locally** ghi một local override vào `localStorage["techflow.author.lesson-simulation-drafts.v1"]`. Đây chỉ là preview trên browser hiện tại, không sửa `lessons.ts`, không publish và không đánh dấu technical review.
6. Local override đã apply vẫn có thể export sau reload. **Khôi phục bản repository** và **Xóa local draft stale** đều yêu cầu xác nhận vì sẽ xóa dữ liệu browser. **Bỏ preview** chỉ bỏ candidate chưa apply. **Export JSON** xuất candidate hợp lệ để review/check-in thủ công.

Store tách entries bằng `locale + slug`, giữ tối đa 24 entries và không chứa Author Token. Nếu lesson source đổi, local draft cũ được giữ cho recovery/export nhưng bị fail closed: player không được chạy draft stale. Nếu envelope local bị corrupt/khác version, UI cho tải raw recovery trước khi explicit reset riêng key này; không tự ghi đè. VI và EN được generate độc lập; trước khi check-in cả hai bản phải qua technical/language review và kiểm tra parity về actor IDs, scenario/transition topology, state keys và invariant semantics.

## Kiến trúc AI local

```text
Question Studio hoặc Lesson Simulation Studio
  -> same-origin POST + local author token
  -> Vite development middleware
  -> OpenAI Responses API + Structured Outputs
  -> schema validation + semantic validation
  -> local draft marked generated-needs-review
  -> human review
```

API key, model và author token chỉ được đọc bởi development server. Không dùng prefix `VITE_` cho các secret vì biến có prefix đó có thể được bundle vào frontend.

Tạo file `.env.local` từ `.env.example`:

```dotenv
VITE_ENABLE_AUTHOR_STUDIO=false
OPENAI_API_KEY=<server-only-key>
OPENAI_MODEL=<model-supporting-structured-outputs>
TECHFLOW_AUTHOR_TOKEN=<long-random-local-token>
```

Khởi động lại `npm run dev` sau khi đổi env. Author token được nhập trong Studio; trước khi bấm **Giữ token trong tab**, nó chỉ tồn tại trong form memory. Không đặt API key vào Studio.

Studio tự xuất hiện khi chạy development. Giá trị `false` là default an toàn cho production build; flag này chỉ điều khiển UI visibility ở production chứ không provision API. Hãy coi generation brief, source notes, các question title hiện có, toàn bộ four-layer content của câu hiện tại, exact claim-bearing rich lesson source và failure-scenario text là dữ liệu được gửi tới external AI provider. Không đưa password, token, customer data hoặc secret vào các trường này.

Các endpoint local:

```text
POST /api/author/questions/generate
POST /api/author/simulations/generate
POST /api/author/lesson-simulations/generate
```

Middleware giới hạn loopback và same-origin request, yêu cầu JSON cùng author token, giới hạn body 32 KiB, tối đa năm request trong mười phút theo client/token, chỉ một generation đang chạy và timeout upstream 30 giây. Nếu thiếu một trong ba biến server, endpoint trả `ai_not_configured` và local draft hiện có vẫn được giữ nguyên.

Các endpoint này chỉ tồn tại với Vite development server. `npm run preview` phục vụ production bundle tĩnh và không cung cấp AI author API. Khi triển khai production, cần một authenticated server route, secret manager, quota/billing policy và audit log riêng; không được expose development middleware ra Internet.

## Simulation an toàn và có ý nghĩa học tập

AI chỉ trả phần instructional payload gồm actors, state fields, scenarios, state snapshots, transitions và invariants. Với lesson schema v2, ID, source binding, lifecycle và provenance đều do server gắn; provider không được tự khai báo các field này. Renderer của TechFlow quyết định toàn bộ HTML/CSS và chuyển trạng thái. Schema không expose field cho executable markup, URL, tọa độ hoặc style; mọi string do AI tạo đều được render như text. Để giữ latency và chi phí có giới hạn, AI draft bị giới hạn tối đa 2 scenarios, 6 state fields và 6 transitions cho mỗi scenario; nội dung check-in thủ công vẫn tuân theo runtime schema và review workflow riêng.

Một simulation hợp lệ cần:

- đúng một happy path;
- actor reference và highlight reference tồn tại;
- full snapshot dùng cùng state keys qua từng transition;
- invariant trỏ tới state key có thật;
- mọi invariant đều pass ở terminal snapshot của happy path;
- failure scenario không kết thúc ở `success`;
- learning objective, misconception và takeaway rõ ràng;
- badge `generated-needs-review` cho đến khi có evidence/review pass.

Player phải dùng được bằng keyboard, có Step/Back/Play/Pause/Reset, transcript đọc được khi không chạy animation và tôn trọng `prefers-reduced-motion`.

## Validation trước khi merge

```bash
npm run content:check
npm run content:validate
npm test
npm run lint
npm run build
```

Sau đó kiểm tra trong browser:

1. Chuyển VI/EN và reload để xác nhận locale được lưu.
2. Xác nhận VI có 585 câu, English pilot có 45 câu TypeScript và không fallback.
3. Tạo, sửa, xóa, export và import draft; reload để xác nhận persistence.
4. Thử AI khi chưa cấu hình để xác nhận lỗi không làm mất draft.
5. Nếu có key test, kiểm tra output vẫn là draft, đúng schema và mở được trong simulation player.
6. Kiểm tra keyboard, reduced motion, mobile layout và browser console.
7. Trên rich lesson, kiểm tra Generate → Preview → Apply locally → reload → Restore; xác nhận repository content không đổi.
8. Đổi locale hoặc source trong lúc request đang chạy để xác nhận late response/stale local draft không được phát.
