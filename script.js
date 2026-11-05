// script.js — window manager, folders, theme, music + little desktop toys

const html = document.documentElement;
const isMobile = () => window.matchMedia('(max-width: 700px)').matches;
const isWide = () => window.matchMedia('(min-width: 1181px)').matches;

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch (e) { return null; }
}

/* ==========================================================
   window manager — open / close / focus / drag / min / max
   ========================================================== */
let topZ = 20;
let cascade = 0;
const minTray = document.getElementById('minTray');

const scrim = document.getElementById('scrim');
function updateScrim() {
  const anyOpen = [...document.querySelectorAll('.window-popup.open')].some((w) => !w.classList.contains('closing'));
  scrim.classList.toggle('show', anyOpen && isMobile());
  document.body.style.overflow = anyOpen && isMobile() ? 'hidden' : '';
}
scrim.addEventListener('click', () => {
  document.querySelectorAll('.window-popup.open').forEach((w) => closeWindow(w));
});

function focusWindow(win) {
  document.querySelectorAll('.window-popup.focused').forEach((w) => w.classList.remove('focused'));
  win.style.zIndex = ++topZ;
  win.classList.add('focused');
}

function placeWindow(win) {
  if (win.dataset.placed || isMobile()) return;
  // first time a window opens: put it near the centre, cascading a little each time
  const w = Math.min(win.offsetWidth, window.innerWidth - 24);
  const h = Math.min(win.offsetHeight, window.innerHeight - 40);
  const offset = (cascade++ % 5) * 28;
  const left = Math.max(12, (window.innerWidth - w) / 2 - 60 + offset);
  const top = Math.max(20, Math.min((window.innerHeight - h) / 2 - 20 + offset, window.innerHeight - h - 20));
  win.style.left = left + 'px';
  win.style.top = top + 'px';
  win.dataset.placed = '1';
}

function openWindow(id, fromEl) {
  const win = document.getElementById(id);
  if (!win) return;
  removeChip(win);

  if (!win.classList.contains('open')) {
    win.classList.remove('closing');
    win.classList.add('open');
    placeWindow(win);
    // zoom out of the icon you clicked, like mac os
    if (fromEl && !isMobile()) {
      const r = fromEl.getBoundingClientRect();
      const wr = win.getBoundingClientRect();
      win.style.setProperty('--origin-x', (r.left + r.width / 2 - wr.left) + 'px');
      win.style.setProperty('--origin-y', (r.top + r.height / 2 - wr.top) + 'px');
    } else {
      win.style.removeProperty('--origin-x');
      win.style.removeProperty('--origin-y');
    }
    if (win.classList.contains('finder')) renderFolder(win);
  }
  focusWindow(win);
  updateScrim();
  const first = win.querySelector('.traffic-dot.red');
  if (first) first.focus({ preventScroll: true });
}

function closeWindow(win) {
  if (!win.classList.contains('open')) return;
  win.classList.add('closing');
  updateScrim();
  setTimeout(() => {
    win.classList.remove('open', 'closing', 'focused', 'maximized');
    updateScrim();
  }, 180);
}

function minimiseWindow(win) {
  const title = win.querySelector('.popup-title').textContent;
  closeWindow(win);
  if (minTray.querySelector(`[data-for="${win.id}"]`)) return;
  const chip = document.createElement('button');
  chip.className = 'min-chip';
  chip.dataset.for = win.id;
  chip.textContent = title;
  chip.setAttribute('aria-label', 'restore ' + title);
  chip.addEventListener('click', () => openWindow(win.id));
  minTray.appendChild(chip);
}

function removeChip(win) {
  const chip = minTray.querySelector(`[data-for="${win.id}"]`);
  if (chip) chip.remove();
}

function makeDraggable(el, handle, { onlyWide = false } = {}) {
  let dragging = false;
  let moved = false;
  let gx = 0;
  let gy = 0;

  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input, label, a, canvas')) return;
    if (isMobile() || (onlyWide && !isWide())) return;
    if (el.classList.contains('maximized')) return;
    dragging = true;
    moved = false;
    const r = el.getBoundingClientRect();
    gx = e.clientX - r.left;
    gy = e.clientY - r.top;
    handle.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
  });

  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    moved = true;
    // fixed windows use viewport coords; widgets are absolute inside .desktop
    const parent = getComputedStyle(el).position === 'fixed'
      ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
      : el.offsetParent.getBoundingClientRect();
    const maxX = parent.width - 60;
    const maxY = (getComputedStyle(el).position === 'fixed' ? window.innerHeight : parent.height) - 40;
    const nx = Math.min(Math.max(e.clientX - parent.left - gx, -el.offsetWidth + 80), maxX);
    const ny = Math.min(Math.max(e.clientY - parent.top - gy, 0), maxY);
    el.style.left = nx + 'px';
    el.style.top = ny + 'px';
    el.style.right = 'auto';
  });

  const stop = () => {
    dragging = false;
    el.classList.remove('dragging');
  };
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
  return () => moved;
}

