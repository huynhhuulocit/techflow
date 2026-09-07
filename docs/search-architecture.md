# Search architecture

## Contract

Một truy vấn quan hệ phải trả về bốn phần độc lập:

1. `answer`: câu trả lời tổng hợp có nguồn bài học.
2. `connections`: các cạnh khái niệm dùng để render sơ đồ.
3. `results`: bài học được xếp hạng cùng lý do khớp.
4. `suggestions`: câu hỏi tiếp theo dựa trên khoảng trống kiến thức.

## MVP

`src/search/searchEngine.ts` thực hiện normalize tiếng Việt, bỏ stop-word, nhận diện alias, fuzzy-match lỗi chính tả nhẹ và chấm điểm theo field. Quan hệ SFCC–PWA Kit–TypeScript là fixture đầu tiên để kiểm tra UI và output contract.

## Production pipeline

```text
query
  -> intent and concept extraction
  -> exact/full-text retrieval
  -> vector retrieval
  -> graph expansion (1-2 hops)
  -> reranking
  -> grounded answer generation
  -> suggestion generation
```

AI chỉ được tổng hợp từ các lesson/version đang ở trạng thái `published`. Mỗi câu trong answer phải giữ danh sách `lessonId` làm nguồn. Nếu retrieval không đủ bằng chứng, trả kết quả tìm kiếm nhưng không tạo câu trả lời khẳng định.

## Automated gates

- Không dùng lesson chưa publish hoặc translation chưa verified.
- Không trả graph edge tham chiếu concept không tồn tại.
- Giới hạn graph traversal ở hai hop cho truy vấn thông thường.
- Không để model tự tạo URL hoặc lesson ID.
- Cache theo `normalizedQuery + locale + contentIndexVersion`.
- Ghi lại truy vấn không có kết quả để content agent tạo đề xuất bài mới.
