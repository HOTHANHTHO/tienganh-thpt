# Đề bài soạn dữ liệu 1 Unit — App ôn tập Tiếng Anh THPT (lớp 10–11–12, Global Success)

Bạn là giáo viên tiếng Anh THPT giỏi, kiêm biên tập viên đề thi. Soạn dữ liệu cho **Lớp {G}, Unit {N}: {NAME}**.

## Nguồn
- SGK **Tiếng Anh {G} – Global Success** (NXB GDVN), bản scan MẪU:
  - Lớp 10: `/mnt/user-data/uploads/08_AppBuild/06_Eng_lop101112/SGK Tiếng Anh 10 - Global Sucess-mau.pdf` (trang PDF = trang sách + 1)
  - Lớp 11: `/mnt/user-data/uploads/08_AppBuild/06_Eng_lop101112/SGK Tiếng Anh 11 Global Success-mau.pdf` (trang PDF = trang sách + 2)
  - Lớp 12: `/mnt/user-data/uploads/08_AppBuild/06_Eng_lop101112/SGK Tiếng Anh 12 - Global Success-mau.pdf` (trang PDF = trang sách + 2)
  Quy đổi trang là ước tính — kiểm tra số trang in ở chân trang trên ảnh.
- Bản mẫu chỉ có **Unit 1–5 + Review 1–2** (và trang mở đầu Unit 6). Book map (mục lục chi tiết từng Unit: Pronunciation, Vocabulary, Grammar, Reading, Speaking, Listening, Writing, Communication & Culture/CLIL, Project) ở trang PDF 6–9 (lớp 10: 5–8) có đủ 10 Unit.
- OCR từng trang (có lỗi, nhất là IPA và gạch chân): `/home/claude/work/ocr/b{G}/p-XX.txt` (XX = trang PDF, 2 chữ số). Có thể chưa có đủ — khi đó tự xem ảnh.
- Xem ảnh trang: `pdftoppm -f P -l P -r 110 -png "<pdf>" /tmp/g{G}u{N}_p` rồi Read ảnh (P = trang PDF). Chữ nhỏ thì render -r 150 và cắt nửa trang bằng PIL rồi Read.
- Trạng thái Unit này: **{SRC}**
  - `book`: Unit có trong bản mẫu. BẮT BUỘC xem ảnh mọi trang của Unit (khoảng 10 trang lớp 10–11, 12 trang lớp 12): Getting Started, Language (Pronunciation, Vocabulary, Grammar), Reading, Speaking, Listening, Writing, Communication & Culture/CLIL, Looking Back, Project. Từ vựng, ngữ pháp, phát âm, ví dụ phải bám đúng sách; `page` và `review` ghi đúng trang sách.
  - `bookmap`: Unit KHÔNG có trong bản mẫu. Xem ảnh Book map để lấy đúng tên Unit, mục Pronunciation, Vocabulary, Grammar, chủ đề Reading/Speaking/Listening/Writing; dùng hiểu biết của bạn về SGK Global Success {G} để chọn từ vựng điển hình của Unit. Trang: Unit bắt đầu ở trang sách {START}; `page` là trang ước tính theo bố cục chuẩn (Getting Started S, S+1 · Language S+2–S+3 · Reading S+4 · Speaking S+5 · Listening S+6 · Writing S+7 · Communication & Culture S+8 · Looking Back & Project S+9; lớp 12 Unit dài 12 trang, bố cục tương tự, giãn thêm). Trong `review` KHÔNG ghi số trang, chỉ ghi mục (vd "Lớp 10 · Unit 7 – Language, Grammar").

## Sản phẩm: `/home/claude/work/app/data/g{G}/unit{N}.json` (UTF-8, JSON hợp lệ, indent=1, ensure_ascii=False)
```json
{
 "grade": 10, "unit": 1, "name": "Family Life", "src": "book",
 "vocabTopics": ["Household chores", "Family life"],
 "pron": "Consonant blends: /br/, /kr/, /tr/",
 "grammar": ["Present simple vs. present continuous"],
 "notes": [
  {"kind":"grammar","title":"...","page":11,"body":"Tiếng Việt: cách dùng, cấu trúc, dấu hiệu nhận biết, 3–5 ví dụ (ưu tiên ví dụ trong sách), lỗi hay gặp"},
  {"kind":"pron","title":"...","page":10,"body":"..."},
  {"kind":"vocab","title":"Collocation / cụm từ cần nhớ","page":10,"body":"..."},
  {"kind":"exam","title":"Mẹo làm bài","body":"Mẹo ngắn cho các dạng bài thi THPT liên quan kiến thức Unit"}
 ],
 "vocab": [ {"w":"breadwinner","pos":"n","ipa":"/ˈbredwɪnə(r)/","vi":"trụ cột gia đình (người kiếm tiền chính)","ex":"My father is the breadwinner in our family.","page":9} ],
 "passages": [
  {"id":"G10U1-P1","title":"Sharing housework","text":"Đoạn văn 130–180 từ ... (1) _____ ... (2) _____ ... (5) _____ ..."},
  {"id":"G10U1-P2","title":"...","text":"... (6) _____ ... (10) _____ ..."}
 ],
 "questions": [ ... đúng 80 câu ... ]
}
```