document.querySelectorAll('.window-popup').forEach((win) => {
  const bar = win.querySelector('.popup-titlebar');
  makeDraggable(win, bar);
  win.addEventListener('pointerdown', () => focusWindow(win));

  win.querySelectorAll('[data-win]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const act = btn.dataset.win;
      if (act === 'close') { closeWindow(win); removeChip(win); }
      if (act === 'min') minimiseWindow(win);
      if (act === 'max') win.classList.toggle('maximized');
    });
  });

  bar.addEventListener('dblclick', (e) => {
    if (e.target.closest('button') || isMobile()) return;
    win.classList.toggle('maximized');
  });
});

// anything with data-open opens a window
document.querySelectorAll('[data-open]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.desk-icon.selected').forEach((i) => i.classList.remove('selected'));
    btn.classList.add('selected');
    openWindow(btn.dataset.open, btn);
  });
});

// finder sidebar links
document.querySelectorAll('[data-goto]').forEach((btn) => {
  btn.addEventListener('click', () => openWindow(btn.dataset.goto, btn));
});

// esc closes the window on top
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = [...document.querySelectorAll('.window-popup.open')];
  if (!open.length) return;
  open.sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0));
  closeWindow(open[0]);
});

// clicking the empty desk deselects icons
document.getElementById('desktop').addEventListener('click', (e) => {
  if (!e.target.closest('.desk-icon')) {
    document.querySelectorAll('.desk-icon.selected').forEach((i) => i.classList.remove('selected'));
  }
});

/* ==========================================================
   folders (projects + hardware) — grid, list and case studies
   ========================================================== */
const folderState = {}; // per window: { view: 'grid'|'list', open: projectId|null }
const FOLDER_LABEL = { projects: 'projects', hardware: 'hardware' };
const FOLDER_TYPE = { projects: 'figma', hardware: 'prototype' };

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function figmaEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('figma.com/embed')) return url;
  return 'https://www.figma.com/embed?embed_host=share&url=' + encodeURIComponent(url);
}

function thumbHTML(p, folder) {
  const inner = p.cover
    ? `<img src="${esc(p.cover)}" alt="" loading="lazy">`
    : `<span aria-hidden="true">${esc(p.emoji || '✦')}</span>`;
  return `<div class="thumb" style="background:${esc(p.color || '#ffeeee')}">${inner}<span class="badge">${FOLDER_TYPE[folder]}</span></div>`;
}

