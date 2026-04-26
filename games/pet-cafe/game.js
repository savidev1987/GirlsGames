// ─── Work at Pet Cafe ─────────────────────────────────────────────────────────

// ── Menu Data ─────────────────────────────────────────────────────────────────
const HUMAN_MENU = [
  { id: 'latte',      icon: '☕', name: 'Latte'       },
  { id: 'tea',        icon: '🍵', name: 'Tea'         },
  { id: 'juice',      icon: '🧃', name: 'Juice'       },
  { id: 'cake',       icon: '🎂', name: 'Cake'        },
  { id: 'sandwich',   icon: '🥪', name: 'Sandwich'    },
  { id: 'pancakes',   icon: '🥞', name: 'Pancakes'    },
  { id: 'smoothie',   icon: '🥤', name: 'Smoothie'    },
  { id: 'cookie',     icon: '🍪', name: 'Cookie'      },
];

const PET_MENU = [
  { id: 'dog-treat',  icon: '🦴', name: 'Dog Treat'   },
  { id: 'fish',       icon: '🐟', name: 'Fish'        },
  { id: 'carrot',     icon: '🥕', name: 'Carrot'      },
  { id: 'milk',       icon: '🥛', name: 'Pet Milk'    },
  { id: 'seeds',      icon: '🌾', name: 'Seeds'       },
  { id: 'kibble',     icon: '🍖', name: 'Kibble'      },
  { id: 'lettuce',    icon: '🥬', name: 'Lettuce'     },
  { id: 'water',      icon: '💧', name: 'Water Bowl'  },
];

// ── Customer Pool ─────────────────────────────────────────────────────────────
const CUSTOMERS = [
  { name: 'Emma',   emoji: '👩‍🦰', pet: '🐶', petName: 'Biscuit', humanOrder: ['latte'],             petOrder: ['dog-treat'] },
  { name: 'Lily',   emoji: '👧',    pet: '🐱', petName: 'Luna',    humanOrder: ['tea', 'cake'],       petOrder: ['fish']      },
  { name: 'Sofia',  emoji: '🧒',    pet: '🐰', petName: 'Fluff',   humanOrder: ['juice'],             petOrder: ['carrot', 'lettuce'] },
  { name: 'Mia',    emoji: '👩',    pet: '🐦', petName: 'Kiwi',    humanOrder: ['smoothie', 'cookie'],petOrder: ['seeds']     },
  { name: 'Ava',    emoji: '👩‍🦱', pet: '🐶', petName: 'Peanut',  humanOrder: ['pancakes'],          petOrder: ['kibble', 'water'] },
  { name: 'Zoe',    emoji: '👧',    pet: '🐱', petName: 'Mochi',   humanOrder: ['latte', 'sandwich'], petOrder: ['milk']      },
  { name: 'Chloe',  emoji: '🧒',    pet: '🐰', petName: 'Daisy',   humanOrder: ['tea', 'cookie'],     petOrder: ['carrot']    },
  { name: 'Grace',  emoji: '👩',    pet: '🐦', petName: 'Sunny',   humanOrder: ['cake'],              petOrder: ['seeds', 'water'] },
];

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  level:       1,
  lives:       3,
  customerIdx: 0,
  ordersDone:  0,
  ordersNeeded: 2,   // increases with level
  currentCustomer: null,
  tray:        [],   // array of item ids in tray
  activeTab:   'human',
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const humanEmoji  = $('human-emoji');
const petEmoji    = $('pet-emoji');
const ownerName   = $('owner-name');
const orderText   = $('order-text');
const tray        = $('tray');
const trayEmpty   = $('tray-empty');
const menuGrid    = $('menu-grid');
const hearts      = $('hearts');
const levelInfo   = $('level-info');
const feedback    = $('feedback');
const feedbackEmoji = $('feedback-emoji');
const feedbackMsg = $('feedback-msg');
const feedbackSub = $('feedback-sub');
const gameover    = $('gameover');
const levelcomplete = $('levelcomplete');

// ── Render helpers ────────────────────────────────────────────────────────────
function renderHearts() {
  hearts.textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(3 - state.lives);
}

function renderMenu() {
  const items = state.activeTab === 'human' ? HUMAN_MENU : PET_MENU;
  menuGrid.innerHTML = '';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'menu-item';
    el.innerHTML = `<span class="icon">${item.icon}</span><span class="name">${item.name}</span>`;
    el.addEventListener('click', () => addToTray(item));
    menuGrid.appendChild(el);
  });
}

function renderTray() {
  tray.innerHTML = '';
  if (state.tray.length === 0) {
    tray.appendChild(trayEmpty);
    trayEmpty.style.display = '';
    return;
  }
  state.tray.forEach((itemId, i) => {
    const item = [...HUMAN_MENU, ...PET_MENU].find(m => m.id === itemId);
    if (!item) return;
    const el = document.createElement('div');
    el.className = 'tray-item';
    el.title = 'Tap to remove';
    el.textContent = item.icon;
    el.addEventListener('click', () => {
      state.tray.splice(i, 1);
      renderTray();
    });
    tray.appendChild(el);
  });
}

