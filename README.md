# TechFlow

MVP website tiếng Việt để học kỹ thuật và luyện phỏng vấn bằng animation, workflow, comparison và câu hỏi đào sâu. Technical terms được giữ bằng English khi cách gọi đó chính xác hơn.

## Chạy local

```bash
npm install
npm run dev
```

Build kiểm tra:

```bash
npm test
npm run lint
npm run build
```

Regenerate và validate Interview Question Bank từ GameStream:

```bash
npm run content:import
npm run content:check
npm run content:validate
npm run build
```

Xem ranh giới nguồn và review workflow tại [docs/interview-import.md](docs/interview-import.md). Hướng dẫn Question Studio và AI simulation có bản [Vietnamese](docs/vi/authoring-ai.md) và [English](docs/en/authoring-ai.md). Responsive mobile UX cũng được ghi lại bằng [Vietnamese](docs/vi/mobile-ux.md) và [English](docs/en/mobile-ux.md).

## Cấu trúc chính

- `src/content`: schema, dữ liệu bài học và generated Interview Question Bank.
- `src/interview`: query, filter, search và pagination cho Question Bank.
- `src/i18n`: locale state và UI copy Vietnamese/English.
- `src/author`: local draft store, import/export, duplicate detection và AI client.
- `src/simulation`: deterministic state engine và semantic validator.
- `src/components`: các visual block tái sử dụng.
- `server/author-api`: local-only AI middleware; API key không đi vào browser bundle.
- `scripts`: deterministic importer và content validator.
- `docs`: kiến trúc search và quy trình import/review nội dung.
- `.codex/agents`: custom subagents theo vai trò.
- `.codex/skills`: quy trình lặp lại để tạo và kiểm định nội dung.
- `AGENTS.md`: nguyên tắc sản phẩm và cách phối hợp agent.

## MVP hiện tại

- Landing page và thư viện câu hỏi.
- Tìm kiếm, lọc chủ đề không cần horizontal scroll và navigation responsive có keyboard support.
- Trang bài học Event Loop.
- Workflow player có play, pause, reset và chuyển từng bước.
- Search theo từ khóa, alias, lỗi chính tả gần đúng và quan hệ giữa nhiều khái niệm.
- Trang kết quả gồm câu trả lời tổng hợp, knowledge path, bài học liên quan và câu hỏi gợi ý.
- Interview Question Bank gồm 585 câu từ 13 topics và ba levels `Junior`, `Middle`, `Senior`.
- English pilot gồm 45 câu TypeScript liên kết với câu Vietnamese bằng cùng ID; UI không tự fallback sang Vietnamese khi thiếu bản dịch.
- Question detail giữ ba learning layers: trả lời nhanh, hiểu cơ chế và production trade-off; ví dụ project được ghi rõ là “Ví dụ trong GameStream”.
- Local filter, accent-insensitive search, pagination và điều hướng câu trước/câu tiếp.
- Source/review metadata để nội dung vừa import không bị trình bày như technical claim đã verified.
- Question Studio cho phép soạn tay, copy câu từ Question Bank, import/export JSON hoặc GameStream Markdown và lưu draft trong browser.
- Local opt-in AI có thể tạo question draft hoặc deterministic simulation draft; mọi output đều cần human review trước khi publish.
- Simulation player có scenario, state snapshot, invariant, Step/Back/Play/Pause/Reset, transcript và reduced-motion behavior.
- 4 custom agents và 3 project skills.

Question Bank dùng hai locale bundle tải theo nhu cầu: snapshot Vietnamese được generate từ 39 level files trong `D:\research\gameStream\docs\interview`, còn English là overlay TypeScript checked-in của 45 câu. Frontend không đọc repository GameStream lúc runtime. API Overview có format study guide riêng và được hoãn sang phase sau, không nằm trong 585 câu hiện tại.

## Thử chức năng search

Tại ô tìm kiếm trang chủ, nhập:

```text
SFCC và PWA TypeScript liên quan như thế nào?
```

Search hiện chạy local trên dữ liệu bài học. Khi chuyển sang backend, giữ nguyên giao diện và thay `src/search/searchEngine.ts` bằng hybrid retrieval gồm full-text, embeddings và knowledge-graph traversal.