### vocab — 30–45 từ/cụm từ
Từ in đậm/được dạy trong Getting Started, Language–Vocabulary, Reading, Listening, Looking Back; cụm động từ, collocation quan trọng. `pos` (n, v, adj, adv, phr v, phr, n phr…), `ipa` chuẩn Anh-Anh (Oxford Learner's), `vi` nghĩa tiếng Việt ngắn đúng ngữ cảnh Unit, `ex` một câu ví dụ (ưu tiên câu trong sách), `page` trang sách.

### questions — đúng 80 câu, mỗi câu 4 phương án, 1 đáp án đúng DUY NHẤT
| type | số câu | id | nội dung |
|---|---|---|---|
| vocab | 20 | G{G}U{N}-V01..V20 | nghĩa, điền từ theo ngữ cảnh, collocation, phrasal verb, word form, đồng nghĩa/trái nghĩa (CLOSEST/OPPOSITE in meaning to the <u>underlined</u> word) |
| grammar | 20 | -G01..G20 | điểm ngữ pháp của Unit (bám A Closer Look/Language–Grammar và Looking Back), có thể ôn lại ngữ pháp lớp dưới liên quan |
| pron | 12 | -P01..P12 | 6–8 câu "Choose the word whose underlined part is pronounced differently from the others." (option dạng `<u>br</u>ead`) + 4–6 câu "Choose the word that differs from the others in the position of primary stress." Bám mục Pronunciation của Unit; với Unit về trọng âm câu/nhịp/ngữ điệu thì hỏi từ được nhấn trong câu, ngữ điệu lên/xuống, cộng câu trọng âm từ của từ vựng Unit. |
| error | 8 | -E01..E08 | Tìm lỗi sai. `q` = "Find the underlined part that needs correction.\n" + câu có ĐÚNG 4 phần gạch chân, mỗi phần ghi nhãn: `<u>has lived</u> (A)`. options = ["A. has lived","B. …","C. …","D. …"] theo đúng thứ tự xuất hiện. Lỗi xoay quanh ngữ pháp/từ vựng của Unit; chỉ 1 phần sai. explain nêu cách sửa. |
| rewrite | 10 | -R01..R10 | 6 câu "Choose the sentence that is closest in meaning to the given sentence." + 4 câu "Choose the sentence that best combines each pair of sentences." Câu đề in ra sau dòng lệnh (dùng \n). Options là câu đầy đủ; 3 nhiễu sai ngữ pháp hoặc sai nghĩa rõ ràng. |
| cloze | 10 | -C01..C10 | 2 đoạn văn TỰ VIẾT (không chép bài đọc trong sách), 130–180 từ, chủ đề Unit; mỗi đoạn 5 chỗ trống: P1 có (1)…(5), P2 có (6)…(10), viết đúng dạng `(1) _____`. Mỗi câu có thêm `"pid":"G{G}U{N}-P1","blank":1`; `q` = "Choose the best option for blank (1)." Chỗ trống kiểm tra từ vựng, collocation, ngữ pháp, từ nối, đại từ quan hệ… |

Mọi câu có:
```json
{"id":"G10U1-G05","unit":1,"type":"grammar","topic":"Present simple vs. present continuous","level":2,
 "q":"My mother usually _____ dinner, but tonight my father _____ it.","options":["cooks / is cooking","is cooking / cooks","cooks / cooks","is cooking / is cooking"],"answer":0,
 "explain":"Giải thích TIẾNG VIỆT: vì sao đúng (dấu hiệu, cấu trúc), vì sao các phương án khác sai; dịch nghĩa câu khi cần.",
 "review":"Lớp 10 · Unit 1 – Language, Grammar (tr. 11)"}
```
- `level`: 1 nhận biết ~35%, 2 thông hiểu ~40%, 3 vận dụng ~25% (error, rewrite, cloze phần lớn level 2–3).
- `answer` = 0–3, **rải đều vị trí đáp án đúng** trong từng dạng (mỗi vị trí ~25%).
- `topic` = một mục trong vocabTopics / grammar / pron (cloze dùng topic = tên chủ đề đoạn văn hoặc điểm kiến thức của chỗ trống).
- Chỗ trống `_____` (5 gạch dưới). Chỉ dùng thẻ `<u>`, `<b>`, `<i>`; không HTML khác.
- explain không viết "đáp án A/B/C/D" (trừ câu error), vì app có thể hiển thị lại; nói thẳng phương án đúng.
- Tiếng Anh chuẩn, tự nhiên, trình độ lớp {G}; không mẹo lừa vô lý; phương án nhiễu hợp lý (cùng từ loại, cùng chủ đề). Không chép nguyên văn bài tập sách quá 1/3 số câu — đặt câu mới cùng dạng.
- Phát âm/trọng âm phải chính xác theo Oxford Anh-Anh; tự kiểm tra từng từ (phiên âm từng phương án) trước khi chốt. Tránh từ có hai cách nhấn phổ biến.

## Kiểm tra trước khi xong
1. Tự rà lại TỪNG câu: đáp án đúng duy nhất? phương án nhiễu nào có thể cũng đúng không? câu error có đúng 4 phần gạch chân và đúng 1 lỗi?
2. Chạy:
```
python3 -c "import json,collections;d=json.load(open('/home/claude/work/app/data/g{G}/unit{N}.json'));print(len(d['vocab']),len(d['questions']),collections.Counter(q['type'] for q in d['questions']),collections.Counter(q['answer'] for q in d['questions']))"
```
Phải ra 80 câu: vocab 20, grammar 20, pron 12, error 8, rewrite 10, cloze 10.
3. Không chạy build_data.py (các Unit khác đang được soạn song song).

Trả lời NGẮN (≤ 8 dòng): số từ vựng, số câu theo loại, điểm ngữ pháp/phát âm đã dùng, chỗ nào trong sách không đọc rõ hoặc không chắc.
