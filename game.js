// ===== Logika jari & generator soal (dipakai juga oleh test.js) =====
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[rnd(0, arr.length - 1)];
const shuffle = arr => arr.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
const digit = (n, p) => Math.floor(n / p) % 10;
const calc = (a, ops) => ops.reduce((n, [o, b]) => (o === '+' ? n + b : n - b), a);
const PER_LEVEL = 10, PASS = 8;

// Formasi baku satu tangan: [jempol, telunjuk, tengah, manis, kelingking] terbuka?
const fingers = d => { const k = d % 5; return [d >= 5, k >= 1, k >= 2, k >= 3, k >= 4]; };

// Langkah jari kaidah Jarimatika. kind: 'kecil' (komplemen 5) / 'besar' (komplemen 10) / kosong (langsung).
function solve(start, ops) {
  let n = start;
  const out = [];
  const push = (dv, say, kind) => { n += dv; out.push({ v: n, say, kind }); };
  const hand = p => (p === 1 ? 'kanan' : 'kiri');
  function add(p, x) {
    const d = digit(n, p);
    if (d + x > 9) {
      out.push({ v: n, say: `Tambah ${x}, jarinya tidak cukup! Pakai teman besar: buka 1 jari kiri, lalu tutup ${10 - x}, teman besar dari ${x}.`, kind: 'besar' });
      add(p * 10, 1);
      sub(p, 10 - x);
    } else if (x < 5 && d < 5 && d + x >= 5) {
      push(5 * p, `Jarinya tidak cukup! Buka jempol ${hand(p)}, tambah ${5 * p}.`, 'kecil');
      push(-(5 - x) * p, `Tutup ${5 - x} jari. ${5 - x} teman kecil dari ${x}.`, 'kecil');
    } else push(x * p, `Buka jari ${hand(p)}, tambah ${x * p}.`);
  }
  function sub(p, x) {
    const d = digit(n, p);
    if (d < x) {
      out.push({ v: n, say: `Kurang ${x}, jarinya tidak cukup! Pakai teman besar: tutup 1 jari kiri, lalu buka ${10 - x}, teman besar dari ${x}.`, kind: 'besar' });
      sub(p * 10, 1);
      add(p, 10 - x);
    } else if (x < 5 && d >= 5 && d % 5 < x) {
      push(-5 * p, `Jarinya tidak cukup! Tutup jempol ${hand(p)}, kurang ${5 * p}.`, 'kecil');
      push((5 - x) * p, `Buka ${5 - x} jari. ${5 - x} teman kecil dari ${x}.`, 'kecil');
    } else push(-x * p, `Tutup jari ${hand(p)}, kurang ${x * p}.`);
  }
  for (const [op, b] of ops) {
    const t = Math.floor(b / 10), o = b % 10;
    if (op === '+') { if (t) add(10, t); if (o) add(1, o); }
    else { if (t) sub(10, t); if (o) sub(1, o); }
  }
  out.push({ v: n, say: `Hasilnya ${n}!` });
  return out;
}

// "9,1..3 8,2" -> [[9,1],[9,2],[9,3],[8,2]]  (daftar pasangan persis dari blueprint)
const P = s => s.split(' ').flatMap(t => {
  const [a, b] = t.split(','), [lo, hi = lo] = b.split('..').map(Number);
  return Array.from({ length: hi - lo + 1 }, (_, k) => [+a, lo + k]);
});
const P7 = P('1,1 1,2 1,3 2,1 2,2 3,1 1,5 2,5 3,5 4,5 5,1 5,2 5,3 5,4 6,1 6,2 6,3 7,1 7,2 8,1');
const P8 = P('4,1 4,2 4,3 3,1 3,2 2,1 6,1 6,5 7,1 7,2 7,5 7,6 8,1 8,2 8,3 8,5 8,6 8,7 9,1..8');
const P11 = P('4,1 4,2 4,3 4,4 3,2 3,3 3,4 2,3 2,4 1,4');
const P12 = P('5,1 5,2 5,3 5,4 6,2 6,3 6,4 7,3 7,4 8,4');
const P14 = P('9,1..9 8,2 8,3 8,4 8,7 8,8 8,9 7,3 7,4 7,8 7,9 6,4 6,9 5,5 4,6 4,7 4,8 4,9 3,7 3,8 3,9 2,8 2,9 1,9');
const P15 = P('10,1..9 11,2..5 11,7..9 12,3..5 12,8..9 13,4..5 13,9 15,6..9 16,7..9 17,8..9 18,9');
const opQ = (pairs, op) => { const [a, b] = pick(pairs); return { a, ops: [[op, b]] }; };