function loadCustomer() {
  const pool = shuffled([...CUSTOMERS]);
  const c = pool[state.customerIdx % pool.length];
  state.currentCustomer = c;

  humanEmoji.textContent = c.emoji;
  petEmoji.textContent   = c.pet;
  ownerName.textContent  = `${c.name} says:`;

  const humanItems = c.humanOrder.map(id => {
    const item = HUMAN_MENU.find(m => m.id === id);
    return item ? `${item.icon} ${item.name}` : id;
  }).join(', ');
  const petItems = c.petOrder.map(id => {
    const item = PET_MENU.find(m => m.id === id);
    return item ? `${item.icon} ${item.name}` : id;
  }).join(', ');

  orderText.innerHTML =
    `I'd like <strong>${humanItems}</strong> for me, and <strong>${petItems}</strong> for ${c.petName} please!`;

  state.tray = [];
  renderTray();
}

// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('.menu-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.menu-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeTab = btn.dataset.tab;
    renderMenu();
  });
});

// ── Add to tray ───────────────────────────────────────────────────────────────
function addToTray(item) {
  state.tray.push(item.id);
  renderTray();
  // brief bounce feedback
  const items = tray.querySelectorAll('.tray-item');
  const last  = items[items.length - 1];
  if (last) { last.style.transform = 'scale(1.3)'; setTimeout(() => last.style.transform = '', 150); }
}

// ── Submit order ──────────────────────────────────────────────────────────────
$('btn-submit').addEventListener('click', submitOrder);

function submitOrder() {
  const c       = state.currentCustomer;
  const wanted  = [...c.humanOrder, ...c.petOrder].sort();
  const served  = [...state.tray].sort();

  const correct = wanted.length === served.length && wanted.every((id, i) => id === served[i]);

  if (correct) {
    feedbackEmoji.textContent = ['😻', '🐶❤️', '🎉', '⭐'][Math.floor(Math.random() * 4)];
    feedbackMsg.textContent   = `${c.name} & ${c.petName} loved it!`;
    feedbackSub.textContent   = 'Perfect order!';
    feedback.style.display    = 'flex';
    state.ordersDone++;
  } else {
    state.lives--;
    renderHearts();

    if (state.lives <= 0) {
      showGameOver();
      return;
    }

    feedbackEmoji.textContent = ['😿', '😕', '🙁'][state.lives - 1];
    feedbackMsg.textContent   = `${c.name} didn't like that!`;
    feedbackSub.textContent   = `Check the order again. ${state.lives} heart${state.lives !== 1 ? 's' : ''} left.`;
    feedback.style.display    = 'flex';
  }
}

// ── Next customer button ──────────────────────────────────────────────────────
$('btn-next').addEventListener('click', () => {
  feedback.style.display = 'none';

  if (state.ordersDone >= state.ordersNeeded) {
    showLevelComplete();
    return;
  }

  state.customerIdx++;
  loadCustomer();
});

// ── Level complete ─────────────────────────────────────────────────────────────
function showLevelComplete() {
  $('lc-title').textContent = `Level ${state.level} Complete!`;
  $('lc-sub').textContent   = `You served ${state.ordersNeeded} happy customers!`;
  levelcomplete.style.display = 'flex';
}

$('btn-nextlevel').addEventListener('click', () => {
  state.level++;
  state.ordersNeeded = Math.min(state.level + 1, 6);
  state.ordersDone   = 0;
  state.customerIdx  = 0;
  // Restore one heart (max 3) as reward
  state.lives = Math.min(3, state.lives + 1);
  levelInfo.textContent = `Level ${state.level}`;
  renderHearts();
  levelcomplete.style.display = 'none';
  loadCustomer();
});

// ── Game Over ─────────────────────────────────────────────────────────────────
function showGameOver() {
  feedback.style.display  = 'none';
  gameover.style.display  = 'flex';
}

// Shopping items — just fun, no real mechanic yet
document.querySelectorAll('.shop-item').forEach(el => {
  el.addEventListener('click', () => {
    el.style.transform = 'scale(1.15)';
    setTimeout(() => el.style.transform = '', 200);
  });
});

$('btn-restart').addEventListener('click', () => {
  state.lives      = 3;
  state.ordersDone = 0;
  state.customerIdx = 0;
  state.level      = 1;
  state.ordersNeeded = 2;
  levelInfo.textContent = 'Level 1';
  renderHearts();
  gameover.style.display = 'none';
  loadCustomer();
});

// ── Util ──────────────────────────────────────────────────────────────────────
function shuffled(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Init ──────────────────────────────────────────────────────────────────────
renderHearts();
renderMenu();
loadCustomer();
