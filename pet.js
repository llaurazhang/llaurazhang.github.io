// pet.js — mochi, a tiny pixel pet that lives on the desktop
// stats are saved in the visitor's browser so mochi remembers them when they come back

(function () {
  const canvas = document.getElementById('petCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;   // 48
  const H = canvas.height;  // 32

  const bubble = document.getElementById('petBubble');
  const statusEl = document.getElementById('petStatus');
  const device = document.querySelector('.pet-device');

  // ---------- colours (lcd look) ----------
  const LCD = {
    light: { bg: '#e6efd6', dark: '#3b3a36', mid: '#a4b291', blush: '#e89aa8' },
    dark:  { bg: '#cfe0f3', dark: '#2a3140', mid: '#8fa3bf', blush: '#e89aa8' },
  };
  const theme = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? LCD.dark : LCD.light);

  // ---------- sprites ('#' = dark, '+' = mid, 'b' = blush) ----------
  const BODY = [
    '....###..###....',
    '....#+#..#+#....',
    '....#+#..#+#....',
    '...##########...',
    '..#..........#..',
    '.#............#.',
    '.#............#.',
    '.#............#.',
    '.#.bb......bb.#.',
    '.#............#.',
    '.#............#.',
    '..#..........#..',
    '...##########...',
    '....##....##....',
  ];
  const FOOD = [
    '..###..',
    '.#+++#.',
    '#+++++#',
    '#+###+#',
    '#+###+#',
    '.#####.',
  ];
  const BALL = ['.###.', '#+.+#', '#...#', '#+.+#', '.###.'];
  const HEART = ['.#.#.', '#####', '#####', '.###.', '..#..'];
  const MINI_HEART = ['#.#', '###', '.#.'];
  const MINI_FOOD = ['.#.', '###', '###'];
  const ZED = ['###', '..#', '.#.', '###'];
  const NOTE = ['.##', '.#.', '##.'];

  const FACES = {
    open:  { eyes: [[4, 6], [5, 6], [4, 7], [5, 7], [10, 6], [11, 6], [10, 7], [11, 7]] },
    blink: { eyes: [[4, 7], [5, 7], [10, 7], [11, 7]] },
    happy: { eyes: [[3, 7], [4, 6], [5, 6], [6, 7], [9, 7], [10, 6], [11, 6], [12, 7]] },
    sleep: { eyes: [[3, 7], [4, 7], [5, 7], [10, 7], [11, 7], [12, 7]] },
    sad:   { eyes: [[4, 7], [5, 7], [4, 8], [5, 8], [10, 7], [11, 7], [10, 8], [11, 8], [3, 6], [12, 6]] },
  };
  const MOUTHS = {
    smile: [[6, 9], [9, 9], [7, 10], [8, 10]],
    open:  [[7, 9], [8, 9], [6, 10], [9, 10], [7, 11], [8, 11]],
    chew:  [[6, 10], [7, 10], [8, 10], [9, 10]],
    sad:   [[7, 9], [8, 9], [6, 10], [9, 10]],
    o:     [[7, 9], [8, 9], [7, 10], [8, 10]],
  };

  function drawSprite(rows, x, y, c, cols = null) {
    for (let r = 0; r < rows.length; r++) {
      for (let col = 0; col < rows[r].length; col++) {
        if (cols !== null && col < cols) continue; // used to "eat" food from the left
        const ch = rows[r][col];
        if (ch === '#') ctx.fillStyle = c.dark;
        else if (ch === '+') ctx.fillStyle = c.mid;
        else if (ch === 'b') ctx.fillStyle = c.blush;
        else continue;
        ctx.fillRect(x + col, y + r, 1, 1);
      }
    }
  }

  function dots(points, x, y, color) {
    ctx.fillStyle = color;
    points.forEach(([px, py]) => ctx.fillRect(x + px, y + py, 1, 1));
  }

  // ---------- state ----------
  const MAX = 4;
  const STORE = 'mochi-v1';
  const DECAY_MS = 60 * 1000; // lose one stat point every minute-ish

  let stats = { hunger: 3, happy: 3, born: Date.now(), last: Date.now(), fed: 0, petted: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved && typeof saved.hunger === 'number') stats = Object.assign(stats, saved);
  } catch (e) { /* storage blocked — fine, mochi just won't remember */ }

  // catch up on decay while the visitor was away (but never below 1 — mochi is resilient)
  const missed = Math.floor((Date.now() - stats.last) / DECAY_MS);
  if (missed > 0) {
    stats.hunger = Math.max(1, stats.hunger - Math.ceil(missed / 2));
    stats.happy = Math.max(1, stats.happy - Math.floor(missed / 2));
  }
  stats.last = Date.now();

  function save() {
    stats.last = Date.now();
    try { localStorage.setItem(STORE, JSON.stringify(stats)); } catch (e) {}
  }

  let action = null;      // { type, t }
  let x = 16;             // pet x position on the screen
  let dir = 1;
  let tick = 0;
  let blinkAt = 20;
  let lastInteraction = 0;
  let floaters = [];      // hearts / notes that float up

  function say(text, ms = 1600) {
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(say._t);
    say._t = setTimeout(() => bubble.classList.remove('show'), ms);
  }

  function isNight() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function sleeping() {
    return isNight() && !action && tick - lastInteraction > 40;
  }

  function mood() {
    if (stats.hunger <= 1) return 'hungry';
    if (stats.happy <= 1) return 'sad';
    if (stats.hunger + stats.happy >= 7) return 'joyful';
    return 'content';
  }

  function updateStatus() {
    const days = Math.floor((Date.now() - stats.born) / 86400000);
    const faces = { hungry: '(｡•́︿•̀｡) hungry', sad: '(｡•́︿•̀｡) lonely', joyful: '(◕‿◕) so happy', content: '(・ᴗ・) content' };
    const m = sleeping() ? '(－.－) zzz' : faces[mood()];
    statusEl.textContent = `age ${days}d · ${m}`;
  }

  // ---------- actions ----------
  function doAction(type) {
    lastInteraction = tick;
    device.classList.remove('bump');
    void device.offsetWidth; // restart the animation
    device.classList.add('bump');

    if (action) return; // busy!

    if (type === 'feed') {
      if (stats.hunger >= MAX) { say('i\'m full! (˘ڡ˘)'); action = { type: 'refuse', t: 0 }; return; }
      action = { type: 'feed', t: 0 };
      say('nom nom ♡');
    } else if (type === 'play') {
      if (stats.hunger <= 0) { say('too hungry to play…'); return; }
      action = { type: 'play', t: 0 };
      say(['yay! ⚽', 'catch!', 'wheee ~'][Math.floor(Math.random() * 3)]);
    } else if (type === 'pet') {
      action = { type: 'pet', t: 0 };
      say(['hehe ♡', '(˶ᵔ ᵕ ᵔ˶)', 'purr…', 'more pls'][Math.floor(Math.random() * 4)]);
    }
  }

  function finishAction() {
    if (action.type === 'feed') { stats.hunger = Math.min(MAX, stats.hunger + 1); stats.fed++; }
    if (action.type === 'play') { stats.happy = Math.min(MAX, stats.happy + 1); stats.hunger = Math.max(0, stats.hunger - (Math.random() < 0.3 ? 1 : 0)); }
    if (action.type === 'pet')  { stats.happy = Math.min(MAX, stats.happy + 1); stats.petted++; }
    action = null;
    save();
    document.dispatchEvent(new CustomEvent('mochi', { detail: { stats } }));
  }

  document.querySelectorAll('.pet-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      doAction(btn.dataset.action);
    });
  });

  canvas.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sleeping()) { lastInteraction = tick; say('…huh? oh hi!'); return; }
    doAction('pet');
  });

  // keyboard: when focused inside the widget, 1/2/3 = feed/play/pet
  document.getElementById('petWidget').addEventListener('keydown', (e) => {
    const map = { '1': 'feed', '2': 'play', '3': 'pet' };
    if (map[e.key]) doAction(map[e.key]);
  });

  // stats slowly go down while the page is open
  setInterval(() => {
    if (sleeping()) return; // no decay while asleep
    if (Math.random() < 0.5) stats.hunger = Math.max(0, stats.hunger - 1);
    else stats.happy = Math.max(0, stats.happy - 1);
    save();
    if (stats.hunger <= 1) say('psst… i\'m hungry', 2200);
    else if (stats.happy <= 1) say('play with me? 🥺', 2200);
  }, DECAY_MS);

  // ---------- render loop (~6 fps, it's a retro toy after all) ----------
  function draw() {
    tick++;
    const c = theme();
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);

    // faint lcd grid
    ctx.fillStyle = c.mid + '22';
    for (let i = 0; i < W; i += 2) ctx.fillRect(i, 0, 1, H);

    // hud
    drawSprite(MINI_FOOD, 2, 2, c);
    for (let i = 0; i < MAX; i++) {
      ctx.fillStyle = i < stats.hunger ? c.dark : c.mid;
      ctx.fillRect(7 + i * 3, 3, 2, 2);
    }
    drawSprite(MINI_HEART, 26, 2, c);
    for (let i = 0; i < MAX; i++) {
      ctx.fillStyle = i < stats.happy ? c.dark : c.mid;
      ctx.fillRect(31 + i * 3, 3, 2, 2);
    }
    // ground line
    ctx.fillStyle = c.mid;
    ctx.fillRect(0, 30, W, 1);

    let face = 'open';
    let mouth = 'smile';
    let y = 16;
    const asleep = sleeping();

    if (asleep) {
      face = 'sleep';
      mouth = 'chew';
      x = Math.round(x);
      if (tick % 12 < 6) drawSprite(ZED, x + 15, 10, c);
      else drawSprite(ZED, x + 17, 8, c);
    } else if (action) {
      action.t++;
      if (action.type === 'feed') {
        const bites = Math.floor(action.t / 4); // 0..3
        drawSprite(FOOD, x + 17, 24, c, bites * 2);
        face = 'happy';
        mouth = action.t % 4 < 2 ? 'open' : 'chew';
        if (action.t > 16) finishAction();
      } else if (action.type === 'refuse') {
        face = 'open';
        mouth = 'o';
        x += action.t % 2 ? 1 : -1; // shake head
        if (action.t > 8) action = null;
      } else if (action.type === 'play') {
        // pet jumps while a ball bounces
        const jump = [0, -2, -4, -5, -4, -2, 0];
        y = 16 + jump[action.t % jump.length];
        face = 'happy';
        mouth = 'open';
        const bx = Math.round(4 + ((action.t * 3) % 40));
        const by = 24 - Math.abs(Math.sin(action.t / 2)) * 12;
        drawSprite(BALL, bx, Math.round(by), c);
        if (action.t % 6 === 0) floaters.push({ s: NOTE, x: x + 14, y: 14, life: 10 });
        if (action.t > 28) finishAction();
      } else if (action.type === 'pet') {
        face = 'happy';
        mouth = 'smile';
        y = 16 + (action.t % 4 < 2 ? 0 : 1); // squish
        if (action.t % 4 === 1) floaters.push({ s: HEART, x: x + 4 + Math.round(Math.random() * 8), y: 12, life: 10 });
        if (action.t > 14) finishAction();
      }
    } else {
      // idle: wander + bob + blink
      const m = mood();
      if (tick % 3 === 0) {
        x += dir;
        if (x < 2 || x > W - 18 || Math.random() < 0.04) dir *= -1;
        x = Math.max(2, Math.min(W - 18, x));
      }
      y = 16 + (tick % 6 < 3 ? 0 : 1);
      if (m === 'hungry' || m === 'sad') { face = 'sad'; mouth = 'sad'; }
      else if (m === 'joyful') { face = tick % 30 < 8 ? 'happy' : 'open'; }
      if (tick >= blinkAt && face === 'open') {
        face = 'blink';
        if (tick > blinkAt + 1) blinkAt = tick + 15 + Math.floor(Math.random() * 30);
      }
    }

    // body + face
    drawSprite(BODY, x, y, c);
    dots(FACES[face].eyes, x, y, c.dark);
    dots(MOUTHS[mouth], x, y, c.dark);

    // floaters drift up
    floaters = floaters.filter((f) => f.life > 0);
    floaters.forEach((f) => {
      drawSprite(f.s, f.x, Math.round(f.y), c);
      f.y -= 1;
      f.life--;
    });

    if (tick % 10 === 0) updateStatus();
  }

  updateStatus();
  draw();
  setInterval(draw, 160);

  // greet once
  setTimeout(() => say(isNight() ? 'zzz… (it\'s night)' : 'hi! i\'m mochi ♡', 2200), 900);

  // let other scripts poke mochi
  window.mochi = { doAction, say };
})();
