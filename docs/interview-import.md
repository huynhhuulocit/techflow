# Interview Question Bank từ GameStream

Tài liệu này mô tả ranh giới dữ liệu, cách import và quy tắc review cho Interview Question Bank của TechFlow. Question Bank là một module riêng; các câu hỏi import không tự động trở thành visual lesson hoặc simulation.

## Phạm vi dữ liệu nguồn

Nguồn canonical Vietnamese trong standalone repository là thư mục:

```text
content/interview/vi
```

Bộ Markdown này ban đầu được nhập từ `gameStream/docs/interview`, sau đó được giữ cùng TechFlow để development, CI và deployment không phụ thuộc đường dẫn hoặc repository bên ngoài.

Snapshot Vietnamese được tạo từ đúng **39 level files**, tương ứng:

- **13 topics**: Docker & Nginx, Elasticsearch, JWT/OAuth/OIDC, Kafka & Message Queue, LiveKit/WebRTC, Memory Cache, MongoDB, Node.js/NestJS, Redis, Socket.IO & Realtime, System Design & Patterns, Testing & Observability, TypeScript.
- **3 levels** cho mỗi topic: `Junior`, `Middle`, `Senior`.
- **15 questions** trong mỗi level file.
- Tổng cộng **585 questions**: 195 câu cho mỗi level và 45 câu cho mỗi topic.

Hai file không thuộc lần import này:

- `docs/interview/README.md` của GameStream đang rỗng và không phải level file.
- `overview/overview-api/00_overview-api.md` có cấu trúc study guide riêng, không theo format 15 Q&A. Tài liệu này được giữ cho phase sau dưới dạng **API Overview Study Guide**; importer không được âm thầm chuyển hoặc bỏ qua nó như một level file.

## Mapping vào ba learning layers

Mỗi câu hỏi nguồn phải có đủ bốn marker. Importer chuyển chúng sang dữ liệu TechFlow như sau:

| Marker trong GameStream | Trường trong Question Bank | Cách hiển thị |
| --- | --- | --- |
| `Conclusion` | `quickAnswer` | Trả lời nhanh |
| `Mechanism` | `conceptualExplanation` | Hiểu cơ chế |
| `Trade-off` | `productionTradeOff` | Production trade-off |
| `GameStream` | `appliedExample` | Ví dụ trong GameStream |

`GameStream` là ví dụ áp dụng trong một codebase cụ thể, không phải khẳng định rằng đó là cách triển khai duy nhất hoặc universal best practice. UI và tài liệu phải luôn ghi rõ nhãn **“Ví dụ trong GameStream”**.

## Kiến trúc import

```text
GameStream Markdown (canonical Vietnamese source)
  -> deterministic importer
  + Vietnamese technical-review ledger
  -> checked-in Vietnamese TypeScript snapshot

English TypeScript translation overlay
  + translation status/review metadata
  + translatedFromHash of the Vietnamese source
  -> checked-in English TypeScript snapshot

selected locale snapshot
  -> local repository/filter/search
  -> Interview Question Bank UI
```

Frontend không đọc Markdown ở runtime. Importer đọc nguồn bundled trong `content/interview/vi` lúc phát triển, kiểm tra cấu trúc, rồi sinh snapshot TypeScript để frontend chạy độc lập.

Hai generated snapshots là output của importer:

```text
src/content/generated/gameStreamInterview.ts
src/content/generated/gameStreamInterview.en.ts
```

Không sửa thủ công file generated. Khi nội dung nguồn thay đổi, hãy chạy lại importer, kiểm tra diff và commit cả Markdown nguồn lẫn snapshot mới. Nếu cần sửa nội dung, sửa `content/interview/vi` hoặc thay đổi parser/mapping một cách có chủ đích.

Technical review của canonical Vietnamese được lưu riêng tại:

```text
src/content/interviewReviews.json
```

Đây là file hand-maintained; không ghi review status trực tiếp vào generated snapshot.

English TypeScript source overlay nằm tại `src/content/interview/en/typescript.json`. Nó giữ `translationStatus`, `translatedFromHash`, provenance và optional `translationReview` riêng; không dùng Vietnamese ledger để ngầm duyệt bản dịch.

## Import và validation

Từ thư mục gốc của standalone TechFlow repository, chạy:

```bash
npm run content:import
npm run content:check
npm run content:validate
npm run build
```

