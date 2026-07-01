/**
 * app.js — all client-side behavior for the site.
 *
 * Three independent pieces live here:
 *   1. Boot + scroll-reveal — tiny page setup.
 *   2. The scripted "agent" — a deterministic keyword router dressed up to look
 *      like a retrieval-augmented-generation (RAG) chatbot. No model, no network.
 *   3. The embedding-space canvas animation — an ambient point cloud behind the
 *      console that reacts when the agent "retrieves".
 *
 * Depends on data.js (the KB and routing tables), which MUST load first. Both
 * files are plain classic scripts loaded with `defer`, so their top-level
 * `const`s share one scope and run in document order.
 */

/* ============================================================
   1. Boot + scroll reveal
   ============================================================ */

// Stamp the current year into the footer's <span id="yr">.
document.getElementById('yr').textContent = new Date().getFullYear();

/**
 * True when the user's OS requests reduced motion. Read throughout the agent and
 * the canvas to skip typing delays and slow rotation. @type {boolean}
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fade each `.reveal` element in once it scrolls into view, then stop watching it.
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ============================================================
   2. The scripted agent — question matching
   ============================================================ */

/**
 * Levenshtein edit distance between two strings, bounded for speed: as soon as
 * the answer is clearly beyond our typo tolerance it returns 3 instead of the
 * true (larger) distance. Used to forgive small typos when matching keywords.
 *
 * @param {string} a - First string (typically a word the user typed).
 * @param {string} b - Second string (typically a keyword from the KB).
 * @returns {number} Edit distance, or 3 if it is provably greater than 2.
 */
function editDistance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0]; dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[m];
}

/**
 * Pick the knowledge-base entry that best answers a question. Scores every entry
 * by keyword overlap (exact phrase > whole word > substring > fuzzy/typo match),
 * after first checking the EXACT map for one-word inputs like "hi".
 *
 * @param {string} qRaw - The raw text the user typed.
 * @returns {{item: KBEntry|null, score: number}} The best entry and its score.
 *   score >= 2 is a confident match, 1 is a weak/typo guess, 0 is no match
 *   (item is null). An EXACT hit returns score 99.
 */
function route(qRaw) {
  const norm = qRaw.toLowerCase().trim();
  if (EXACT[norm]) { const f = KB.find(x => x.id === EXACT[norm]); if (f) return { item: f, score: 99 }; }
  const q = " " + norm.replace(/[^a-z0-9äöüß ]/g, " ") + " ";
  const tokens = q.trim().split(/\s+/).filter(w => w.length >= 4);   // longer words only, for fuzzy
  let best = null, bestScore = 0;
  for (const item of KB) {
    let s = 0;
    for (const kw of item.k) {
      let hit = 0;
      if (q.includes(" " + kw + " ")) hit = kw.includes(" ") ? 3 : 2;        // word / phrase hit
      else if (q.includes(kw)) hit = kw.includes(" ") ? 2 : 1;               // substring hit
      else if (tokens.length && kw.indexOf(" ") === -1 && kw.length >= 4) {  // fuzzy single-word hit (typos)
        const thr = kw.length <= 6 ? 1 : 2;
        for (const tk of tokens) { if (Math.abs(tk.length - kw.length) <= thr && editDistance(tk, kw) <= thr) { hit = 1; break; } }
      }
      s += hit;
    }
    if (s > bestScore) { bestScore = s; best = item; }
  }
  return { item: bestScore > 0 ? best : null, score: bestScore };
}

/* ============================================================
   2b. The scripted agent — DOM rendering helpers
   ============================================================ */

// Cached references to the console's elements (defined once in index.html).
const transcript = document.getElementById('transcript'), input = document.getElementById('q'),
  sendBtn = document.getElementById('send'), chipsEl = document.getElementById('chips'),
  statusEl = document.getElementById('status'), statusText = document.getElementById('statusText'),
  // The three pipeline indicators: plan -> retrieve -> respond.
  nodes = { plan: document.querySelector('[data-node=plan]'), retrieve: document.querySelector('[data-node=retrieve]'), respond: document.querySelector('[data-node=respond]') };

/** Guard so a new question can't start while one is still "thinking". @type {boolean} */
let busy = false;

// Build the starter suggestion buttons from CHIPS; clicking one submits its query.
CHIPS.forEach(([label, query]) => {
  const b = document.createElement('button'); b.className = 'chip'; b.textContent = label;
  b.onclick = () => { if (!busy) { input.value = query; submit(); } };
  chipsEl.appendChild(b);
});

