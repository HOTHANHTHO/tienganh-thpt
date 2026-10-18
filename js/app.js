/* Tiếng Anh THPT (10–11–12) – Ôn tập (Global Success). HTML/JS thuần, chạy offline.
   Dữ liệu: window.TOC, UNITS, VOCAB, QUESTIONS, PASSAGES (js/data.bundle.js, sinh bởi tools/build_data.py).
   Mỗi Unit/từ/câu có g (lớp) và k = g*100 + unit (khoá Unit duy nhất). */
(function () {
  'use strict';
  const TOC = window.TOC, ALLU = window.UNITS || [], ALLV = window.VOCAB || [], ALLQ = window.QUESTIONS || [], PSG = window.PASSAGES || {};
  const KEY = 'tathpt_v1';
  const TYPES = ['vocab', 'grammar', 'pron', 'error', 'rewrite', 'cloze'];
  const TYPE_VI = { vocab: 'Từ vựng', grammar: 'Ngữ pháp', pron: 'Phát âm', error: 'Tìm lỗi sai', rewrite: 'Câu đồng nghĩa', cloze: 'Điền đoạn văn' };
  const EXAM_RATIO = { vocab: 0.25, grammar: 0.25, pron: 0.15, error: 0.1, rewrite: 0.125, cloze: 0.125 };
  const LEVEL_VI = { 1: 'Nhận biết', 2: 'Thông hiểu', 3: 'Vận dụng' };
  const GRADES = Object.keys(TOC.grades).map(Number);
  const app = document.getElementById('app');
  const topRight = document.getElementById('topRight');
  let timerId = null, keyHandler = null;

  /* ---------- lưu trữ ---------- */
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.ans) return s; } catch (e) { /* bỏ qua */ }
    return { grade: GRADES[0], ans: {}, known: {}, exams: [] };
  }
  let S = load();
  if (!S.known) S.known = {};
  if (!S.exams) S.exams = [];
  if (!GRADES.includes(S.grade)) S.grade = GRADES[0];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ } }
  function record(q, ok) {
    const a = S.ans[q.id] || { n: 0, c: 0, w: 0 };
    a.n++; if (ok) a.c++; else a.w++;
    a.last = ok ? 1 : 0; a.t = Date.now();
    S.ans[q.id] = a; save();
  }
  const vkey = v => v.k + '|' + v.w;

  /* ---------- dữ liệu theo lớp đang chọn ---------- */
  let G, GT, UNITS, VOCAB, QS;
  function setGrade(g) {
    G = g; GT = TOC.grades[g];
    UNITS = ALLU.filter(u => u.g === g).sort((a, b) => a.unit - b.unit);
    VOCAB = ALLV.filter(v => v.g === g);
    QS = ALLQ.filter(q => q.g === g);
    S.grade = g; save();
    document.getElementById('brandTitle').textContent = 'Tiếng Anh ' + g + ' – Ôn tập';
    document.title = 'Tiếng Anh ' + g + ' – Ôn tập';
    document.querySelectorAll('#gradeSw button').forEach(b => b.classList.toggle('on', +b.dataset.g === g));
    document.getElementById('dbInfo').textContent = 'Lớp ' + g + ': ' + UNITS.length + ' Unit · ' + VOCAB.length + ' từ vựng · ' + QS.length + ' câu hỏi';
  }
  const unitOf = n => UNITS.find(u => u.unit === n);
  const allUnits = () => UNITS.map(u => u.unit);

  /* ---------- tiện ích ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function rich(s) { return esc(s).replace(/&lt;(\/?)(u|b|i)&gt;/g, '<$1$2>'); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function h(html) { app.innerHTML = html; window.scrollTo(0, 0); }
  function pct(c, n) { return n ? Math.round(100 * c / n) : 0; }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } topRight.textContent = ''; topRight.classList.remove('timer', 'warn'); }
  function setKeys(fn) { keyHandler = fn; }
  document.addEventListener('keydown', e => {
    if (!keyHandler) return;
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    keyHandler(e);
  });
  function unitStats(n, type) {
    let n1 = 0, done = 0, c = 0;
    QS.forEach(q => {
      if (q.unit !== n || (type && q.type !== type)) return;
      n1++; const a = S.ans[q.id];
      if (a) { done++; if (a.last) c++; }
    });
    return { total: n1, done, correct: c };
  }
  function knownCount(n) { return VOCAB.filter(v => (!n || v.unit === n) && S.known[vkey(v)]).length; }
  function srcBadge(u) { return u.src === 'bookmap' ? ' <span class="tag bm" title="Bản SGK mẫu không có Unit này; nội dung soạn theo Book map / mục lục, số trang là ước tính">theo mục lục</span>' : ''; }

  /* ---------- phát âm (Web Speech API) ---------- */
  const TTS = 'speechSynthesis' in window;
  let voice = null;
  function pickVoice() {
    if (!TTS) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => /en[-_]GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if (TTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    if (!TTS) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\(.*?\)/g, ''));
    u.lang = voice ? voice.lang : 'en-GB'; if (voice) u.voice = voice; u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  /* ---------- chip chọn Unit / dạng bài ---------- */
  function unitChips(id, selected) {
    return '<div class="chips" id="' + id + '">' +
      '<button class="chip" data-all="1">Tất cả</button><button class="chip" data-hk="1">HK I (Unit ' + rng(GT.hk1) + ')</button><button class="chip" data-hk="2">HK II (Unit ' + rng(GT.hk2) + ')</button></div>' +
      '<div class="chips" style="margin-top:8px" id="' + id + 'U">' +
      UNITS.map(u => '<button class="chip' + (selected.includes(u.unit) ? ' on' : '') + '" data-u="' + u.unit + '" title="' + esc(u.name) + '">Unit ' + u.unit + '</button>').join('') + '</div>';
  }
  function rng(a) { return a.length ? a[0] + '–' + a[a.length - 1] : ''; }
  function bindUnitChips(id) {
    const box = document.getElementById(id + 'U');
    box.addEventListener('click', e => { const b = e.target.closest('[data-u]'); if (b) b.classList.toggle('on'); });
    document.getElementById(id).addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const set = b.dataset.all ? allUnits() : b.dataset.hk === '1' ? GT.hk1 : GT.hk2;
      box.querySelectorAll('[data-u]').forEach(x => x.classList.toggle('on', set.includes(+x.dataset.u)));
    });
    return () => [...box.querySelectorAll('.on')].map(x => +x.dataset.u);
  }
  function toggleChips(id) {
    const box = document.getElementById(id);
    box.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) b.classList.toggle('on'); });
    return () => [...box.querySelectorAll('.on')].map(x => x.dataset.v);
  }
  function radioChips(id) {
    const box = document.getElementById(id);
    box.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; box.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); });
    return () => { const x = box.querySelector('.on'); return x ? x.dataset.v : null; };
  }
  function typeChips(id, on) {
    return '<div class="chips" id="' + id + '">' + TYPES.map(t => '<button class="chip' + ((on || TYPES).includes(t) ? ' on' : '') + '" data-v="' + t + '">' + TYPE_VI[t] + '</button>').join('') + '</div>';
  }

  /* =================== TRANG CHỦ =================== */
  function home() {
    stopTimer(); setKeys(null);
    const answered = QS.filter(q => S.ans[q.id]).length;
    let html = '<div class="gradetabs">' + GRADES.map(g => '<button class="gt' + (g === G ? ' on' : '') + '" data-g="' + g + '"><b>Lớp ' + g + '</b><small>' +
      ALLQ.filter(q => q.g === g).length + ' câu</small></button>').join('') + '</div>' +
      '<h1>Ôn tập Tiếng Anh ' + G + '</h1><p class="lead">Bám sát SGK <b>' + esc(GT.book) + '</b>: ' + VOCAB.length + ' từ vựng, ' + QS.length +
      ' câu trắc nghiệm cho ' + UNITS.length + ' Unit — từ vựng, ngữ pháp, phát âm và các dạng bài thi THPT (tìm lỗi sai, câu đồng nghĩa, điền từ vào đoạn văn). Đã làm ' + answered + ' câu, đã thuộc ' + knownCount() + ' từ.</p>' +
      '<div class="grid">' +
      mode('flash', '🃏', 'Flashcard từ vựng', 'Lật thẻ: từ – phiên âm – nghĩa – ví dụ, nghe phát âm, đánh dấu từ đã thuộc.') +
      mode('practice', '✏️', 'Luyện tập', 'Chọn Unit và dạng bài. Biết đúng sai ngay, có giải thích tiếng Việt.') +
      mode('exam', '⏱️', 'Kiểm tra có giờ', 'Đề trộn theo HK I, HK II, cụm Review hoặc từng Unit; nộp bài mới xem đáp án.') +
      mode('stats', '📊', 'Tiến độ & thống kê', 'Tỉ lệ đúng theo Unit và dạng bài, câu hay sai, lịch sử kiểm tra.') +
      '</div>';
    GT.groups.forEach(t => {
      html += '<div class="theme-h">' + esc(t.name) + '</div><div class="unitgrid">';
      t.units.forEach(n => {
        const u = unitOf(n); if (!u) return;
        const st = unitStats(n), vc = VOCAB.filter(v => v.unit === n).length;
        html += '<div class="ucard"><div class="un">UNIT ' + n + ' · tr. ' + (GT.startPage[n] || '?') + srcBadge(u) + '</div><div class="nm">' + esc(u.name) + '</div>' +
          '<div class="meta">' + esc(u.grammar.join('; ')) + '<br>🔊 ' + esc(u.pron) + '</div>' +
          '<div class="row"><div class="bar"><i style="width:' + pct(st.correct, st.total) + '%"></i></div><span class="hint">' + st.correct + '/' + st.total + ' câu đúng · ' + knownCount(n) + '/' + vc + ' từ thuộc</span></div>' +
          '<div class="acts"><button class="btn sm" data-a="vlist" data-u="' + n + '">📖 Từ vựng</button>' +
          '<button class="btn sm" data-a="notes" data-u="' + n + '">📝 Ghi nhớ</button>' +
          '<button class="btn sm primary" data-a="prac" data-u="' + n + '">✏️ Luyện</button></div></div>';
      });
      html += '</div>';
    });
    h(html);
    app.querySelectorAll('.gt').forEach(b => b.onclick = () => { setGrade(+b.dataset.g); home(); });
    app.querySelectorAll('.mode').forEach(b => b.onclick = () => ({ flash: flashSetup, practice: practiceSetup, exam: examSetup, stats: stats })[b.dataset.m]());
    app.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const n = +b.dataset.u;
      if (b.dataset.a === 'vlist') vocabList(n);
      else if (b.dataset.a === 'notes') notes(n);
      else practiceSetup([n]);
    });
  }
  function mode(m, ic, t, d) { return '<button class="mode" data-m="' + m + '"><span class="ic">' + ic + '</span><span class="t">' + t + '</span><span class="d">' + d + '</span></button>'; }

  /* =================== DANH SÁCH TỪ VỰNG =================== */
  function vocabList(n) {
    stopTimer(); setKeys(null);
    const u = unitOf(n), list = VOCAB.filter(v => v.unit === n);
    h('<h1>Lớp ' + G + ' · Unit ' + n + ': ' + esc(u.name) + srcBadge(u) + '</h1>' +
      '<p class="lead">Chủ đề từ vựng: ' + esc((u.vocabTopics || []).join(', ')) + '. ' + list.length + ' từ/cụm từ. Bấm ○ để đánh dấu đã thuộc.</p>' +
      '<div class="row" style="margin-bottom:12px"><button class="btn primary" id="goFc">🃏 Học flashcard Unit này</button><button class="btn" id="goPr">✏️ Luyện câu hỏi từ vựng</button>' +
      '<span class="spacer"></span><input type="search" id="q" placeholder="Tìm từ hoặc nghĩa..."></div>' +
      '<div class="card" style="padding:6px 8px;overflow-x:auto"><table class="vtable"><thead><tr><th></th><th>Từ</th><th>Phiên âm</th><th>Nghĩa</th><th class="r">Trang</th></tr></thead><tbody id="tb"></tbody></table></div>' +
      '<div class="row"><button class="btn" id="back">← Trang chủ</button><button class="btn" id="nt">📝 Ghi nhớ Unit ' + n + '</button></div>');
    const tb = document.getElementById('tb');
    function draw(filter) {
      const f = (filter || '').toLowerCase();
      tb.innerHTML = list.filter(v => !f || v.w.toLowerCase().includes(f) || v.vi.toLowerCase().includes(f)).map(v => {
        const k = S.known[vkey(v)];
        return '<tr class="' + (k ? 'known' : '') + '"><td class="nw"><button class="btn sm" data-k="' + esc(v.w) + '" title="Đánh dấu đã thuộc">' + (k ? '✓' : '○') + '</button>' +
          (TTS ? ' <button class="btn sm" data-s="' + esc(v.w) + '" title="Nghe">🔊</button>' : '') + '</td>' +
          '<td class="w">' + esc(v.w) + (v.pos ? ' <span class="muted">(' + esc(v.pos) + ')</span>' : '') + '</td><td class="ipa">' + esc(v.ipa) + '</td>' +
          '<td>' + esc(v.vi) + (v.ex ? '<br><small class="muted"><i>' + esc(v.ex) + '</i></small>' : '') + '</td><td class="r">' + (v.page || '') + '</td></tr>';
      }).join('');
    }
    draw();
    document.getElementById('q').oninput = e => draw(e.target.value);
    tb.onclick = e => {
      const s = e.target.closest('[data-s]'); if (s) { speak(s.dataset.s); return; }
      const b = e.target.closest('[data-k]'); if (!b) return;
      const v = list.find(x => x.w === b.dataset.k); const k = vkey(v);
      if (S.known[k]) delete S.known[k]; else S.known[k] = 1;
      save(); draw(document.getElementById('q').value);
    };
    document.getElementById('goFc').onclick = () => flashcards(list, 'en');
    document.getElementById('goPr').onclick = () => startPractice({ units: [n], types: ['vocab'], level: 0, prio: 'new', count: 20 });
    document.getElementById('back').onclick = home;
    document.getElementById('nt').onclick = () => notes(n);
  }

  /* =================== GHI NHỚ =================== */
  function notes(n) {
    stopTimer(); setKeys(null);
    const u = unitOf(n);
    const kindVi = { grammar: 'Ngữ pháp', pron: 'Phát âm', vocab: 'Từ vựng', exam: 'Mẹo làm bài' };
    h('<h1>Ghi nhớ – Lớp ' + G + ' · Unit ' + n + ': ' + esc(u.name) + srcBadge(u) + '</h1><p class="lead">Tóm tắt kiến thức trọng tâm của Unit, kèm số trang sách để mở ra đối chiếu.</p>' +
      (u.notes || []).map(x => '<div class="card note ' + esc(x.kind) + '"><span class="tag ' + esc(x.kind) + '">' + (kindVi[x.kind] || x.kind) + '</span>' +
        (x.page ? ' <span class="hint">SGK tr. ' + esc(x.page) + '</span>' : '') + '<h3>' + esc(x.title) + '</h3><div class="body">' + rich(x.body) + '</div></div>').join('') +
      '<div class="row"><button class="btn" id="back">← Trang chủ</button><button class="btn" id="vl">📖 Từ vựng Unit ' + n + '</button>' +
      '<button class="btn primary" id="pg">✏️ Luyện ngữ pháp</button><button class="btn primary" id="pp">🔊 Luyện phát âm</button></div>');
    document.getElementById('back').onclick = home;
    document.getElementById('vl').onclick = () => vocabList(n);
    document.getElementById('pg').onclick = () => startPractice({ units: [n], types: ['grammar', 'error', 'rewrite'], level: 0, prio: 'new', count: 20 });
    document.getElementById('pp').onclick = () => startPractice({ units: [n], types: ['pron'], level: 0, prio: 'new', count: 12 });
  }

  /* =================== FLASHCARD =================== */
  function flashSetup() {
    stopTimer(); setKeys(null);
    h('<h1>🃏 Flashcard từ vựng – Lớp ' + G + '</h1><p class="lead">Chọn Unit, cách học rồi bấm Bắt đầu. Bấm vào thẻ (hoặc phím Space) để lật, → thẻ sau, ← thẻ trước, K = đã thuộc, P = nghe.</p>' +
      '<div class="card"><h3 style="margin-top:0">Unit</h3>' + unitChips('fu', [1]) +
      '<h3>Mặt trước của thẻ</h3><div class="chips" id="fd"><button class="chip on" data-v="en">Tiếng Anh → nghĩa</button><button class="chip" data-v="vi">Nghĩa → tiếng Anh</button></div>' +
      '<h3>Chọn từ</h3><div class="chips" id="fk"><button class="chip on" data-v="unknown">Chỉ từ chưa thuộc</button><button class="chip" data-v="all">Tất cả</button></div>' +
      '<h3>Thứ tự</h3><div class="chips" id="fo"><button class="chip on" data-v="shuffle">Xáo trộn</button><button class="chip" data-v="book">Theo sách</button></div>' +
      '<div class="row" style="margin-top:16px"><button class="btn primary" id="go">Bắt đầu</button><span class="hint" id="msg"></span></div></div>' +
      '<button class="btn" id="back">← Trang chủ</button>');
    const getU = bindUnitChips('fu'), getD = radioChips('fd'), getK = radioChips('fk'), getO = radioChips('fo');
    document.getElementById('back').onclick = home;
    document.getElementById('go').onclick = () => {
      const us = getU();
      let list = VOCAB.filter(v => us.includes(v.unit));
      if (getK() === 'unknown') list = list.filter(v => !S.known[vkey(v)]);
      if (!list.length) { document.getElementById('msg').textContent = us.length ? 'Các Unit đã chọn không còn từ chưa thuộc — chọn "Tất cả".' : 'Hãy chọn ít nhất một Unit.'; return; }
      flashcards(getO() === 'shuffle' ? shuffle(list) : list, getD());
    };
  }

  function flashcards(list, dir) {
    stopTimer();
    let i = 0, flipped = false;
    function draw() {
      const v = list[i], k = !!S.known[vkey(v)];
      const enSide = '<div class="fc-word">' + esc(v.w) + '</div>' + (v.pos ? '<div class="fc-pos">(' + esc(v.pos) + ')</div>' : '') +
        '<div class="fc-ipa">' + esc(v.ipa) + '</div>' + (TTS ? '<button class="speak" data-s="1">🔊 Nghe</button>' : '');
      const viSide = '<div class="fc-vi">' + esc(v.vi) + '</div>' + (v.ex ? '<div class="fc-ex">“' + esc(v.ex) + '”</div>' : '') +
        '<div class="hint">Lớp ' + v.g + ' · Unit ' + v.unit + (v.page ? ' · SGK tr. ' + v.page : '') + '</div>';
      const front = dir === 'vi' ? '<div class="fc-vi">' + esc(v.vi) + '</div><div class="hint">Unit ' + v.unit + '</div>' : enSide;
      const back = dir === 'vi' ? enSide + (v.ex ? '<div class="fc-ex">“' + esc(v.ex) + '”</div>' : '') : viSide;
      const badge = '<span class="fc-known ' + (k ? 'y">✓ Đã thuộc' : 'n">Chưa thuộc') + '</span>';
      h('<div class="row between"><h2 style="margin:0">Flashcard</h2><span class="hint">Thẻ ' + (i + 1) + ' / ' + list.length + '</span></div>' +
        '<div class="progress"><i style="width:' + pct(i + 1, list.length) + '%"></i></div>' +
        '<div class="fc-wrap"><div class="fc' + (flipped ? ' flip' : '') + '" id="fc">' +
        '<div class="fc-face fc-front">' + badge + front + '<div class="fc-hint">Bấm vào thẻ để lật</div></div>' +
        '<div class="fc-face fc-back">' + badge + back + '</div></div></div>' +
        '<div class="row" style="justify-content:center"><button class="btn" id="prev"' + (i ? '' : ' disabled') + '>← Trước</button>' +
        '<button class="btn" id="unk">✗ Chưa thuộc</button><button class="btn primary" id="kn">✓ Đã thuộc</button>' +
        '<button class="btn" id="next">Sau →</button></div>' +
        '<p class="center hint" style="margin-top:14px">Đã thuộc ' + list.filter(x => S.known[vkey(x)]).length + '/' + list.length + ' từ trong lượt này. ' +
        '<a href="#" id="end">Kết thúc</a></p>');
      const fc = document.getElementById('fc');
      fc.onclick = e => { if (e.target.closest('[data-s]')) { speak(v.w); return; } flipped = !flipped; fc.classList.toggle('flip', flipped); };
      document.getElementById('prev').onclick = () => go(-1);
      document.getElementById('next').onclick = () => go(1);
      document.getElementById('kn').onclick = () => mark(true);
      document.getElementById('unk').onclick = () => mark(false);
      document.getElementById('end').onclick = e => { e.preventDefault(); finish(); };
    }
    function go(d) { const j = i + d; if (j < 0) return; if (j >= list.length) { finish(); return; } i = j; flipped = false; draw(); }
    function mark(ok) { const k = vkey(list[i]); if (ok) S.known[k] = 1; else delete S.known[k]; save(); go(1); }
    function finish() {
      setKeys(null);
      const kn = list.filter(x => S.known[vkey(x)]).length, rest = list.filter(x => !S.known[vkey(x)]);
      h('<div class="card center"><h1>Hoàn thành lượt flashcard 🎉</h1><p class="lead">Đã thuộc ' + kn + ' / ' + list.length + ' từ.</p>' +
        '<div class="row" style="justify-content:center">' + (rest.length ? '<button class="btn primary" id="again">Học lại ' + rest.length + ' từ chưa thuộc</button>' : '') +
        '<button class="btn" id="quiz">✏️ Làm câu hỏi từ vựng các Unit này</button><button class="btn" id="home">← Trang chủ</button></div></div>');
      if (rest.length) document.getElementById('again').onclick = () => flashcards(shuffle(rest), dir);
      document.getElementById('quiz').onclick = () => startPractice({ units: [...new Set(list.map(x => x.unit))], types: ['vocab'], level: 0, prio: 'new', count: 20 });
      document.getElementById('home').onclick = home;
    }
    setKeys(e => {
      if (e.key === ' ') { e.preventDefault(); flipped = !flipped; const fc = document.getElementById('fc'); if (fc) fc.classList.toggle('flip', flipped); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'k' || e.key === 'K') mark(true);
      else if (e.key === 'p' || e.key === 'P') speak(list[i].w);
    });
    draw();
  }

  /* =================== LUYỆN TẬP =================== */
  function practiceSetup(preUnits) {
    stopTimer(); setKeys(null);
    h('<h1>✏️ Luyện tập – Lớp ' + G + '</h1><p class="lead">Làm từng câu, biết đúng/sai ngay. Nếu sai có giải thích bằng tiếng Việt và chỉ chỗ xem lại trong sách.</p>' +
      '<div class="card"><h3 style="margin-top:0">Unit</h3>' + unitChips('pu', preUnits || [1]) +
      '<h3>Dạng bài</h3>' + typeChips('pt') +
      '<div class="row" style="margin-top:14px;align-items:flex-end">' +
      '<label class="f">Mức độ<select id="lv"><option value="0">Tất cả</option><option value="1">Nhận biết</option><option value="2">Thông hiểu</option><option value="3">Vận dụng</option></select></label>' +
      '<label class="f">Ưu tiên<select id="pr"><option value="new">Câu chưa làm trước</option><option value="wrong">Chỉ câu đã sai</option><option value="rand">Ngẫu nhiên</option><option value="order">Theo thứ tự</option></select></label>' +
      '<label class="f">Số câu<select id="ct"><option>10</option><option selected>20</option><option>30</option><option>50</option><option value="999">Tất cả</option></select></label></div>' +
      '<div class="row" style="margin-top:16px"><button class="btn primary" id="go">Bắt đầu</button><span class="hint" id="msg"></span></div></div>' +
      '<button class="btn" id="back">← Trang chủ</button>');
    const getU = bindUnitChips('pu'), getT = toggleChips('pt');
    document.getElementById('back').onclick = home;
    document.getElementById('go').onclick = () => {
      const r = startPractice({ units: getU(), types: getT(), level: +document.getElementById('lv').value, prio: document.getElementById('pr').value, count: +document.getElementById('ct').value });
      if (r) document.getElementById('msg').textContent = r;
    };
  }

  // giữ các câu cùng đoạn văn (cloze) liền nhau, theo thứ tự chỗ trống
  function groupCloze(list) {
    const out = [], seen = new Set();
    list.forEach(q => {
      if (!q.pid) { out.push(q); return; }
      if (seen.has(q.pid)) return; seen.add(q.pid);
      list.filter(x => x.pid === q.pid).sort((a, b) => a.blank - b.blank).forEach(x => out.push(x));
    });
    return out;
  }

  function startPractice(o) {
    if (!o.units.length) return 'Hãy chọn ít nhất một Unit.';
    if (!o.types.length) return 'Hãy chọn ít nhất một dạng bài.';
    let pool = QS.filter(q => o.units.includes(q.unit) && o.types.includes(q.type) && (!o.level || q.level === o.level));
    if (o.prio === 'wrong') pool = pool.filter(q => S.ans[q.id] && S.ans[q.id].last === 0);
    if (!pool.length) return o.prio === 'wrong' ? 'Không có câu nào đang sai trong phạm vi đã chọn 👍' : 'Không có câu phù hợp.';
    if (o.prio === 'new') { const s = shuffle(pool); pool = s.filter(q => !S.ans[q.id]).concat(s.filter(q => S.ans[q.id] && !S.ans[q.id].last), s.filter(q => S.ans[q.id] && S.ans[q.id].last)); }
    else if (o.prio !== 'order') pool = shuffle(pool);
    runPractice(groupCloze(pool.slice(0, o.count)), o);
    return '';
  }

  function qHead(q) {
    return '<div class="qhead"><span class="tag ' + q.type + '">' + TYPE_VI[q.type] + '</span><span class="tag l' + q.level + '">' + LEVEL_VI[q.level] + '</span>' +
      '<span>Lớp ' + q.g + ' · Unit ' + q.unit + ' · ' + esc(q.topic) + '</span></div>';
  }
  // đoạn văn của câu điền khuyết, tô đậm chỗ trống đang hỏi
  function passageHtml(q) {
    if (!q.pid || !PSG[q.pid]) return '';
    const p = PSG[q.pid];
    let t = rich(p.text).replace(/\((\d+)\)\s*_{3,}/g, (m, d) => '<span class="blank' + (+d === q.blank ? ' cur' : '') + '">(' + d + ') ______</span>');
    return '<div class="passage">' + (p.title ? '<div class="ptitle">' + esc(p.title) + '</div>' : '') + '<div class="ptext">' + t + '</div></div>';
  }
  function qBody(q) { return passageHtml(q) + '<div class="qtext">' + rich(q.q) + '</div>'; }
  function optsHtml(q, cls) {
    return '<div class="opts">' + q.options.map((op, k) => '<button class="opt ' + (cls ? cls(k) : '') + '" data-k="' + k + '"><span class="k">' + 'ABCD'[k] + '</span><span>' + rich(op.replace(/^[A-D]\.\s+/, '')) + '</span></button>').join('') + '</div>';
  }

  function runPractice(list, o) {
    let i = 0, right = 0; const wrongs = [];
    function draw() {
      const q = list[i];
      h('<div class="row between"><h2 style="margin:0">Luyện tập</h2><span class="hint">Câu ' + (i + 1) + '/' + list.length + ' · đúng ' + right + '</span></div>' +
        '<div class="progress"><i style="width:' + pct(i, list.length) + '%"></i></div>' +
        '<div class="card">' + qHead(q) + qBody(q) + optsHtml(q) + '<div id="fb"></div></div>' +
        '<div class="row"><button class="btn" id="quit">Kết thúc</button><span class="spacer"></span><span class="hint">Phím <span class="kbd">1</span>–<span class="kbd">4</span> chọn, <span class="kbd">Enter</span> câu tiếp</span></div>');
      app.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(+b.dataset.k));
      document.getElementById('quit').onclick = finish;
    }
    let answered = false;
    function choose(k) {
      if (answered) return; answered = true;
      const q = list[i], ok = k === q.answer;
      record(q, ok); if (ok) right++; else wrongs.push(q);
      app.querySelectorAll('.opt').forEach(b => {
        const j = +b.dataset.k; b.disabled = true;
        if (j === q.answer) b.classList.add('correct'); else if (j === k) b.classList.add('wrong');
      });
      document.getElementById('fb').innerHTML = '<div class="feedback ' + (ok ? 'ok' : 'bad') + '"><div class="verdict">' + (ok ? '✓ Chính xác!' : '✗ Chưa đúng — đáp án: ' + 'ABCD'[q.answer]) + '</div>' +
        '<div class="explain">' + rich(q.explain) + '</div>' + (ok ? '' : '<div class="review"><b>📖 Xem lại trong sách:</b> ' + esc(q.review) + '</div>') + '</div>' +
        '<div class="row" style="margin-top:12px"><span class="spacer"></span><button class="btn primary" id="next">' + (i + 1 < list.length ? 'Câu tiếp →' : 'Xem kết quả') + '</button></div>';
      document.getElementById('next').onclick = next;
      document.getElementById('next').focus();
    }
    function next() { if (!answered) return; answered = false; i++; if (i >= list.length) finish(); else draw(); }
    function finish() {
      setKeys(null);
      const done = i + (answered ? 1 : 0);
      h('<div class="card"><h1>Kết quả luyện tập</h1><div class="score"><span class="big' + (pct(right, done) < 50 ? ' low' : '') + '">' + right + '/' + done + '</span>' +
        '<span class="lead">Tỉ lệ đúng ' + pct(right, done) + '%</span></div></div>' +
        (wrongs.length ? '<h2>Các câu làm sai – cần ôn lại</h2>' + wrongs.map(q => '<div class="card">' + qHead(q) + qBody(q) +
          '<p><b class="ok-c">Đáp án: ' + 'ABCD'[q.answer] + '. ' + rich(q.options[q.answer]) + '</b></p><div class="explain">' + rich(q.explain) + '</div>' +
          '<div class="review"><b>📖 Xem lại:</b> ' + esc(q.review) + '</div></div>').join('') : '') +
        '<div class="row">' + (wrongs.length ? '<button class="btn primary" id="redo">Làm lại ' + wrongs.length + ' câu sai</button>' : '') +
        '<button class="btn" id="more">Luyện tiếp</button><button class="btn" id="home">← Trang chủ</button></div>');
      if (wrongs.length) document.getElementById('redo').onclick = () => runPractice(groupCloze(shuffle(wrongs)), o);
      document.getElementById('more').onclick = () => practiceSetup(o.units);
      document.getElementById('home').onclick = home;
    }
    setKeys(e => {
      const m = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 }[e.key.toLowerCase()];
      if (m !== undefined && !answered) choose(m);
      else if (e.key === 'Enter' && answered) { e.preventDefault(); next(); }
    });
    draw();
  }

  /* =================== KIỂM TRA CÓ GIỜ =================== */
  function buildPaper(units, nq) {
    const pool = QS.filter(q => units.includes(q.unit));
    const want = {}; let sum = 0;
    TYPES.forEach(t => { want[t] = Math.round(nq * EXAM_RATIO[t]); sum += want[t]; });
    // điền đoạn văn đi theo cả đoạn (5 chỗ trống) nên làm tròn bội số 5
    const cz = Math.max(5, 5 * Math.round(nq * EXAM_RATIO.cloze / 5)); sum += cz - want.cloze; want.cloze = cz;
    want.vocab += nq - sum;
    let paper = [];
    TYPES.filter(t => t !== 'cloze').forEach(t => {
      const byU = units.map(n => shuffle(pool.filter(q => q.unit === n && q.type === t)));
      let k = 0; const got = [];
      while (got.length < want[t] && byU.some(a => a.length)) { const a = byU[k % byU.length]; if (a.length) got.push(a.pop()); k++; }
      paper = paper.concat(got);
    });
    paper = shuffle(paper);
    // điền đoạn văn: lấy nguyên đoạn, đặt cuối đề như đề thi thật
    const pids = shuffle([...new Set(pool.filter(q => q.type === 'cloze').map(q => q.pid))]);
    let c = 0;
    for (const pid of pids) {
      if (c >= want.cloze) break;
      const qs = pool.filter(q => q.pid === pid).sort((a, b) => a.blank - b.blank);
      paper = paper.concat(qs); c += qs.length;
    }
    return paper;
  }
  function examSetup() {
    stopTimer(); setKeys(null);
    const opts = '<option value="all">Cả năm (Unit ' + rng(allUnits()) + ')</option><option value="hk1">Học kì I (Unit ' + rng(GT.hk1) + ')</option><option value="hk2">Học kì II (Unit ' + rng(GT.hk2) + ')</option>' +
      GT.groups.map((t, k) => '<option value="t' + k + '">' + esc(t.name) + '</option>').join('') +
      UNITS.map(u => '<option value="u' + u.unit + '">Unit ' + u.unit + ': ' + esc(u.name) + '</option>').join('');
    h('<h1>⏱️ Kiểm tra có giờ – Lớp ' + G + '</h1><p class="lead">Đề trộn ngẫu nhiên, rải đều các Unit: ~25% từ vựng, 25% ngữ pháp, 15% phát âm, 10% tìm lỗi sai, 12,5% câu đồng nghĩa, 12,5% điền đoạn văn (đặt cuối đề). Chỉ khi nộp bài mới hiện đáp án.</p>' +
      '<div class="card"><div class="row" style="align-items:flex-end">' +
      '<label class="f">Phạm vi<select id="sc">' + opts + '</select></label>' +
      '<label class="f">Số câu<select id="nq"><option>20</option><option selected>40</option><option>50</option><option>60</option></select></label>' +
      '<label class="f">Thời gian (phút)<select id="tm"><option>15</option><option>30</option><option selected>45</option><option>60</option></select></label></div>' +
      '<div class="row" style="margin-top:16px"><button class="btn primary" id="go">Bắt đầu làm bài</button></div></div>' +
      '<button class="btn" id="back">← Trang chủ</button>');
    document.getElementById('back').onclick = home;
    document.getElementById('go').onclick = () => {
      const sc = document.getElementById('sc').value, nq = +document.getElementById('nq').value, tm = +document.getElementById('tm').value;
      let units; const label = 'Lớp ' + G + ' – ' + document.getElementById('sc').selectedOptions[0].textContent;
      if (sc === 'all') units = allUnits(); else if (sc === 'hk1') units = GT.hk1; else if (sc === 'hk2') units = GT.hk2;
      else if (sc[0] === 't') units = GT.groups[+sc.slice(1)].units; else units = [+sc.slice(1)];
      runExam(buildPaper(units, nq), tm, label);
    };
  }

  function runExam(list, minutes, label) {
    const ans = new Array(list.length).fill(-1);
    let i = 0, left = minutes * 60, submitted = false;
    stopTimer();
    topRight.classList.add('timer');
    function tick() {
      const m = Math.floor(left / 60), s = left % 60;
      topRight.textContent = '⏱ ' + m + ':' + String(s).padStart(2, '0');
      topRight.classList.toggle('warn', left <= 60);
      if (left <= 0) { submit(true); return; }
      left--;
    }
    tick(); timerId = setInterval(tick, 1000);
    function draw() {
      const q = list[i];
      h('<div class="row between"><h2 style="margin:0">Kiểm tra: ' + esc(label) + '</h2><span class="hint">Đã làm ' + ans.filter(a => a >= 0).length + '/' + list.length + '</span></div>' +
        '<div class="navgrid">' + list.map((_, k) => '<button class="' + (ans[k] >= 0 ? 'done' : '') + (k === i ? ' cur' : '') + '" data-n="' + k + '">' + (k + 1) + '</button>').join('') + '</div>' +
        '<div class="card"><div class="qhead"><b>Câu ' + (i + 1) + '</b><span class="tag ' + q.type + '">' + TYPE_VI[q.type] + '</span></div>' + qBody(q) +
        optsHtml(q, k => ans[i] === k ? 'chosen' : '') + '</div>' +
        '<div class="row"><button class="btn" id="pv"' + (i ? '' : ' disabled') + '>← Câu trước</button><button class="btn" id="nx"' + (i + 1 < list.length ? '' : ' disabled') + '>Câu sau →</button>' +
        '<span class="spacer"></span><button class="btn primary" id="sub">Nộp bài</button></div><p class="hint">Phím <span class="kbd">1</span>–<span class="kbd">4</span> chọn, <span class="kbd">←</span> <span class="kbd">→</span> chuyển câu.</p>');
      app.querySelectorAll('.opt').forEach(b => b.onclick = () => pick(+b.dataset.k));
      app.querySelectorAll('.navgrid button').forEach(b => b.onclick = () => { i = +b.dataset.n; draw(); });
      document.getElementById('pv').onclick = () => { if (i) { i--; draw(); } };
      document.getElementById('nx').onclick = () => { if (i + 1 < list.length) { i++; draw(); } };
      document.getElementById('sub').onclick = () => {
        const miss = ans.filter(a => a < 0).length;
        const box = document.getElementById('cf');
        if (miss && !box) {
          app.insertAdjacentHTML('beforeend', '<div class="card" id="cf" style="border-color:var(--amber)"><b>Còn ' + miss + ' câu chưa làm.</b> Vẫn nộp bài? ' +
            '<button class="btn sm primary" id="yes">Nộp</button> <button class="btn sm" id="no">Làm tiếp</button></div>');
          document.getElementById('yes').onclick = () => submit(false);
          document.getElementById('no').onclick = () => document.getElementById('cf').remove();
          document.getElementById('cf').scrollIntoView();
        } else if (!miss) submit(false);
      };
    }
    function pick(k) { ans[i] = k; if (i + 1 < list.length) { i++; } draw(); }
    function submit(timeout) {
      if (submitted) return; submitted = true; stopTimer(); setKeys(null);
      let right = 0; const byUnit = {};
      list.forEach((q, k) => {
        const ok = ans[k] === q.answer; if (ok) right++;
        if (ans[k] >= 0) record(q, ok);
        const key = 'Unit ' + q.unit + ' – ' + TYPE_VI[q.type];
        byUnit[key] = byUnit[key] || { n: 0, c: 0, topics: new Set() };
        byUnit[key].n++; if (ok) byUnit[key].c++; else byUnit[key].topics.add(q.topic);
      });
      const score = Math.round(100 * right / list.length) / 10;
      S.exams.unshift({ t: Date.now(), g: G, label, n: list.length, c: right, used: minutes * 60 - left });
      S.exams = S.exams.slice(0, 60); save();
      const weak = Object.entries(byUnit).filter(([, v]) => v.c < v.n).sort((a, b) => (a[1].c / a[1].n) - (b[1].c / b[1].n));
      h('<div class="card"><h1>Kết quả kiểm tra' + (timeout ? ' (hết giờ)' : '') + '</h1><div class="score"><span class="big' + (score < 5 ? ' low' : '') + '">' + score.toFixed(1) + '</span>' +
        '<span class="lead">Đúng ' + right + '/' + list.length + ' câu · ' + esc(label) + '</span></div></div>' +
        (weak.length ? '<h2>Cần ôn lại</h2><div class="card" style="overflow-x:auto"><table><tr><th>Phần</th><th class="r">Đúng</th><th>Nội dung sai</th></tr>' +
          weak.map(([k, v]) => '<tr><td>' + k + '</td><td class="r">' + v.c + '/' + v.n + '</td><td>' + esc([...v.topics].join('; ')) + '</td></tr>').join('') + '</table></div>' : '<p class="lead">Xuất sắc, không sai câu nào! 🎉</p>') +
        '<h2>Đáp án chi tiết</h2>' +
        list.map((q, k) => {
          const ok = ans[k] === q.answer;
          const showP = q.pid && (k === 0 || list[k - 1].pid !== q.pid);
          return '<div class="card"><div class="qhead"><b>Câu ' + (k + 1) + '</b><span class="' + (ok ? 'ok-c' : 'bad-c') + '"><b>' + (ok ? '✓ Đúng' : ans[k] < 0 ? '— Bỏ trống' : '✗ Sai') + '</b></span>' +
            '<span class="tag ' + q.type + '">' + TYPE_VI[q.type] + '</span><span>Unit ' + q.unit + ' · ' + esc(q.topic) + '</span></div>' +
            (showP ? passageHtml(q) : '') + '<div class="qtext">' + rich(q.q) + '</div>' +
            optsHtml(q, j => j === q.answer ? 'correct' : j === ans[k] ? 'wrong' : '') +
            '<div class="feedback ' + (ok ? 'ok' : 'bad') + '"><div class="explain">' + rich(q.explain) + '</div>' + (ok ? '' : '<div class="review"><b>📖 Xem lại:</b> ' + esc(q.review) + '</div>') + '</div></div>';
        }).join('') +
        '<div class="row"><button class="btn primary" id="again">Làm đề khác</button><button class="btn" id="home">← Trang chủ</button></div>');
      app.querySelectorAll('.opt').forEach(b => b.disabled = true);
      document.getElementById('again').onclick = examSetup;
      document.getElementById('home').onclick = home;
    }
    setKeys(e => {
      const m = { '1': 0, '2': 1, '3': 2, '4': 3 }[e.key];
      if (m !== undefined) pick(m);
      else if (e.key === 'ArrowRight' && i + 1 < list.length) { i++; draw(); }
      else if (e.key === 'ArrowLeft' && i) { i--; draw(); }
    });
    draw();
  }

  /* =================== THỐNG KÊ =================== */
  function stats() {
    stopTimer(); setKeys(null);
    const mine = QS.filter(q => S.ans[q.id]);
    let tot = 0, cor = 0; mine.forEach(q => { tot += S.ans[q.id].n; cor += S.ans[q.id].c; });
    const rows = UNITS.map(u => {
      const cells = TYPES.map(t => { const s = unitStats(u.unit, t); return '<td class="r">' + (s.done ? pct(s.correct, s.done) + '% <small class="muted">(' + s.done + '/' + s.total + ')</small>' : '<span class="muted">–</span>') + '</td>'; }).join('');
      const vc = VOCAB.filter(v => v.unit === u.unit).length;
      return '<tr><td>Unit ' + u.unit + ': ' + esc(u.name) + '</td>' + cells + '<td class="r">' + knownCount(u.unit) + '/' + vc + '</td></tr>';
    }).join('');
    const hard = QS.filter(q => S.ans[q.id] && S.ans[q.id].w).sort((a, b) => S.ans[b.id].w - S.ans[a.id].w).slice(0, 10);
    const wrongNow = QS.filter(q => S.ans[q.id] && S.ans[q.id].last === 0);
    const exams = S.exams.filter(x => !x.g || x.g === G);
    h('<h1>📊 Tiến độ & thống kê – Lớp ' + G + '</h1><div class="stat">' +
      '<div><b>' + mine.length + '/' + QS.length + '</b><span>câu đã làm ít nhất 1 lần</span></div>' +
      '<div><b>' + pct(cor, tot) + '%</b><span>tỉ lệ đúng (tất cả lượt)</span></div>' +
      '<div><b>' + wrongNow.length + '</b><span>câu đang sai (lần gần nhất)</span></div>' +
      '<div><b>' + knownCount() + '/' + VOCAB.length + '</b><span>từ vựng đã thuộc</span></div></div>' +
      '<h2>Theo Unit và dạng bài</h2><p class="hint">Tỉ lệ đúng tính theo lần trả lời gần nhất của mỗi câu.</p><div class="card" style="overflow-x:auto;padding:6px 8px"><table><tr><th>Unit</th>' +
      TYPES.map(t => '<th class="r">' + TYPE_VI[t] + '</th>').join('') + '<th class="r">Từ đã thuộc</th></tr>' + rows + '</table></div>' +
      (wrongNow.length ? '<button class="btn primary" id="redoW">Luyện lại ' + wrongNow.length + ' câu đang sai</button>' : '') +
      (hard.length ? '<h2>Câu hay sai nhất</h2><div class="card" style="overflow-x:auto;padding:6px 8px"><table><tr><th>Câu</th><th>Nội dung</th><th class="r">Sai</th></tr>' +
        hard.map(q => '<tr><td>' + q.id + '</td><td>' + rich(q.q).slice(0, 400) + '<br><small class="muted">' + esc(q.review) + '</small></td><td class="r">' + S.ans[q.id].w + '</td></tr>').join('') + '</table></div>' : '') +
      (exams.length ? '<h2>Lịch sử kiểm tra</h2><div class="card" style="overflow-x:auto;padding:6px 8px"><table><tr><th>Thời gian</th><th>Phạm vi</th><th class="r">Điểm</th><th class="r">Đúng</th></tr>' +
        exams.map(x => '<tr><td>' + new Date(x.t).toLocaleString('vi-VN') + '</td><td>' + esc(x.label) + '</td><td class="r"><b>' + (Math.round(100 * x.c / x.n) / 10).toFixed(1) + '</b></td><td class="r">' + x.c + '/' + x.n + '</td></tr>').join('') + '</table></div>' : '') +
      '<div class="row" style="margin-top:18px"><button class="btn" id="back">← Trang chủ</button><span class="spacer"></span><button class="btn danger" id="reset">Xoá tiến độ lớp ' + G + '</button></div>');
    document.getElementById('back').onclick = home;
    if (wrongNow.length) document.getElementById('redoW').onclick = () => runPractice(groupCloze(shuffle(wrongNow)), { units: allUnits(), types: TYPES });
    document.getElementById('reset').onclick = () => {
      if (document.getElementById('cf')) return;
      app.insertAdjacentHTML('beforeend', '<div class="card" id="cf" style="border-color:var(--red)"><b>Xoá kết quả làm bài, từ đã thuộc và lịch sử kiểm tra của lớp ' + G + ' trên máy này?</b> ' +
        '<button class="btn sm danger" id="yes">Xoá</button> <button class="btn sm" id="no">Huỷ</button></div>');
      document.getElementById('yes').onclick = () => {
        QS.forEach(q => delete S.ans[q.id]);
        VOCAB.forEach(v => delete S.known[vkey(v)]);
        S.exams = S.exams.filter(x => x.g && x.g !== G);
        save(); stats();
      };
      document.getElementById('no').onclick = () => document.getElementById('cf').remove();
    };
  }

  /* ---------- khởi động ---------- */
  document.getElementById('gradeSw').innerHTML = GRADES.map(g => '<button data-g="' + g + '">' + g + '</button>').join('');
  document.getElementById('gradeSw').onclick = e => { const b = e.target.closest('[data-g]'); if (b) { setGrade(+b.dataset.g); home(); } };
  document.getElementById('btnHome').onclick = home;
  setGrade(S.grade);
  window.__app = { home, flashSetup, practiceSetup, examSetup, stats, vocabList, notes, runExam, startPractice, buildPaper, setGrade };
  home();
})();
