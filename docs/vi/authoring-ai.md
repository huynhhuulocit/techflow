# Soạn câu hỏi song ngữ và AI simulation

Tài liệu này mô tả baseline authoring của TechFlow. Đây là công cụ dành cho người biên soạn nội dung khi chạy local; nó không biến Question Bank thành một hệ thống CMS public và không tự động công bố nội dung do AI tạo.

## Phạm vi hiện tại

- Vietnamese (`vi`) vẫn là ngôn ngữ mặc định.
- Question Bank gốc vẫn giữ nguyên 585 câu Vietnamese được import từ GameStream.
- English (`en`) là pilot gồm 45 câu TypeScript có cùng `questionId` với bản Vietnamese.
- Nếu một câu chưa có bản English, UI không âm thầm hiển thị Vietnamese thay thế. Bộ đếm phải thể hiện rõ phạm vi English hiện có.
- Question Studio lưu draft trong browser local. Draft không được trộn vào snapshot generated hoặc nội dung đã publish.
- Hai tác vụ AI được hỗ trợ: tạo question draft và tạo simulation draft từ một question draft.

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

## Kiến trúc AI local

```text
Question Studio
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

Studio tự xuất hiện khi chạy development. Giá trị `false` là default an toàn cho production build; flag này chỉ điều khiển UI visibility ở production chứ không provision API. Hãy coi generation brief, source notes, các question title hiện có, toàn bộ four-layer content của câu hiện tại và failure-scenario text là dữ liệu được gửi tới external AI provider. Không đưa password, token, customer data hoặc secret vào các trường này.

Các endpoint local:

```text
POST /api/author/questions/generate
POST /api/author/simulations/generate
```

Middleware giới hạn loopback và same-origin request, yêu cầu JSON cùng author token, giới hạn body 32 KiB, tối đa năm request trong mười phút theo client/token, chỉ một generation đang chạy và timeout upstream 30 giây. Nếu thiếu một trong ba biến server, endpoint trả `ai_not_configured` và local draft hiện có vẫn được giữ nguyên.

Các endpoint này chỉ tồn tại với Vite development server. `npm run preview` phục vụ production bundle tĩnh và không cung cấp AI author API. Khi triển khai production, cần một authenticated server route, secret manager, quota/billing policy và audit log riêng; không được expose development middleware ra Internet.

## Simulation an toàn và có ý nghĩa học tập

AI chỉ trả một `SimulationSpec` gồm actors, scenarios, state snapshots, transitions và invariants. Renderer của TechFlow quyết định toàn bộ HTML/CSS và chuyển trạng thái. Schema không expose field cho executable markup, URL, tọa độ hoặc style; mọi string do AI tạo đều được render như text.

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
