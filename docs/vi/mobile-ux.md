# Responsive mobile UX

## Mục tiêu

- Giữ toàn bộ primary navigation có thể tìm thấy trên tablet và mobile.
- Hiển thị đầy đủ topic filters mà không cần horizontal scroll.
- Duy trì touch target rõ ràng, keyboard focus và không tạo page-level overflow.

## Hành vi theo breakpoint

| Breakpoint | Hành vi |
| --- | --- |
| Trên `960px` | Primary navigation hiển thị inline; nút menu được ẩn. |
| Từ `960px` trở xuống | Navigation chuyển thành disclosure panel. Nút menu công bố `aria-expanded`; Escape đóng panel và trả focus về trigger; thao tác bên ngoài cũng đóng panel. Khi chuyển lên desktop, trạng thái mở được reset. |
| Từ `850px` trở xuống | Hero về một cột, section actions xếp dọc, stats và lesson cards về hai cột. |
| Từ `560px` trở xuống | Topic filters thành grid hai cột; lesson cards về một cột; typography và khoảng cách được thu gọn. |

## Accessibility invariants

- Navigation vẫn dùng semantic `nav`; không dùng `role="menu"` cho page navigation.
- Topic filters là một group có accessible label và mỗi nút công bố trạng thái qua `aria-pressed`.
- Menu, filters, search action và section actions có touch target gần hoặc bằng `44px`.
- Interactive cards và controls có focus ring nhìn thấy được.

## Regression checks

Kiểm tra cả Vietnamese và English tại `320px`, `375px`, `768px` và desktop từ `1024px`. `documentElement.scrollWidth` phải bằng viewport width; topic filter cũng không được có internal overflow.