- `content:import` đọc 39 Vietnamese level files cùng English TypeScript overlay và regenerate cả hai snapshots.
- `content:check` dựng hai snapshot kỳ vọng trong memory rồi byte-compare với các file checked-in; lệnh này không ghi file và fail nếu một snapshot stale.
- `content:validate` xác nhận cả hai snapshot đồng bộ, đồng thời kiểm tra count, thứ tự, ID/source anchor uniqueness, các field bắt buộc, source hash và review metadata.
- `build` kiểm tra TypeScript và production bundle sau khi dữ liệu thay đổi.

Importer và validator phải fail thay vì silently skip khi số file/câu không đúng, một marker bắt buộc bị thiếu, hoặc ID/anchor bị trùng. Một lần import hợp lệ phải giữ các invariant:

```text
39 level files
13 topics
3 levels
15 questions / level file
585 questions total
195 questions / level
45 questions / topic
```

## Review status

Import thành công chỉ chứng minh dữ liệu parse được và đáp ứng structural validation; điều đó không xác minh technical claim.

- `imported-needs-review`: trạng thái mặc định của mọi câu vừa import. Nội dung có nguồn nhưng chưa qua evidence/review pass của TechFlow.
- `reviewed`: chỉ được importer tạo khi câu có ledger entry hợp lệ sau khi người review kiểm tra technical accuracy, cách diễn đạt, mức độ phù hợp với level và ngữ cảnh GameStream.

Không đổi một câu sang `reviewed` chỉ vì build hoặc validation pass. Không hiển thị `verified` nếu chưa có evidence và quy trình review tương ứng.

Mỗi ledger entry phải có reviewer, thời điểm review, ít nhất một evidence HTTPS có nhãn và `contentHash` của chính phiên bản nội dung đã review:

```json
[
  {
    "questionId": "redis-middle-04",
    "reviewer": "reviewer-id",
    "reviewedAt": "2026-09-07T00:00:00.000Z",
    "evidence": [
      {
        "label": "Redis documentation",
        "url": "https://redis.io/docs/latest/"
      }
    ],
    "contentHash": "<64-character-lowercase-sha256>"
  }
]
```

Lấy hash canonical của một câu bằng:

```bash
npm run content:hash -- redis-middle-04
```

Sau khi thêm hoặc sửa ledger entry, chạy lại `content:import`. Importer fail nếu `questionId` lạ/trùng, metadata thiếu hoặc thừa, evidence không hợp lệ, hay hash không còn khớp. Vì hash bao phủ câu hỏi, ba answer layers, GameStream example và source reference, source đổi sau review sẽ không âm thầm giữ badge `reviewed`.

### Translation review English

English overlay dùng `ai-translated-needs-review` cho bản dịch chưa duyệt và `reviewed` chỉ khi có `translationReview` hợp lệ. `translatedFromHash` phải khớp canonical Vietnamese content; khi câu nguồn đổi, import/check/validate fail cho đến khi bản dịch được cập nhật có chủ đích. Lệnh `content:hash` và `interviewReviews.json` ở trên chỉ thuộc technical-review flow của canonical Vietnamese.

## Giới hạn của MVP client-side

- Learner-facing Question Bank và production bundle vẫn client-side; local Author API chỉ tồn tại trong `npm run dev` và không phải production backend.
- Filter, accent-insensitive search và pagination chạy local trong browser.
- Refresh không lưu lịch sử học, bookmark hoặc câu trả lời của người học.
- Question Bank không tự động tham gia hybrid search/knowledge graph của lesson hiện tại.
- Không có runtime connection tới GameStream; source thay đổi chỉ xuất hiện sau khi regenerate và rebuild TechFlow.
- Pagination giới hạn số item render trên một trang; browser tải snapshot đầy đủ của locale đang chọn — 585 VI hoặc 45 EN — thay vì tải cả hai ngay từ đầu.
- Nội dung import là plain structured content, không phải HTML tùy ý từ nguồn.
- API Overview chưa xuất hiện trong Question Bank; nó là deferred study-guide work, không phải dữ liệu bị thiếu do importer.

## Checklist khi cập nhật nội dung

1. Sửa hoặc review Markdown trong GameStream.
2. Chạy `npm run content:import`.
3. Kiểm tra diff của generated snapshot, đặc biệt là ID, level, topic và bốn learning blocks.
4. Chạy `npm run content:check` và `npm run content:validate`.
5. Chạy `npm run build`.
6. Mở Question Bank và kiểm tra filter, search, pagination, detail, câu trước/câu tiếp và nhãn “Ví dụ trong GameStream”.
7. Nếu một câu đã được technical review, lấy hash bằng `content:hash`, thêm reviewer/evidence vào ledger, rồi lặp lại bước 2–6.