/**
 * Append a chat row to the transcript and scroll it into view.
 *
 * @param {string} who - Speaker label shown on the row, e.g. "you" or "agent".
 * @param {string} cls - Extra CSS class for styling, e.g. "user" or "agent".
 * @returns {HTMLSpanElement} The empty body span — set its text to fill the row.
 */
function addMsg(who, cls) {
  const d = document.createElement('div'); d.className = 'msg ' + cls;
  const w = document.createElement('span'); w.className = 'who'; w.textContent = who;
  const body = document.createElement('span'); body.className = 'body';
  d.appendChild(w); d.appendChild(body);
  transcript.appendChild(d); transcript.scrollTop = transcript.scrollHeight; return body;
}

/**
 * Set the visual state of one pipeline node.
 * @param {'plan'|'retrieve'|'respond'} name - Which node to update.
 * @param {'active'|'done'|''} state - New state; '' clears it.
 */
function setNode(name, state) { const n = nodes[name]; n.classList.remove('active', 'done'); if (state) n.classList.add(state); }

/** Clear the active/done state from all pipeline nodes. */
function resetNodes() { Object.values(nodes).forEach(n => n.classList.remove('active', 'done')); }

/**
 * Update the status pill in the console header.
 * @param {boolean} b - Whether the agent is busy (drives the pulsing dot).
 * @param {string} txt - Status label, e.g. "planning" or "idle".
 */
function setStatus(b, txt) { statusEl.classList.toggle('busy', b); statusText.textContent = txt; }

/**
 * Promise that resolves after `ms` milliseconds — or immediately if the user
 * prefers reduced motion. Lets `async` code `await` between animation steps.
 * @param {number} ms - Delay in milliseconds.
 * @returns {Promise<void>}
 */
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

/**
 * Reveal text word by word with a blinking caret to fake live typing. Resolves
 * when done. Renders instantly when reduced motion is requested.
 *
 * @param {HTMLElement} el - Element whose textContent is filled in.
 * @param {string} text - Full text to type out.
 * @returns {Promise<void>}
 */
async function typeOut(el, text) {
  if (reduce) { el.textContent = text; transcript.scrollTop = transcript.scrollHeight; return; }
  el.classList.add('caret');
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    el.textContent += (i ? " " : "") + words[i];
    transcript.scrollTop = transcript.scrollHeight;
    await wait(16 + Math.random() * 20);
  }
  el.classList.remove('caret');
}

/**
 * Render the row of follow-up suggestion buttons under the latest answer.
 * @param {Array<[string, string]>} items - [label, query] pairs; label is shown,
 *   query is submitted on click. No-op for an empty/missing list.
 */
function renderFollowups(items) {
  if (!items || !items.length) return;
  const wrap = document.createElement('div'); wrap.className = 'followups';
  items.forEach(([label, query]) => {
    const b = document.createElement('button'); b.className = 'followup'; b.textContent = label;
    b.onclick = () => { if (!busy) { input.value = query; submit(); } };
    wrap.appendChild(b);
  });
  transcript.appendChild(wrap); transcript.scrollTop = transcript.scrollHeight;
}

/* ============================================================
   2c. The scripted agent — main request flow
   ============================================================ */

/**
 * Handle one question end to end: echo it, animate the plan -> retrieve ->
 * respond pipeline (pinging the canvas on "retrieve"), route it to a KB answer,
 * type the answer out, and show follow-up suggestions. Reads the input box; does
 * nothing if it is empty or the agent is already busy.
 * @returns {Promise<void>}
 */
async function submit() {
  const qv = input.value.trim(); if (!qv || busy) return;
  busy = true; input.value = ""; sendBtn.disabled = true;
  transcript.querySelectorAll('.followups').forEach(e => e.remove());   // keep only the latest follow-ups
  addMsg('you', 'user').textContent = qv;

  setStatus(true, 'planning'); resetNodes(); setNode('plan', 'active'); await wait(400);
  setNode('plan', 'done'); setNode('retrieve', 'active'); setStatus(true, 'retrieving');
  if (window.cloudPing) window.cloudPing();
  const routed = route(qv); const match = routed.item; const confident = routed.score >= 2;
  const src = match ? match.src : "profile/index";
  const r = document.createElement('div'); r.className = 'msg retrieved';
  const s1 = document.createElement('span'); s1.textContent = '▸ retrieved context:';
  const sec = match && SECTION[match.id];
  const s2 = document.createElement(sec ? 'a' : 'b');
  s2.textContent = match ? src : "no confident match";
  if (sec) { s2.className = 'srclink'; s2.href = '#' + sec; s2.title = 'Jump to the ' + sec + ' section'; }
  r.appendChild(s1); r.appendChild(s2);
  transcript.appendChild(r); transcript.scrollTop = transcript.scrollHeight; await wait(500);
  setNode('retrieve', 'done'); setNode('respond', 'active'); setStatus(true, 'responding');
  const body = addMsg('agent', 'agent'); await wait(150);
  const answer = !match ? FALLBACK : (confident ? match.a : "I'm not fully sure I caught that, but my best guess: " + match.a);
  await typeOut(body, answer);

  renderFollowups(match ? (NEXT[match.id] || DEFAULT_NEXT) : BROWSE);
  setNode('respond', 'done'); setStatus(false, 'idle');
  busy = false; sendBtn.disabled = false; input.focus();
}

