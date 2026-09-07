# Deploy TechFlow bằng Cloudflare Pages

TechFlow được deploy như một static Vite site từ GitHub. Production không chạy local author API và không chứa OpenAI API key.

## Cấu hình project

Kết nối repository `huynhhuulocit/techflow` bằng Git integration của Cloudflare Pages và dùng các giá trị sau:

| Thiết lập | Giá trị |
| --- | --- |
| Project name | `techflow` |
| Production branch | `main` |
| Framework preset | `Vite` |
| Root directory | Để trống |
| Build command | `npm run verify:deploy` |
| Build output directory | `dist` |
| Node.js | `22.16.0`, được pin bởi `.node-version` |

Đặt `VITE_ENABLE_AUTHOR_STUDIO=false` cho cả Production và Preview. Không khai báo `OPENAI_API_KEY`, `OPENAI_MODEL` hoặc `TECHFLOW_AUTHOR_TOKEN` trên Cloudflare Pages: các biến đó chỉ dành cho local Vite author API.

Project không có Pages Functions, Worker hoặc server-side route. Vì navigation hiện dùng client state thay vì path router, chưa cần `_redirects`.

## Luồng tự động

1. Codex hoàn tất một yêu cầu trong repository standalone.
2. Chạy `npm run verify:deploy` và browser check liên quan.
3. Nếu validation pass, Codex commit và push current branch mà không chờ review riêng.
4. Push vào `main` kích hoạt production deployment tự động.
5. Push vào branch khác tạo preview deployment nếu Preview branches được bật.

Không push khi validation fail, có secret hoặc có thay đổi ngoài phạm vi yêu cầu.

## Review trên iPhone

Sau deployment đầu tiên, URL production có dạng `https://techflow.pages.dev`. Nếu tên này đã được sử dụng, Cloudflare sẽ cấp hostname theo project name thực tế hiển thị trong dashboard.

Locale và draft trong Question Studio dùng browser storage. Vì vậy dữ liệu local trên máy Windows không tự xuất hiện trên iPhone; chỉ nội dung đã đưa vào source, commit và deploy mới dùng chung giữa hai thiết bị.

## Chỉ cho một người sử dụng

Hostname `pages.dev` mặc định là public. Sau khi production hoạt động, bật Cloudflare Access và hoàn tất cả production hostname lẫn preview hostname:

1. Trong Pages project, mở **Settings > General > Enable access policy**. Policy tự động ban đầu chỉ bảo vệ preview deployments.
2. Chọn **Manage** trên Access policy vừa tạo, mở application của project và chọn **Configure**.
3. Trong **Public hostname**, xóa wildcard `*` ở trường Subdomain rồi lưu. Application này sẽ bảo vệ chính `techflow.pages.dev`.
4. Quay lại Pages **Settings > General** và bật access policy lần nữa nếu cần bảo vệ cả preview deployments. Sau cùng sẽ có một application cho production hostname và một application cho wildcard preview.

Policy `Allow` nên dùng selector **Cloudflare Account Member** của current account. Một lựa chọn khác là One-time PIN với selector **Emails** chứa đúng email của chủ tài khoản. Không dùng `Login Methods = One-time PIN` làm điều kiện duy nhất vì mọi email xác thực được đều có thể vào.

Việc kết nối GitHub và tạo Access policy thay đổi quyền truy cập bên ngoài, nên phải được xác nhận tại đúng bước trong dashboard.

Cloudflare Pages Free hiện giới hạn 500 builds mỗi tháng; static requests không dùng Pages Functions không bị tính như Functions requests.

## Rollback

Trong Cloudflare Pages, mở project, chọn **Deployments**, mở một deployment đã hoạt động và dùng chức năng rollback/promote mà dashboard cung cấp. Với source code, revert commit lỗi rồi push `main` để tạo một deployment mới có lịch sử rõ ràng.

Tham khảo tài liệu chính thức: [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [Vite deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/), [build image](https://developers.cloudflare.com/pages/configuration/build-image/), [preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/) và [bảo vệ production pages.dev](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain).