const WORLDS = [
  { name: 'Pulau Satuan', icon: '🌸', bg: '#ffe3f0' },
  { name: 'Hutan Puluhan', icon: '🌿', bg: '#d8f5e4' },
  { name: 'Lembah Operasi Langsung', icon: '🏞️', bg: '#dcefff' },
  { name: 'Pegunungan Teman Kecil', icon: '⛰️', bg: '#fff0d2' },
  { name: 'Gua Teman Besar', icon: '🔮', bg: '#ebe0ff' },
  { name: 'Istana Mental', icon: '🏰', bg: '#ffdfe7' },
];

// h: tangan tampil — R (kanan saja), L (sorot kiri), LR (dua), hide (tersembunyi, ada 💡), none (tanpa bantuan)
const LEVELS = [
  { n: 'Sahabat Telunjuk', k: 'read', h: 'R', gen: () => rnd(1, 4), pool: [1, 2, 3, 4], tut: [1, 2, 3, 4], st: ['🐰', 'Kelinci Ceria'],
    intro: 'Halo! Ini tangan kanan. Telunjuk, tengah, manis, dan kelingking, nilainya satu-satu.' },
  { n: 'Si Bos Jempol', k: 'read', h: 'R', gen: () => (Math.random() < 0.5 ? 5 : rnd(1, 4)), pool: [1, 2, 3, 4, 5], tut: [5, 3, 5], st: ['👑', 'Mahkota Emas'],
    intro: 'Ini si Bos Jempol! Jempol kanan sendirian nilainya lima, bukan satu.' },
  { n: 'Gabungan Kekuatan', k: 'read', h: 'R', gen: () => rnd(5, 9), pool: [5, 6, 7, 8, 9], tut: [5, 6, 7, 8, 9], st: ['🌟', 'Bintang Pelangi'],
    intro: 'Jempol emas nilainya lima. Tambah jari biru, satu-satu. Ayo gabungkan!' },
  { n: 'Jari Raksasa Kiri', k: 'read', h: 'L', gen: () => 10 * rnd(1, 4), pool: [10, 20, 30, 40], tut: [10, 20, 30, 40], st: ['🦋', 'Kupu-Kupu Biru'],
    intro: 'Sekarang tangan kiri! Satu jari kiri nilainya sepuluh. Tangan kanan mengepal.' },
  { n: 'Jempol Raksasa 50', k: 'read', h: 'L', gen: () => 10 * rnd(5, 9), pool: [50, 60, 70, 80, 90], tut: [50, 60, 70, 80, 90], st: ['🐘', 'Gajah Lucu'],
    intro: 'Jempol kiri adalah jempol raksasa, nilainya lima puluh!' },
  { n: 'Duet Dua Tangan', k: 'read', h: 'LR', gen: () => 10 * rnd(1, 9) + rnd(1, 9), tut: [52, 23], st: ['🧚', 'Peri Hutan'],
    intro: 'Dua tangan berduet! Kiri puluhan, kanan satuan.' },
  { n: 'Tambah Langsung', k: 'op', h: 'R', gen: () => opQ(P7, '+'), tut: [5, '+', 3], st: ['🌻', 'Bunga Matahari'],
    intro: 'Ayo menambah! Buka jari tambahannya.' },
  { n: 'Kurang Langsung', k: 'op', h: 'R', gen: () => opQ(P8, '-'), tut: [8, '-', 3], st: ['🐱', 'Kucing Pita'],
    intro: 'Ayo mengurang! Tutup jarinya.' },
  { n: 'Operasi 2 Digit', k: 'op', h: 'LR',
    gen: () => { const op = pick('+-'), S = op === '+' ? P7 : P8, [ta, tb] = pick(S), [oa, ob] = pick(S); return { a: 10 * ta + oa, ops: [[op, 10 * tb + ob]] }; },
    tut: [22, '+', 51], st: ['🌈', 'Pelangi Kembar'], intro: 'Dua tangan bekerja sama. Kiri dulu untuk puluhan, lalu kanan untuk satuan.' },
  { n: 'Mengenal Teman Kecil', k: 'pair', sum: 5, h: 'R', gen: () => rnd(1, 4), pool: [1, 2, 3, 4], tut: [3, 1], st: ['💎', 'Hati Berlian'],
    intro: 'Teman kecil! Pasangan yang jumlahnya lima: satu dengan empat, dua dengan tiga.' },
  { n: 'Tambah Teman Kecil', k: 'op', h: 'R', gen: () => opQ(P11, '+'), tut: [4, '+', 3], st: ['🦄', 'Unicorn Kecil'],
    intro: 'Kalau jarinya tidak cukup, buka jempol, lalu tutup teman kecilnya.' },
  { n: 'Kurang Teman Kecil', k: 'op', h: 'R', gen: () => opQ(P12, '-'), tut: [6, '-', 2], st: ['🍦', 'Es Krim Ceria'],
    intro: 'Mau kurang tapi jarinya tidak cukup? Tutup jempol, lalu buka teman kecilnya.' },
  { n: 'Mengenal Teman Besar', k: 'pair', sum: 10, h: 'R', gen: () => rnd(1, 9), pool: [1, 2, 3, 4, 5, 6, 7, 8, 9], tut: [4, 7], st: ['🔮', 'Kristal Ajaib'],
    intro: 'Teman besar! Pasangan yang jumlahnya sepuluh. Tembak gelembung yang benar!' },
  { n: 'Tambah Teman Besar', k: 'op', h: 'LR', gen: () => opQ(P14, '+'), tut: [8, '+', 4], st: ['🐉', 'Naga Menggemaskan'],
    intro: 'Jari kanan tidak cukup? Buka satu jari kiri, lalu tutup teman besarnya di kanan.' },
  { n: 'Kurang Teman Besar', k: 'op', h: 'LR', gen: () => opQ(P15, '-'), tut: [12, '-', 5], st: ['🏮', 'Lentera Bintang'],
    intro: 'Mau kurang tapi tidak cukup? Tutup satu jari kiri, lalu buka teman besarnya di kanan.' },
  { n: 'Estafet Jari', k: 'op', h: 'hide', chain: true,
    gen: () => { for (;;) { const a = rnd(1, 9), ops = [[pick('+-'), rnd(1, 9)], [pick('+-'), rnd(1, 9)]], m = calc(a, ops.slice(0, 1)), r = calc(a, ops);
      if (m >= 0 && m <= 19 && r >= 1 && r <= 19) return { a, ops }; } },
    tut: [3, '+', 5, '-', 2], st: ['🚂', 'Kereta Kencana'], intro: 'Tangan di layar sekarang bersembunyi! Pakai jarimu sendiri. Tekan lampu kalau butuh bantuan.' },
  { n: 'Tantangan Master', k: 'op', h: 'hide',
    gen: () => { for (;;) { const op = pick('+-'); let a, b;
      if (op === '+') { a = rnd(10, 89); b = rnd(10, 99 - a); } else { a = rnd(21, 99); b = rnd(10, a - 11); }
      if (solve(a, [[op, b]]).some(s => s.kind)) return { a, ops: [[op, b]] }; } },
    tut: [18, '+', 14], st: ['🏆', 'Piala Berlian'], intro: 'Tantangan master! Pakai kedua tanganmu sendiri, ada teman kecil dan teman besar.' },
  { n: 'Jari Bayangan', k: 'op', h: 'none', timer: 12,
    gen: () => { if (Math.random() < 0.5) { const a = rnd(1, 15); return { a, ops: [['+', rnd(1, Math.min(9, 19 - a))]] }; }
      const a = rnd(5, 19); return { a, ops: [['-', rnd(1, Math.min(9, a - 1))]] }; },
    tut: [], st: ['👸', 'Ratu Matematika Jari Ajaib'], intro: 'Boss terakhir! Taruh tanganmu di meja, bayangkan jarimu bergerak, lalu jawab sebelum waktunya habis!' },
];

