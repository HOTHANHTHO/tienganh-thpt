#!/usr/bin/env python3
"""Gộp data/toc.json + data/g10|g11|g12/unit*.json thành js/data.bundle.js (kèm kiểm tra).

App mở trực tiếp bằng file:// nên không fetch() được JSON; dữ liệu được nhúng vào
một file JS. Sau khi sửa bất kỳ file JSON nào trong data/, chạy:

    python tools/build_data.py

rồi tăng CACHE_VERSION trong service-worker.js.
"""
import json, glob, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
OUT = os.path.join(ROOT, 'js', 'data.bundle.js')
TYPES = ('vocab', 'grammar', 'pron', 'error', 'rewrite', 'cloze')
CODE = {'vocab': 'V', 'grammar': 'G', 'pron': 'P', 'error': 'E', 'rewrite': 'R', 'cloze': 'C'}
QK = ('id', 'unit', 'type', 'topic', 'level', 'q', 'options', 'answer', 'explain', 'review')
ALLOWED_TAG = re.compile(r'</?(?!u>|b>|i>)[a-zA-Z][^>]*>')

toc = json.load(open(os.path.join(DATA, 'toc.json'), encoding='utf-8'))
units, questions, vocab, passages, ids, errors = [], [], [], {}, set(), []
summary = []
for g in sorted(toc['grades'], key=int):
    gi = int(g)
    files = sorted(glob.glob(os.path.join(DATA, 'g' + g, 'unit*.json')),
                   key=lambda p: int(re.search(r'unit(\d+)', p).group(1)))
    for f in files:
        try:
            d = json.load(open(f, encoding='utf-8'))
        except Exception as e:
            errors.append(f'{f}: JSON lỗi {e}'); continue
        n = d['unit']; k = gi * 100 + n; tag = f'Lớp {g} Unit {n}'
        if d.get('grade', gi) != gi:
            errors.append(f'{tag}: trường grade sai')
        units.append(dict({x: d.get(x) for x in ('unit', 'name', 'vocabTopics', 'pron', 'grammar', 'notes', 'src')}, g=gi, k=k))
        for v in d['vocab']:
            for x in ('w', 'ipa', 'vi'):
                if not v.get(x):
                    errors.append(f'{tag}: từ vựng thiếu {x}: {v}')
            v.update(g=gi, unit=n, k=k)
            vocab.append(v)
        pids = set()
        for p in d.get('passages', []):
            if not p.get('id', '').startswith(f'G{g}U{n}-'):
                errors.append(f'{tag}: id đoạn văn sai {p.get("id")}')
            passages[p['id']] = {'title': p.get('title', ''), 'text': p['text']}
            pids.add(p['id'])
        cnt = collections.Counter()
        for q in d['questions']:
            for x in QK:
                if x not in q:
                    errors.append(f'{tag}: {q.get("id")} thiếu trường {x}')
            qid = q.get('id', '')
            if qid in ids:
                errors.append(f'{tag}: trùng id {qid}')
            ids.add(qid)
            t = q.get('type')
            if t not in TYPES:
                errors.append(f'{qid}: type lạ {t}'); continue
            if not re.fullmatch(rf'G{g}U{n}-{CODE[t]}\d\d', qid):
                errors.append(f'{qid}: id không đúng mẫu G{g}U{n}-{CODE[t]}NN')
            if q.get('unit') != n:
                errors.append(f'{qid}: unit sai')
            if len(q['options']) != 4 or not 0 <= q['answer'] <= 3:
                errors.append(f'{qid}: options/answer không hợp lệ')
            if len(set(o.strip() for o in q['options'])) != 4:
                errors.append(f'{qid}: phương án trùng nhau')
            if q.get('level') not in (1, 2, 3):
                errors.append(f'{qid}: level phải là 1/2/3')
            for s in [q['q'], q['explain']] + q['options']:
                if ALLOWED_TAG.search(s):
                    errors.append(f'{qid}: thẻ HTML không cho phép: {s[:80]}')
            if t == 'cloze':
                if q.get('pid') not in pids or not isinstance(q.get('blank'), int):
                    errors.append(f'{qid}: câu cloze thiếu pid/blank hợp lệ')
                elif f'({q["blank"]})' not in passages[q['pid']]['text']:
                    errors.append(f'{qid}: đoạn văn không có chỗ trống ({q["blank"]})')
            q.update(g=gi, k=k)
            cnt[t] += 1
            questions.append(q)
        summary.append(f'  Lớp {g} Unit {n:>2}: {len(d["vocab"]):>3} từ, {sum(cnt.values()):>3} câu ' +
                       ' '.join(f'{CODE[t]}{cnt[t]}' for t in TYPES) + ('  [theo mục lục]' if d.get('src') == 'bookmap' else ''))
if errors:
    print('\n'.join(errors)); sys.exit(1)

with open(OUT, 'w', encoding='utf-8') as o:
    o.write('// File sinh tự động bởi tools/build_data.py — KHÔNG sửa tay, hãy sửa data/*.json\n')
    o.write('window.TOC = ' + json.dumps(toc, ensure_ascii=False) + ';\n')
    o.write('window.UNITS = ' + json.dumps(units, ensure_ascii=False) + ';\n')
    o.write('window.VOCAB = ' + json.dumps(vocab, ensure_ascii=False) + ';\n')
    o.write('window.PASSAGES = ' + json.dumps(passages, ensure_ascii=False) + ';\n')
    o.write('window.QUESTIONS = ' + json.dumps(questions, ensure_ascii=False) + ';\n')
print('\n'.join(summary))
c = collections.Counter(q['type'] for q in questions)
print(f'OK: {len(units)} unit, {len(vocab)} từ vựng, {len(questions)} câu (' +
      ', '.join(f'{t} {c[t]}' for t in TYPES) + f'), {len(passages)} đoạn văn -> {os.path.relpath(OUT, ROOT)}')
