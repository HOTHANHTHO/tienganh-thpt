# Rà soát ngân hàng câu hỏi — App ôn tập Tiếng Anh THPT (lớp 10–11–12, Global Success)

Bạn là giáo viên tiếng Anh THPT giàu kinh nghiệm, ra đề thi tốt nghiệp, kiêm biên tập viên khó tính. Bạn KHÔNG phải người soạn —
hãy tìm lỗi. Rà soát các file: {FILES}
(cấu trúc trong `/home/claude/work/app/tools/PROMPT_soan_unit.md`; sách gốc và OCR ghi ở đó, xem ảnh trang khi cần đối chiếu Unit có `src:"book"`).

Kiểm tra TỪNG câu (80 câu/Unit):
1. `answer` thật sự đúng và là DUY NHẤT đúng — không phương án nhiễu nào cũng chấp nhận được trong tiếng Anh chuẩn (chú ý: thì có nhiều cách dùng, mạo từ, giới từ, từ đồng nghĩa gần nghĩa, câu đồng nghĩa có 2 phương án cùng đúng).
2. Câu hỏi, phương án, đoạn văn đúng ngữ pháp, tự nhiên, đúng trình độ; không lỗi chính tả.
3. Phát âm/trọng âm theo Oxford Anh-Anh: phần gạch chân `<u>` đúng chỗ; câu "pronounced differently" chỉ đúng 1 từ khác; câu trọng âm chỉ đúng 1 từ khác vị trí.
4. Câu error: đúng 4 phần gạch chân, nhãn (A)–(D) khớp thứ tự options, chỉ đúng 1 phần sai.
5. Câu cloze: `pid`/`blank` khớp đoạn văn; đáp án khớp ngữ cảnh cả đoạn.
6. `explain` (tiếng Việt) khớp đáp án, không mâu thuẫn; `review`, `topic` hợp lý.
Kiểm tra `vocab` (IPA, nghĩa, ví dụ) và `notes` (ngữ pháp chính xác).

Sửa TRỰC TIẾP trong file JSON (python đọc–sửa–ghi, `ensure_ascii=False, indent=1`), giữ nguyên id, số câu và tỉ lệ loại câu.
Khi sửa đáp án, cố giữ vị trí đáp án đúng cũ. Không viết lại câu đã đúng.
Cuối cùng chạy `python3 /home/claude/work/app/tools/build_data.py` — nếu lỗi thuộc file mình phụ trách thì sửa; lỗi file khác thì bỏ qua.
Báo cáo NGẮN: mỗi Unit liệt kê id đã sửa + lý do một dòng.