const opText = (a, ops) => `${a} ${ops.map(([o, b]) => `${o === '+' ? '+' : '−'} ${b}`).join(' ')}`;
const opSay = (a, ops) => `${a} ${ops.map(([o, b]) => `${o === '+' ? 'tambah' : 'kurang'} ${b}`).join(' ')}`;

function choicesFor(ans, pool) {
  const c = pool ? shuffle(pool.filter(x => x !== ans)).slice(0, 3) : [];
  while (c.length < 3) {
    const x = ans + pick([1, 2, 3, 5, 10, -1, -2, -3, -5, -10]);
    if (x >= 0 && x <= 99 && x !== ans && !c.includes(x)) c.push(x);
  }
  return shuffle([ans, ...c]);
}

const pairSteps = (sum, n) => {
  const w = sum === 5 ? 'kecil' : 'besar';
  return [{ v: n, text: `${n} + ? = ${sum}`, say: `Punya ${n}. Teman ${w} dari ${n} adalah ${sum - n}.` },
          { v: sum === 5 ? 5 : n, text: `${n} + ${sum - n} = ${sum}`, say: `${n} tambah ${sum - n} sama dengan ${sum}!` }];
};
const opSteps = (a, ops) => [{ v: a, text: opText(a, ops) + ' = ?', say: `${opSay(a, ops)}. Buka ${a} dulu.` }, ...solve(a, ops)];