function renderFolder(win) {
  const folder = win.dataset.folder;
  const items = (window.PORTFOLIO && window.PORTFOLIO[folder]) || [];
  const st = folderState[win.id] || (folderState[win.id] = { view: store('view-' + folder) || 'grid', open: null });
  const content = win.querySelector('.finder-content');
  const crumb = win.querySelector('.breadcrumb');
  const back = win.querySelector('.back-btn');
  const status = win.querySelector('.finder-statusbar');
  const title = win.querySelector('.popup-title');

  win.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === st.view));

  const project = st.open && items.find((p) => p.id === st.open);

  if (!project) {
    st.open = null;
    title.textContent = FOLDER_LABEL[folder];
    crumb.innerHTML = `<b>${FOLDER_LABEL[folder]}</b>`;
    back.disabled = true;
    status.textContent = `${items.length} item${items.length === 1 ? '' : 's'} · click a file to open`;
    if (!items.length) {
      content.innerHTML = `<p class="empty">this folder is empty… for now ✦</p>`;
      return;
    }
    content.innerHTML = `<div class="file-grid ${st.view === 'list' ? 'list' : ''}">` + items.map((p) => `
      <button class="file" data-id="${esc(p.id)}" aria-label="open ${esc(p.title)}">
        ${thumbHTML(p, folder)}
        <div>
          <div class="file-name">${esc(p.file || p.title)}</div>
          <div class="file-sub">${esc(p.summary)}</div>
        </div>
      </button>`).join('') + `</div>`;
    content.querySelectorAll('.file').forEach((f) => {
      f.addEventListener('click', () => { st.open = f.dataset.id; renderFolder(win); });
    });
    content.scrollTop = 0;
    return;
  }

  // ----- case study view -----
  const idx = items.indexOf(project);
  const prev = items[idx - 1];
  const next = items[idx + 1];
  title.textContent = project.file || project.title;
  crumb.innerHTML = `<button data-crumb>${FOLDER_LABEL[folder]}</button> / <b>${esc(project.title)}</b>`;
  back.disabled = false;
  status.textContent = `${idx + 1} of ${items.length}`;

  const meta = project.meta || {};
  const metaHTML = ['role', 'timeline', 'tools', 'team']
    .filter((k) => meta[k])
    .map((k) => `<div><dt>${k}</dt><dd>${esc(meta[k])}</dd></div>`).join('');

  content.innerHTML = `
    <article class="case">
      <div class="case-hero" style="background:${esc(project.color || '#ffeeee')}">
        ${project.cover ? `<img src="${esc(project.cover)}" alt="${esc(project.title)} cover">` : `<span aria-hidden="true">${esc(project.emoji || '✦')}</span>`}
      </div>
      <h2>${esc(project.title)}</h2>
      <p class="summary">${esc(project.summary)}</p>
      <div class="tags">${(project.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${metaHTML ? `<dl class="meta">${metaHTML}</dl>` : ''}
      ${project.figma ? `<div class="figma-embed"><iframe src="${esc(figmaEmbedUrl(project.figma))}" allowfullscreen loading="lazy" title="${esc(project.title)} figma prototype"></iframe></div>` : ''}
      ${(project.sections || []).map((s) => `
        <section class="case-section">
          <h3>${esc(s.heading)}</h3>
          <p>${s.body || ''}</p>
          ${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.heading)}" loading="lazy">` : ''}
        </section>`).join('')}
      ${(project.gallery || []).length ? `<div class="gallery">${project.gallery.map((g) => `<img src="${esc(g)}" alt="" loading="lazy">`).join('')}</div>` : ''}
      ${(project.links || []).length ? `<div class="case-links">${project.links.map((l) => `<a class="pill-link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>` : ''}
      <nav class="case-nav">
        ${prev ? `<button data-go="${esc(prev.id)}">‹ ${esc(prev.title)}</button>` : '<span></span>'}
        ${next ? `<button data-go="${esc(next.id)}">${esc(next.title)} ›</button>` : '<span></span>'}
      </nav>
    </article>`;
  content.scrollTop = 0;
  crumb.querySelector('[data-crumb]').addEventListener('click', () => { st.open = null; renderFolder(win); });
  content.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { st.open = b.dataset.go; renderFolder(win); }));
}

document.querySelectorAll('.finder').forEach((win) => {
  win.querySelector('.back-btn').addEventListener('click', () => {
    folderState[win.id].open = null;
    renderFolder(win);
  });
  win.querySelectorAll('[data-view]').forEach((b) => {
    b.addEventListener('click', () => {
      folderState[win.id].view = b.dataset.view;
      store('view-' + win.dataset.folder, b.dataset.view);
      renderFolder(win);
    });
  });
});

/* ==========================================================
   draggable desktop widgets (pet + sticky note) on wide screens
   ========================================================== */
['petWidget', 'sticky'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) makeDraggable(el, el, { onlyWide: true });
});

/* to-do sticky note */
const todos = document.querySelectorAll('[data-todo]');
const todoDone = document.getElementById('todoDone');
let todoSaved = [];
try { todoSaved = JSON.parse(store('todos') || '[]'); } catch (e) {}

function checkTodos() {
  const all = [...todos].every((t) => t.checked);
  todoDone.classList.toggle('show', all);
  store('todos', JSON.stringify([...todos].map((t) => t.checked)));
}

todos.forEach((t, i) => {
  t.checked = !!todoSaved[i];
  t.addEventListener('change', checkTodos);
});
todos[0].checked = true; // you're here, so that one's done!

// tick items off automatically as visitors explore
document.querySelectorAll('.desk-icon.folder').forEach((f) => f.addEventListener('click', () => { todos[1].checked = true; checkTodos(); }));
document.addEventListener('mochi', (e) => { if (e.detail.stats.fed) { todos[2].checked = true; checkTodos(); } });
document.querySelector('[data-open="contactPopup"]').addEventListener('click', () => { todos[3].checked = true; checkTodos(); });
checkTodos();

/* copy email */
const copyBtn = document.getElementById('copyEmail');
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.copy);
    copyBtn.textContent = 'copied! ♡';
  } catch (e) {
    copyBtn.textContent = 'oops';
  }
  setTimeout(() => (copyBtn.textContent = 'copy'), 1600);
});

/* ==========================================================
   day / night theme + music
   ========================================================== */
const themeButton = document.getElementById('themeButton');
const bgMusic = document.getElementById('bgMusic');
const volumeButton = document.getElementById('volumeButton');
const volumeIcon = document.getElementById('volumeIcon');
const nowPlaying = document.querySelector('.now-playing');
const nowPlayingText = document.getElementById('nowPlayingText');
let isPlaying = false;

function updateMusicForTheme(theme) {
  const src = theme === 'dark' ? bgMusic.dataset.nightSrc : bgMusic.dataset.daySrc;
  nowPlayingText.textContent = theme === 'dark' ? '♬ animal crossing - night ♪' : '♬ animal crossing - day ♪';
  if (bgMusic.getAttribute('src') !== src) {
    bgMusic.src = src;
    if (isPlaying) bgMusic.play().catch(() => {});
  }
}

themeButton.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  store('theme', next);
  updateMusicForTheme(next);
  if (window.mochi) window.mochi.say(next === 'dark' ? 'getting sleepy…' : 'good morning! ☀', 1800);
});

volumeButton.addEventListener('click', () => {
  if (isPlaying) {
    bgMusic.pause();
    volumeIcon.src = 'img/volume-off-icon.png';
    isPlaying = false;
    nowPlaying.classList.remove('playing');
  } else {
    bgMusic.play()
      .then(() => {
        volumeIcon.src = 'img/volume-icon.svg';
        isPlaying = true;
        nowPlaying.classList.add('playing');
      })
      .catch((error) => console.error('music could not play:', error));
  }
});

updateMusicForTheme(html.getAttribute('data-theme'));

/* ==========================================================
   typing animation for "hi! i'm laura" (click it to retype)
   ========================================================== */
const intro = document.getElementById('intro');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const chars = [];

// wrap every letter in a span so we can reveal them one by one
intro.querySelectorAll('.hi-text, .span').forEach((part) => {
  const text = part.textContent;
  part.textContent = '';
  [...text].forEach((c) => {
    const span = document.createElement('span');
    span.className = 'ch';
    span.textContent = c;
    part.appendChild(span);
    chars.push(span);
  });
});

let typingTimer = null;
function typeIntro() {
  clearTimeout(typingTimer);
  chars.forEach((c) => c.classList.remove('shown', 'caret', 'before'));
  if (reduceMotion) return;

  intro.classList.add('typing');
  chars[0].classList.add('caret', 'before');
  let i = 0;
  const step = () => {
    chars.forEach((c) => c.classList.remove('caret', 'before'));
    chars[i].classList.add('shown', 'caret');
    i++;
    if (i >= chars.length) {
      // done — keep the caret blinking for a bit, then tidy up
      typingTimer = setTimeout(() => {
        chars[chars.length - 1].classList.remove('caret');
        intro.classList.remove('typing');
      }, 2600);
      return;
    }
    // little pause after "hi!", otherwise a slightly human rhythm
    const delay = chars[i - 1].textContent === '!' ? 420 : 85 + Math.random() * 70;
    typingTimer = setTimeout(step, delay);
  };
  typingTimer = setTimeout(step, 500);
}

typeIntro();
intro.addEventListener('click', typeIntro);

/* ==========================================================
   little extras: clock, villager, sparkles, year
   ========================================================== */
const clock = document.getElementById('clock');
function tickClock() {
  clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
}
tickClock();
setInterval(tickClock, 15000);

document.getElementById('year').textContent = new Date().getFullYear();

const villager = document.getElementById('villager');
const villagerBubble = document.getElementById('villagerBubble');
const lines = [
  'oh, hey there!',
  'laura made this site~',
  'have you fed mochi?',
  'the folders have her work!',
  'try night mode ☾',
  'hmph. i\'m busy.',
  'nice to meet you ♪',
];
let line = 0;
villager.addEventListener('click', (e) => {
  e.stopPropagation();
  villagerBubble.textContent = lines[line++ % lines.length];
  villagerBubble.classList.add('show');
  clearTimeout(villager._t);
  villager._t = setTimeout(() => villagerBubble.classList.remove('show'), 2200);
});

// sparkles where you click on the empty desk
document.getElementById('desktop').addEventListener('pointerdown', (e) => {
  if (e.target.closest('button, a, input, label, .window-popup, .widget, .main-window-group')) return;
  const glyphs = ['✦', '✧', '♡', '⋆'];
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = glyphs[i % glyphs.length];
    const a = (Math.PI * 2 * i) / 5 + Math.random();
    const d = 24 + Math.random() * 20;
    s.style.left = e.clientX + 'px';
    s.style.top = e.clientY + 'px';
    s.style.setProperty('--dx', Math.cos(a) * d + 'px');
    s.style.setProperty('--dy', Math.sin(a) * d + 'px');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
});

// keep fixed windows on screen if the browser is resized
window.addEventListener('resize', () => {
  updateScrim();
  document.querySelectorAll('.window-popup.open').forEach((win) => {
    if (isMobile()) return;
    const r = win.getBoundingClientRect();
    if (r.left > window.innerWidth - 80) win.style.left = (window.innerWidth - r.width - 12) + 'px';
    if (r.top > window.innerHeight - 60) win.style.top = Math.max(12, window.innerHeight - r.height - 12) + 'px';
  });
});
