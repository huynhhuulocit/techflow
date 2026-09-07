# Junior — Câu hỏi phỏng vấn Elasticsearch

## Mục lục câu hỏi

1. [Elasticsearch là gì?](#question-1)
2. [Index và document là gì?](#question-2)
3. [Inverted index là gì?](#question-3)
4. [Mapping là gì?](#question-4)
5. [`text` và `keyword` khác nhau thế nào?](#question-5)
6. [Analyzer là gì?](#question-6)
7. [`match` khác `term` query thế nào?](#question-7)
8. [Primary và replica shard là gì?](#question-8)
9. [Elasticsearch có real-time không?](#question-9)
10. [Vì sao không chỉ lưu authoritative game state trong Elasticsearch?](#question-10)
11. [Upsert là gì?](#question-11)
12. [Query context khác filter context thế nào?](#question-12)
13. [Relevance scoring là gì?](#question-13)
14. [Paginate search result thế nào?](#question-14)
15. [Cluster health green, yellow, red nghĩa gì?](#question-15)

<a id="question-1"></a>

## 1. Elasticsearch là gì?

**Câu trả lời mẫu:** **Conclusion:** Elasticsearch là distributed search/analytics engine xây trên Lucene. **Mechanism:** nó index JSON document vào cấu trúc tối ưu cho search. **Trade-off:** vận hành nặng hơn và thường không nên là transactional source of truth. **GameStream:** nó hỗ trợ tìm public room từ derived projection.

<a id="question-2"></a>

## 2. Index và document là gì?

**Câu trả lời mẫu:** **Conclusion:** index là tập logical các searchable document; document là một JSON record. **Mechanism:** mỗi field được mapping/index theo type. **Trade-off:** index boundary ảnh hưởng shard, mapping và lifecycle. **GameStream:** `gamestream-rooms` chứa searchable room summary, không chứa authoritative game state.

<a id="question-3"></a>

## 3. Inverted index là gì?

**Câu trả lời mẫu:** **Conclusion:** inverted index map term tới document chứa term đó. **Mechanism:** text được analyze thành token, postings list hỗ trợ lookup nhanh. **Trade-off:** indexing tốn storage/write work. **GameStream:** room-name search tránh scan toàn bộ MongoDB room.

<a id="question-4"></a>

## 4. Mapping là gì?

**Câu trả lời mẫu:** **Conclusion:** mapping định nghĩa field được lưu/index thế nào. **Mechanism:** nó gán type như `text`, `keyword`, number hoặc date. **Trade-off:** field type đã tạo sai thường phải reindex. **GameStream:** status là `keyword`, name có thể là `text` cộng keyword subfield, update time là date.

<a id="question-5"></a>

## 5. `text` và `keyword` khác nhau thế nào?

**Câu trả lời mẫu:** **Conclusion:** `text` được analyze cho full-text search; `keyword` giữ toàn value cho exact match, sort, aggregation. **Mechanism:** analyzer tokenize text, keyword là một term. **Trade-off:** multi-field tốn index space. **GameStream:** search room name bằng text và filter status bằng keyword.

<a id="question-6"></a>

## 6. Analyzer là gì?

**Câu trả lời mẫu:** **Conclusion:** analyzer chuyển text thành searchable token. **Mechanism:** character filter, tokenizer và token filter normalize input. **Trade-off:** index-time và search-time analyzer phải tương thích. **GameStream:** hành vi dấu, chữ hoa/thường và partial word của room name phải được quyết định/test rõ.

<a id="question-7"></a>

## 7. `match` khác `term` query thế nào?

**Câu trả lời mẫu:** **Conclusion:** `match` analyze input cho full text; `term` tìm exact indexed term. **Mechanism:** dùng `term` trên analysed text thường cho kết quả bất ngờ. **Trade-off:** exactness và relevance phục vụ use case khác. **GameStream:** `match` cho name, `term` cho `visibility`/`status`.

<a id="question-8"></a>

## 8. Primary và replica shard là gì?

**Câu trả lời mẫu:** **Conclusion:** primary shard partition index data; replica copy primary để resilience và tăng read capacity. **Mechanism:** mỗi document route tới một primary rồi replicate. **Trade-off:** quá nhiều shard lãng phí heap/coordination. **GameStream:** single-node dev cluster có thể yellow vì replica không assign được.

<a id="question-9"></a>

## 9. Elasticsearch có real-time không?

**Câu trả lời mẫu:** **Conclusion:** search là near real-time, không immediately consistent sau mọi write. **Mechanism:** change searchable khi refresh. **Trade-off:** force refresh mỗi write làm throughput xấu. **GameStream:** room mới có thể được MongoDB trả trước khi xuất hiện trong search.

<a id="question-10"></a>

## 10. Vì sao không chỉ lưu authoritative game state trong Elasticsearch?

**Câu trả lời mẫu:** **Conclusion:** Elasticsearch tối ưu search, không tối ưu multi-document transactional invariant. **Mechanism:** refresh và distributed indexing có consistency semantics khác. **Trade-off:** projection riêng tạo eventual consistency. **GameStream:** MongoDB xử lý command/resume; Elasticsearch xử lý discovery.

<a id="question-11"></a>

## 11. Upsert là gì?

**Câu trả lời mẫu:** **Conclusion:** upsert tạo document nếu chưa có hoặc update nếu đã có. **Mechanism:** stable document ID làm repeated projection event hội tụ. **Trade-off:** stale event có thể overwrite state mới nếu không check version. **GameStream:** dùng `roomId` làm document ID và so aggregate version.

<a id="question-12"></a>

## 12. Query context khác filter context thế nào?

**Câu trả lời mẫu:** **Conclusion:** query context tính relevance score; filter context trả yes/no và có thể cache. **Mechanism:** boolean query kết hợp scored clause và filter. **Trade-off:** score exact constraint lãng phí. **GameStream:** score room-name match, filter visibility/status/capacity.

<a id="question-13"></a>

## 13. Relevance scoring là gì?

**Câu trả lời mẫu:** **Conclusion:** scoring ước lượng document khớp query tốt đến đâu. **Mechanism:** Lucene thường dùng thống kê term BM25. **Trade-off:** default relevance có thể không đúng product goal. **GameStream:** freshness hoặc available seat có thể cần boost ngoài name text.

<a id="question-14"></a>

## 14. Paginate search result thế nào?

**Câu trả lời mẫu:** **Conclusion:** page nhỏ dùng `from/size`; deep/stable traversal dùng `search_after` với deterministic sort. **Mechanism:** deep offset buộc shard collect nhiều hit rồi bỏ. **Trade-off:** `search_after` không nhảy page tùy ý. **GameStream:** sort bằng score, update time và room ID để cursor ổn định.

<a id="question-15"></a>

## 15. Cluster health green, yellow, red nghĩa gì?

**Câu trả lời mẫu:** **Conclusion:** green là mọi primary/replica assigned; yellow là đủ primary nhưng thiếu replica; red là ít nhất một primary unavailable. **Mechanism:** health tóm tắt shard allocation. **Trade-off:** yellow có thể dự kiến trên one-node nhưng là resilience warning ở production. **GameStream:** admin dashboard map red thành down, yellow thành degraded.

## Bảng thuật ngữ kỹ thuật

| Technical term    | Nghĩa tiếng Việt               | Giải thích đơn giản                                                              |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| Elasticsearch     | Công cụ tìm kiếm Elasticsearch | Distributed search engine dùng inverted index để tìm và phân tích dữ liệu nhanh. |
| Index             | Chỉ mục dữ liệu                | Logical namespace chứa document và mapping.                                      |
| Document          | Tài liệu dữ liệu               | Đơn vị JSON được Elasticsearch lập chỉ mục và tìm kiếm.                          |
| Inverted index    | Chỉ mục đảo                    | Ánh xạ term tới các document chứa term đó để tìm text nhanh.                     |
| Mapping           | Ánh xạ kiểu dữ liệu            | Khai báo field, data type và cách field được lập chỉ mục.                        |
| Text field        | Trường văn bản                 | Field được analyzer xử lý để full-text search.                                   |
| Keyword field     | Trường từ khóa                 | Field giữ nguyên giá trị để filter, sort và aggregation chính xác.               |
| Analyzer          | Bộ phân tích văn bản           | Chuỗi bước tách và chuẩn hóa text thành token.                                   |
| Match query       | Truy vấn khớp văn bản          | Query phân tích input rồi tìm document theo full-text relevance.                 |
| Term query        | Truy vấn từ khóa chính xác     | Query tìm đúng term đã được lập chỉ mục mà không phân tích input.                |
| Primary shard     | Phân mảnh chính                | Bản shard nhận và quản lý thao tác ghi gốc.                                      |
| Replica shard     | Phân mảnh bản sao              | Bản sao shard tăng khả năng đọc và chịu lỗi.                                     |
| Near real-time    | Gần thời gian thực             | Document mới có độ trễ nhỏ trước khi xuất hiện trong search.                     |
| Upsert            | Cập nhật hoặc thêm mới         | Update document nếu tồn tại, nếu không thì tạo mới.                              |
| Relevance scoring | Chấm điểm độ liên quan         | Tính mức phù hợp của document với full-text query.                               |