function makeQuestion(i) {
  const L = LEVELS[i];
  let q;
  if (L.k === 'read') {
    const v = L.gen();
    q = { v, answer: v, text: 'Berapa angkanya?', say: 'Tirukan jarinya! Berapa angkanya?', explain: [{ v, say: `Ini angka ${v}. Tirukan ya!` }] };
  } else if (L.k === 'pair') {
    const n = L.gen();
    q = { v: n, answer: L.sum - n, text: `${n} + ? = ${L.sum}`, explain: pairSteps(L.sum, n),
          say: `${n}, teman ${L.sum === 5 ? 'kecil' : 'besar'}nya berapa supaya jadi ${L.sum}?` };
  } else {
    const { a, ops } = L.gen();
    q = { v: a, a, ops, answer: calc(a, ops), text: opText(a, ops) + ' = ?', say: opSay(a, ops) + ', sama dengan berapa?', explain: opSteps(a, ops) };
  }
  q.choices = choicesFor(q.answer, L.pool);
  return q;
}

function tutSteps(i) {
  const L = LEVELS[i], t = L.tut;
  if (L.k === 'read') return t.map(v => ({ v, text: 'Tirukan!', say: `Ini ${v}. Tirukan dengan jarimu!` }));
  if (L.k === 'pair') return t.flatMap(n => pairSteps(L.sum, n));
  if (!t.length) return [];
  const ops = [];
  for (let k = 1; k < t.length; k += 2) ops.push([t[k], t[k + 1]]);
  return opSteps(t[0], ops);
}

if (typeof module !== 'undefined') module.exports = { LEVELS, makeQuestion, solve, calc, fingers, tutSteps, P7, P8, P11, P12, P14, P15, PER_LEVEL };