// Wire up the controls and greet the visitor on load.
sendBtn.onclick = submit;
input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
(function () { const b = addMsg('agent', 'agent'); typeOut(b, GREETING); })();

/* ============================================================
   3. Ambient point cloud (subdued, behind the console)
   ------------------------------------------------------------
   Visualizes an embedding space: K clusters of points in a "vector store"; a
   query point lights up and draws lines to its nearest neighbours, mirroring how
   retrieval works. submit() calls window.cloudPing() to trigger a fresh query.
   Wrapped in an IIFE so its many locals never leak into the agent's scope.
   ============================================================ */
(function () {
  const canvas = document.getElementById('cloud'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); let W = 0, H = 0, DPR = 1;

  /** Match the canvas's backing store to its CSS size and the device pixel ratio (capped at 2 for performance). */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2); W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // Depth palette: Near, Mid, Far point colors (RGB triples).
  const CN = [233, 224, 96], CM = [200, 188, 74], CF = [145, 135, 54];
  /** Linear interpolation between a and b at fraction t. */
  const lp = (a, b, t) => a + (b - a) * t;

  /**
   * Color for a point at normalized depth d, ramping Near -> Mid -> Far.
   * @param {number} d - Depth in [0, 1] (0 = nearest, 1 = farthest).
   * @returns {[number, number, number]} RGB triple, components 0-255.
   */
  function col(d) { let r, g, b; if (d < .5) { const t = d / .5; r = lp(CN[0], CM[0], t); g = lp(CN[1], CM[1], t); b = lp(CN[2], CM[2], t); } else { const t = (d - .5) / .5; r = lp(CM[0], CF[0], t); g = lp(CM[1], CF[1], t); b = lp(CM[2], CF[2], t); } return [r | 0, g | 0, b | 0]; }

  /**
   * Read a CSS custom property as an RGB triple so the highlight colors track
   * the active theme. Falls back if the variable is missing or not a hex color.
   * @param {string} name - CSS variable name, e.g. "--accent".
   * @param {[number, number, number]} fb - Fallback RGB triple.
   * @returns {[number, number, number]} Parsed (or fallback) RGB triple.
   */
  function rgbVar(name, fb) {
    try {
      let v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (v[0] === '#') { if (v.length === 4) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]; return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]; }
    } catch (e) { } return fb;
  }
  const ACC = rgbVar('--cloud-q', rgbVar('--accent', [227, 179, 119])), ACC2 = rgbVar('--cloud-n', rgbVar('--accent-2', [111, 194, 138]));

  // ---- Build the point cloud: K clusters, each `per` points, centered on origin ----
  const DEN = window.innerWidth < 700 ? 0.6 : 1;                 // fewer points on small screens
  const K = 7, per = Math.round(140 * DEN), pts = [], cen = [];
  const g3 = () => (Math.random() + Math.random() + Math.random() - 1.5);   // rough gaussian via 3 uniforms
  for (let k = 0; k < K; k++) cen.push([(Math.random() * 2 - 1) * 0.72, (Math.random() * 2 - 1) * 0.6, (Math.random() * 2 - 1) * 0.72]);
  for (let k = 0; k < K; k++) for (let i = 0; i < per; i++) {
    const c = cen[k];
    pts.push({ x: c[0] + g3() * 0.15, y: c[1] + g3() * 0.15, z: c[2] + g3() * 0.15, born: Math.random() });
  }
  // Recenter the whole cloud on its centroid so rotation looks balanced.
  (function () { let ax = 0, ay = 0, az = 0; for (const p of pts) { ax += p.x; ay += p.y; az += p.z; } ax /= pts.length; ay /= pts.length; az /= pts.length; for (const p of pts) { p.x -= ax; p.y -= ay; p.z -= az; } })();

  let q = -1, nbr = new Set(), qt = 0, pending = false;   // current query index, its neighbours, query time, ping flag

  /** Pick a random query point and compute its 8 nearest neighbours by squared distance. */
  function newQuery() {
    q = (Math.random() * pts.length) | 0; const o = pts[q];
    const ds = pts.map((p, i) => [i, (p.x - o.x) * (p.x - o.x) + (p.y - o.y) * (p.y - o.y) + (p.z - o.z) * (p.z - o.z)]);
    ds.sort((a, b) => a[1] - b[1]); nbr = new Set(ds.slice(1, 9).map(d => d[0]));
  }
  newQuery();

  /** Exposed so the agent can request a fresh "retrieval" when it hits its retrieve step. */
  window.cloudPing = function () { pending = true; };

  // Pointer parallax: target (tmx,tmy) is the raw cursor offset; (mx,my) eases toward it.
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  window.addEventListener('pointermove', e => { tmx = e.clientX / window.innerWidth - .5; tmy = e.clientY / window.innerHeight - .5; });
  const start = performance.now();

  /**
   * One animation frame: advance time, rotate every point in 3D, project to 2D
   * with perspective, then draw neighbour links and depth-sorted dots. Re-arms
   * itself via requestAnimationFrame.
   * @param {DOMHighResTimeStamp} now - Timestamp supplied by requestAnimationFrame.
   */
  function frame(now) {
    const t = (now - start) / 1000, intro = reduce ? 1 : Math.min(1, t / 2.2);
    if (pending) { pending = false; newQuery(); qt = t; } else if (!reduce && t - qt > 2.8) { newQuery(); qt = t; }
    mx += (tmx - mx) * .05; my += (tmy - my) * .05;
    const yaw = (reduce ? 0.5 : t * 0.12) + mx * 0.5, tilt = 0.06 + my * 0.3;
    ctx.clearRect(0, 0, W, H);
    const cx = W * 0.5, cy = H * 0.5, scale = Math.min(W * 0.58, H * 1.35), zoff = 1.25;
    const ca = Math.cos(yaw), sa = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt); const P = [];
    // Rotate (yaw then tilt), push back by zoff, and perspective-project each point.
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]; if (p.born > intro) { P[i] = null; continue; }
      let x1 = p.x * ca - p.z * sa, z1 = p.x * sa + p.z * ca, y1 = p.y * ct - z1 * st, z2 = p.y * st + z1 * ct + zoff;
      if (z2 <= 0.06) { P[i] = null; continue; } const pe = 2.2 / (2.2 + z2);
      P[i] = { sx: cx + x1 * scale * pe, sy: cy + y1 * scale * pe, pe: pe, zc: z2 - zoff };
    }
    const ramp = Math.min(1, (t - qt) * 2);   // 0->1 ease-in after each new query
    // Lines from the query point to its neighbours.
    if (q >= 0 && P[q]) {
      ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(" + ACC2[0] + "," + ACC2[1] + "," + ACC2[2] + "," + (0.6 * ramp) + ")";
      nbr.forEach(i => { if (P[i]) { ctx.beginPath(); ctx.moveTo(P[q].sx, P[q].sy); ctx.lineTo(P[i].sx, P[i].sy); ctx.stroke(); } });
    }
    // Draw dots far-to-near so nearer ones paint on top; highlight neighbours and the query.
    const order = []; for (let i = 0; i < pts.length; i++) if (P[i]) order.push(i);
    order.sort((a, b) => P[a].zc - P[b].zc);
    for (const i of order) {
      const pr = P[i]; const d = Math.max(0, Math.min(1, (pr.zc + 1) / 2)); let c = col(d), near = 1 - d;
      let sz = (0.5 + near * 1.3) * pr.pe, al = 0.42 * Math.min(1, (intro - pts[i].born) * 4 + 0.2);
      if (nbr.has(i)) { c = ACC2; sz = 2.0 * pr.pe; al = 0.5 + 0.45 * ramp; }
      if (i === q) { c = ACC; sz = 3.0 * pr.pe; al = 1; }
      ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + al + ")"; ctx.beginPath(); ctx.arc(pr.sx, pr.sy, Math.max(0.5, sz), 0, 6.283); ctx.fill();
      if (i === q) { ctx.lineWidth = 1; ctx.strokeStyle = "rgba(" + ACC[0] + "," + ACC[1] + "," + ACC[2] + "," + (0.55 * ramp) + ")"; ctx.beginPath(); ctx.arc(pr.sx, pr.sy, sz + 4.5, 0, 6.283); ctx.stroke(); }
    }
    requestAnimationFrame(frame);
  }
  resize(); window.addEventListener('resize', resize); requestAnimationFrame(frame);
})();
