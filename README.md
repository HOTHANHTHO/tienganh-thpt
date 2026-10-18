# TiengAnhTHPT_OnTap — Ôn luyện Tiếng Anh 10 · 11 · 12 (Global Success)

App tĩnh (HTML + JS thuần, PWA), chạy offline, không cần server, không phụ thuộc CDN. Một app chung cho 3 khối, chọn lớp ở thanh trên cùng hoặc ô "Lớp 10/11/12" ở trang chủ. Tổ chức giống app `04_Eng_lop6789/TiengAnh9_OnTap`.

Nguồn: SGK **Tiếng Anh 10, 11, 12 – Global Success** (NXB GDVN), bản scan MẪU trong `06_Eng_lop101112/`
(lớp 10: trang PDF = trang sách + 1; lớp 11, 12: trang PDF = trang sách + 2).

| | Lớp 10 | Lớp 11 | Lớp 12 |
|---|---|---|---|
| Unit | 10 | 10 | 10 |
| Câu hỏi | 800 | 800 | 800 |
| Từ vựng | ~420 | ~420 | ~430 |

- **Unit 1–5** (có trong bản mẫu): soạn bám từng trang sách, `page`/`review` ghi đúng trang.
- **Unit 6–10** (bản mẫu KHÔNG có): soạn theo **Book map** (tên Unit, mục Pronunciation, Vocabulary, Grammar, chủ đề các kỹ năng) + hiểu biết về bộ sách. Trong app có nhãn **"theo mục lục"**; từ vựng và số trang là ước tính, chưa đối chiếu sách thật. Khi có bản SGK đầy đủ nên rà lại các Unit này.
- Không có Glossary trong bản mẫu nên từ vựng lấy từ các bài trong Unit.

## Mỗi Unit: 80 câu trắc nghiệm, 6 dạng
| Dạng | Số câu | Ghi chú |
|---|---|---|
| Từ vựng | 20 | nghĩa, điền từ, collocation, word form, đồng nghĩa/trái nghĩa |
| Ngữ pháp | 20 | điểm ngữ pháp của Unit |
| Phát âm – trọng âm | 12 | phần gạch chân, trọng âm từ; trọng âm câu/ngữ điệu với Unit tương ứng |
| Tìm lỗi sai | 8 | dạng đề THPT |
| Câu đồng nghĩa / kết hợp câu | 10 | dạng đề THPT |
| Điền từ vào đoạn văn | 10 | 2 đoạn tự viết × 5 chỗ trống |

Mức độ ~35% nhận biết, 40% thông hiểu, 25% vận dụng. Mỗi câu có giải thích tiếng Việt và mục "Xem lại trong sách".
Mỗi Unit còn có **Ghi nhớ** (ngữ pháp, phát âm, collocation, mẹo làm bài) và bảng từ vựng (phiên âm Anh-Anh, nghĩa, ví dụ).

## Cách chạy
Mở `index.html` bằng Chrome/Edge. Muốn cài như ứng dụng (PWA) thì mở qua `http://` (vd `python -m http.server` trong thư mục này, vào `http://localhost:8000`).
Nút 🔊 dùng giọng đọc tiếng Anh có sẵn của Windows/trình duyệt.

## Các chế độ
- **Flashcard từ vựng** — chọn Unit, chiều thẻ, chỉ từ chưa thuộc. Phím: Space lật, ← → chuyển thẻ, K đã thuộc, P nghe.
- **Luyện tập** — chọn Unit, dạng bài, mức độ, ưu tiên câu chưa làm / đã sai. Biết đúng sai ngay.
- **Kiểm tra có giờ** — cả năm / HK I (Unit 1–5) / HK II (Unit 6–10) / cụm Review / từng Unit; đề ~25% từ vựng, 25% ngữ pháp, 15% phát âm, 10% tìm lỗi sai, 12,5% câu đồng nghĩa, phần điền đoạn văn đặt cuối đề.
- **Tiến độ & thống kê** — theo từng lớp: tỉ lệ đúng Unit × dạng bài, câu hay sai, lịch sử kiểm tra, xoá tiến độ của lớp.

Tiến độ lưu trong `localStorage` (khoá `tathpt_v1`), chỉ trên máy/trình duyệt đang dùng.

## Cấu trúc
```
index.html, css/style.css, js/app.js
js/data.bundle.js          SINH TỰ ĐỘNG từ data/ — không sửa tay
data/toc.json              tên Unit, trang bắt đầu, cụm Review, HK I/HK II của từng lớp
data/g10|g11|g12/unitN.json  mỗi Unit: grade, unit, name, src (book|bookmap), vocabTopics, pron, grammar, notes, vocab, passages, questions
tools/build_data.py        gộp + kiểm tra dữ liệu -> js/data.bundle.js
tools/PROMPT_soan_unit.md  đề bài đã dùng để soạn 1 Unit (dùng lại khi soạn lại Unit 6–10 theo sách đầy đủ)
tools/PROMPT_ra_soat.md    đề bài rà soát câu hỏi
service-worker.js, manifest.json, icons/   PWA
```

## Sửa / thêm câu hỏi
1. Sửa `data/gG/unitN.json`. Mỗi câu:
   ```json
   {"id":"G10U1-G05","unit":1,"type":"grammar","topic":"...","level":2,
    "q":"...","options":["...","...","...","..."],"answer":0,
    "explain":"Giải thích tiếng Việt","review":"Lớp 10 · Unit 1 – Language, Grammar (tr. 11)"}
   ```
   `type`: vocab / grammar / pron / error / rewrite / cloze; id: `G{lớp}U{unit}-{V|G|P|E|R|C}NN`. `answer` 0–3.
   Câu `cloze` có thêm `"pid":"G10U1-P1","blank":1`, đoạn văn nằm trong `passages` (chỗ trống viết `(1) _____`).
   Chỉ dùng thẻ `<u>`, `<b>`, `<i>`.
2. Chạy `python tools/build_data.py` (báo lỗi nếu thiếu trường, sai id, trùng phương án, chỗ trống không khớp...).
3. Tăng `CACHE_VERSION` trong `service-worker.js` (khi dùng qua http/PWA).

## Ghi chú
- Câu hỏi do Claude soạn từ SGK (10/2026), mỗi Unit đã qua một vòng rà soát bằng agent riêng; thầy nên rà lại trước khi dùng chính thức với học sinh, ưu tiên Unit 6–10.
- Phát âm theo chuẩn Anh-Anh (Oxford) như sách; đã tránh các từ có hai cách đọc/nhấn phổ biến trong câu phát âm.