// ===== Tampilan & alur game (hanya di browser) =====
if (typeof document !== 'undefined') {
  const $ = s => document.querySelector(s);
  const KEY = 'jari-ajaib';
  let best = [];
  try { best = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) {} };
  const passed = i => (best[i] || 0) >= PASS;
  const unlocked = i => i === 0 || passed(i - 1);
  const starsOf = s => (s >= 10 ? 3 : s >= 9 ? 2 : s >= PASS ? 1 : 0);

  // --- suara ---
  let ac;
  function tone(freqs, type = 'sine', dur = 0.15) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, k) => {
        const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + k * dur;
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.8);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur * 2);
      });
    } catch (e) {}
  }
  const ding = () => tone([523, 659, 784, 1047], 'triangle', 0.1);
  const oops = () => tone([330, 262], 'sine', 0.2);
  function utter(text) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID'; u.rate = 0.9; u.pitch = 1.2;
    const v = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').startsWith('id'));
    if (v) u.voice = v;
    return u;
  }
  function speak(text) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel(); speechSynthesis.speak(utter(text));
  }
  // Bicara lalu tunggu selesai (minimal sesuai panjang teks, supaya animasi jari sempat dilihat).
  function speakWait(text) {
    return new Promise(res => {
      const min = Math.max(1600, text.length * 65), t0 = Date.now();
      let done = false;
      const fin = () => { if (!done) { done = true; setTimeout(res, Math.max(300, min - (Date.now() - t0))); } };
      setTimeout(fin, min + 5000);
      if (!window.speechSynthesis) return fin();
      speechSynthesis.cancel();
      const u = utter(text);
      u.onend = u.onerror = fin;
      speechSynthesis.speak(u);
    });
  }

  function confetti(list = ['🌸', '⭐', '💖', '✨', '🎀', '🦋']) {
    for (let k = 0; k < 24; k++) {
      const d = document.createElement('div');
      d.className = 'confetti';
      d.textContent = pick(list);
      d.style.left = rnd(0, 95) + 'vw';
      d.style.animationDelay = Math.random() * 0.4 + 's';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 2200);
    }
  }

  let token = 0; // dinaikkan setiap pindah soal/layar untuk membatalkan animasi yang sedang jalan
  function show(id) {
    token++; clearTimeout(timer);
    if (window.speechSynthesis) speechSynthesis.cancel();
    document.querySelectorAll('.screen').forEach(s => (s.hidden = s.id !== id));
    window.scrollTo(0, 0);
  }

  // --- komponen tangan (SVG) ---
  const FX = [70, 106, 142, 178], FH = [92, 104, 94, 74], FW = 32;
  function handSVG(side) {
    const L = side === 'L', mx = x => (L ? 225 - x - FW : x), val = L ? [50, 10] : [5, 1];
    let s = '<svg viewBox="0 0 225 230" aria-hidden="true">';
    FX.forEach((x, k) => {
      const X = mx(x), top = 140 - FH[k];
      s += `<g class="f" data-i="${k + 1}"><rect x="${X}" y="${top}" width="${FW}" height="${FH[k] + 25}" rx="16"/><text x="${X + FW / 2}" y="${top + 24}">${val[1]}</text></g>`;
    });
    s += `<g transform="translate(${L ? 145 : 80},185) rotate(${L ? 50 : -50})"><g class="f thumb" data-i="0">` +
         `<rect x="-17" y="-88" width="34" height="98" rx="17"/><text x="0" y="-62">${val[0]}</text></g></g>`;
    s += `<rect class="palm" x="${L ? 10 : 65}" y="138" width="150" height="82" rx="38"/></svg>`;
    return s;
  }
  $('#hand-L').insertAdjacentHTML('afterbegin', handSVG('L'));
  $('#hand-R').insertAdjacentHTML('afterbegin', handSVG('R'));
  let shown = 0;
  function setHands(v) {
    if (v == null) return;
    [['L', digit(v, 10), digit(shown, 10)], ['R', v % 10, shown % 10]].forEach(([s, d, pd]) => {
      const st = fingers(d), pst = fingers(pd);
      document.querySelectorAll(`#hand-${s} .f`).forEach(g => {
        const i = +g.dataset.i;
        g.classList.toggle('on', st[i]);
        g.classList.toggle('chg', st[i] !== pst[i]);
      });
    });
    shown = v;
  }

  // --- peta petualangan ---
  function home() {
    const map = $('#worlds');
    map.innerHTML = '';
    WORLDS.forEach((w, wi) => {
      const sec = document.createElement('div');
      sec.className = 'world';
      sec.style.setProperty('--bg', w.bg);
      sec.innerHTML = `<h2>${w.icon} Dunia ${wi + 1}<small>${w.name}</small></h2><div class="path"></div>`;
      [0, 1, 2].forEach(k => {
        const i = wi * 3 + k, L = LEVELS[i], open = unlocked(i), ok = passed(i), st = starsOf(best[i] || 0);
        const b = document.createElement('button');
        b.className = 'node' + (open ? '' : ' locked') + (ok ? ' done' : '');
        b.style.setProperty('--x', [-1, 0, 1][(k + wi) % 3]);
        b.innerHTML = `<span class="dot">${open ? i + 1 : '🔒'}${ok ? `<i class="badge">${L.st[0]}</i>` : ''}</span>
          <span class="nm">${L.n}</span><span class="st">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</span>`;
        b.onclick = () => (open ? startLevel(i) : (oops(), speak('Selesaikan level sebelumnya dulu ya')));
        sec.querySelector('.path').appendChild(b);
      });
      map.appendChild(sec);
    });
    $('#btn-book').textContent = `📖 ${LEVELS.filter((_, i) => passed(i)).length}/18`;
    show('map');
  }

  // --- buku stiker ---
  function book() {
    const g = $('#stickers');
    g.innerHTML = '';
    LEVELS.forEach((L, i) => {
      const ok = passed(i), b = document.createElement('button');
      b.className = 'sticker' + (ok ? '' : ' empty');
      b.innerHTML = `<span class="em">${L.st[0]}</span><span class="nm">${ok ? L.st[1] : '???'}</span>`;
      b.onclick = () => {
        b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle');
        speak(ok ? `Stiker ${L.st[1]}. Hadiah lulus level ${i + 1}, ${L.n}.` : `Lulus level ${i + 1} untuk dapat stiker ini.`);
      };
      g.appendChild(b);
    });
    const n = LEVELS.filter((_, i) => passed(i)).length;
    $('#book-full').hidden = n < 18;
    show('book');
    if (n === 18) confetti(LEVELS.map(L => L.st[0]));
  }

  // --- permainan ---
  let lv, qi, results, q, busy, timer;
  const bubble = t => ($('#bubble').textContent = t);

  function setupView(tut) {
    const L = LEVELS[lv], hs = $('#hands');
    hs.className = 'hands' + (lv < 9 ? ' labels' : '') + (L.h === 'L' ? ' focusL' : '');
    $('#hand-L').hidden = L.h === 'R';
    hs.hidden = L.h === 'none' || (!tut && L.h === 'hide');
    $('#btn-hint').hidden = true;
    $('#timer').hidden = true;
    $('#choices').innerHTML = '';
    $('#after').innerHTML = '';
    $('#progress').innerHTML = Array.from({ length: PER_LEVEL }, (_, k) =>
      `<span class="${tut ? '' : k < qi ? (results[k] ? 'ok' : 'no') : k === qi ? 'now' : ''}"></span>`).join('');
    setHands(0);
  }

  async function play(steps, my) {
    for (const s of steps) {
      if (my !== token) return false;
      if (s.text) $('#eq').textContent = s.text;
      setHands(s.v); bubble(s.say);
      await speakWait(s.say);
    }
    return my === token;
  }

  function button(label, cls, fn) {
    const b = document.createElement('button');
    b.className = cls; b.textContent = label; b.onclick = fn;
    $('#after').appendChild(b);
    return b;
  }

  // Fase tutorial (± 15 detik): tangan di layar mempraktikkan, anak meniru.
  async function startLevel(i) {
    lv = i; qi = 0; results = [];
    show('game');
    const my = token;
    setupView(true);
    $('#eq').textContent = `Level ${i + 1}: ${LEVELS[i].n}`;
    const go = button('Ayo Main! ▶', 'big-btn', () => next());
    bubble(LEVELS[i].intro);
    await speakWait(LEVELS[i].intro);
    if (await play(tutSteps(i), my)) { bubble('Sudah siap? Ayo main! 💪'); go.classList.add('pulse'); }
  }

  async function next() {
    if (qi >= PER_LEVEL) return finish();
    show('game');
    const my = token, L = LEVELS[lv];
    q = makeQuestion(lv);
    busy = false;
    setupView(false);
    setHands(q.v);
    bubble(pick(['Ayo hitung pakai jarimu! 🖐️', 'Kamu pasti bisa! ✨', 'Tirukan dengan jarimu ya 🌸']));
    if (L.chain) { // soal muncul bertahap seperti kereta
      const parts = [String(q.a), ...q.ops.map(([o, b]) => `${o === '+' ? '+' : '−'} ${b}`)];
      for (let k = 1; k <= parts.length; k++) {
        $('#eq').textContent = '🚂 ' + parts.slice(0, k).join(' ');
        speak(k === 1 ? parts[0] : (q.ops[k - 2][0] === '+' ? 'tambah ' : 'kurang ') + q.ops[k - 2][1]);
        await new Promise(r => setTimeout(r, 1500));
        if (my !== token) return;
      }
    }
    $('#eq').textContent = q.text;
    q.choices.forEach(c => {
      const b = document.createElement('button');
      b.className = 'choice' + (L.k === 'pair' && L.sum === 10 ? ' bub' : '');
      b.textContent = c;
      b.onclick = () => answer(b, c);
      $('#choices').appendChild(b);
    });
    $('#btn-hint').hidden = L.k !== 'op' || L.h === 'none';
    speak(L.chain ? 'Sama dengan berapa?' : q.say);
    if (L.timer) {
      const bar = $('#timer');
      bar.hidden = false;
      bar.innerHTML = `<i style="animation-duration:${L.timer}s"></i>`;
      timer = setTimeout(() => answer(null, null), L.timer * 1000);
    }
  }

  async function answer(btn, c) {
    if (busy) return;
    busy = true; token++; clearTimeout(timer);
    const my = token, ok = c === q.answer;
    results[qi] = ok;
    $('#timer').hidden = true;
    $('#btn-hint').hidden = true;
    document.querySelectorAll('.choice').forEach(b => {
      b.disabled = true;
      if (+b.textContent === q.answer) b.classList.add('right');
    });
    if (ok) {
      const p = pick(['Hebat!', 'Pintar sekali!', 'Betul!', 'Luar biasa!', 'Keren!']);
      $('#eq').textContent = q.text.replace('?', q.answer);
      setHands(q.answer); bubble(p + ' 🎉');
      ding(); confetti(); speak(p);
      setTimeout(() => { if (my === token) { qi++; next(); } }, 1600);
      return;
    }
    if (btn) btn.classList.add('wrong');
    oops();
    bubble(btn ? 'Tidak apa-apa, kita lihat caranya 💗' : 'Waktunya habis! ⏰');
    await speakWait(btn ? 'Tidak apa-apa, kita lihat caranya' : 'Waktunya habis');
    $('#hands').hidden = false;
    if (await play(q.explain, my)) button('Lanjut ➜', 'big-btn pulse', () => { qi++; next(); });
  }

  $('#btn-hint').onclick = () => {
    if (busy) return;
    $('#hands').hidden = false;
    play(q.explain.slice(0, -1), ++token).then(() => { if (!busy) setHands(q.v); });
  };

  function finish() {
    const score = results.filter(Boolean).length, ok = score >= PASS, L = LEVELS[lv], first = ok && !passed(lv);
    best[lv] = Math.max(best[lv] || 0, score);
    save();
    show('result');
    $('#result-sticker').textContent = ok ? L.st[0] : '🧚';
    $('#result-score').textContent = `${score} / ${PER_LEVEL} benar  ${'⭐'.repeat(starsOf(score))}`;
    $('#result-text').textContent = ok ? `${first ? 'Hore! Dapat stiker' : 'Hebat! Stiker'} ${L.st[1]}!` : `Hampir! Butuh ${PASS} benar. Ayo coba lagi!`;
    $('#btn-next').hidden = !ok || lv + 1 >= LEVELS.length;
    $('#btn-cert').hidden = !(ok && lv + 1 === LEVELS.length);
    if (ok) { ding(); confetti(); setTimeout(() => confetti([L.st[0]]), 600); } else oops();
    speak($('#result-text').textContent);
  }

  function cert() {
    show('cert');
    try { $('#cert-name').value = localStorage.getItem(KEY + '-nama') || ''; } catch (e) {}
    $('#cert-date').textContent = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    confetti(['👑', '⭐', '💖', '👸', '🏆']); setTimeout(confetti, 700);
    speak('Selamat! Kamu adalah Ratu Matematika Jari Ajaib!');
  }
  $('#cert-name').oninput = e => { try { localStorage.setItem(KEY + '-nama', e.target.value); } catch (er) {} };

  $('#btn-back').onclick = home;
  $('#btn-speak').onclick = () => q && speak(q.say);
  $('#btn-book').onclick = book;
  $('#btn-book-back').onclick = home;
  $('#btn-again').onclick = () => startLevel(lv);
  $('#btn-next').onclick = () => startLevel(lv + 1);
  $('#btn-home').onclick = home;
  $('#btn-cert').onclick = cert;
  $('#btn-cert-back').onclick = home;
  $('#btn-reset').onclick = () => {
    if (confirm('Hapus semua progres dan stiker, mulai dari awal?')) { best = []; save(); home(); }
  };
  if (window.speechSynthesis) speechSynthesis.getVoices();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
  home();
}
