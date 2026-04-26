// ─── Sunny's Doggy Daycare ───────────────────────────────────────────────────

// ── Conditions & their cures ──────────────────────────────────────────────────
const CONDITIONS = [
  { id: 'hurt',    icon: '🤕', label: 'Hurt paw!',      cure: 'bandage'  },
  { id: 'sick',    icon: '🤧', label: 'Feeling sick!',   cure: 'medicine' },
  { id: 'dirty',   icon: '🛁', label: 'Needs a bath!',   cure: 'bath'     },
  { id: 'hungry',  icon: '🍖', label: 'So hungry!',      cure: 'food'     },
  { id: 'tired',   icon: '😴', label: 'Super sleepy...',  cure: 'bed'      },
  { id: 'potty',   icon: '🚽', label: 'Needs a walk!',   cure: 'walk'     },
  { id: 'lonely',  icon: '😢', label: 'Wants cuddles!',  cure: 'cuddle'   },
  { id: 'tangled', icon: '🎀', label: 'Fur is tangled!', cure: 'brush'    },
];

const TOOLS = [
  { id: 'bandage',  icon: '🩹', name: 'First Aid'    },
  { id: 'medicine', icon: '💊', name: 'Medicine'     },
  { id: 'bath',     icon: '🚿', name: 'Bubble Bath'  },
  { id: 'food',     icon: '🥩', name: 'Dog Food'     },
  { id: 'bed',      icon: '🛏️', name: 'Cozy Bed'     },
  { id: 'walk',     icon: '🦮', name: 'Go Outside'   },
  { id: 'cuddle',   icon: '🤗', name: 'Give Cuddles' },
  { id: 'brush',    icon: '✂️', name: 'Grooming'     },
];

const PUPPY_NAMES  = ['Biscuit','Luna','Peanut','Mochi','Daisy','Oreo','Coco','Fluffy','Maple','Bean'];
const PUPPY_EMOJIS = ['🐶','🐕','🐩','🦮','🐕‍🦺'];

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  level:       1,
  lives:       3,
  timerMax:    60,
  timerLeft:   60,
  puppies:     [],
  activePuppy: null,
  running:     false,
  intervalId:  null,
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const room           = $('daycare-room');
const heartsEl       = $('hearts');
const levelBadge     = $('level-badge');
const timerBar       = $('timer-bar');
const timerText      = $('timer-text');
const panel          = $('treatment-panel');
const panelEmoji     = $('panel-emoji');
const panelName      = $('panel-name');
const panelIssue     = $('panel-issue');
const toolsGrid      = $('tools-grid');
const toast          = $('toast');
const levelcomplete  = $('levelcomplete');
const gameover       = $('gameover');

// ── Helpers ───────────────────────────────────────────────────────────────────
function pick(arr, n) {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}

function showToast(msg, color = 'rgba(0,0,0,0.8)') {
  toast.textContent = msg;
  toast.style.background = color;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 1700);
}

function renderHearts() {
  heartsEl.textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(3 - state.lives);
}

// ── Level setup ───────────────────────────────────────────────────────────────
function puppyCount() { return Math.min(2 + state.level - 1, 6); }
function timerDuration() { return Math.max(30, 65 - (state.level - 1) * 5); }

function startLevel() {
  clearInterval(state.intervalId);

  levelBadge.textContent = `Level ${state.level}`;
  state.timerMax  = timerDuration();
  state.timerLeft = state.timerMax;
  state.running   = true;
  state.activePuppy = null;

  // Pick random puppies with random conditions
  const names  = pick(PUPPY_NAMES,  puppyCount());
  const conds  = pick(CONDITIONS,   puppyCount());
  const emojis = pick(PUPPY_EMOJIS, puppyCount());

  state.puppies = names.map((name, i) => ({
    id:        i,
    name,
    emoji:     emojis[i % emojis.length],
    condition: conds[i],
    helped:    false,
  }));

  renderPuppies();
  renderHearts();
  closePanel();
  levelcomplete.style.display = 'none';
  gameover.style.display = 'none';

  // Tick every second
  state.intervalId = setInterval(tick, 1000);
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function tick() {
  if (!state.running) return;
  state.timerLeft--;

  const pct = state.timerLeft / state.timerMax;
  timerBar.style.width    = (pct * 100) + '%';
  timerText.textContent   = state.timerLeft + 's';
  timerBar.style.background =
    pct > 0.5 ? 'linear-gradient(90deg,#4ade80,#86efac)' :
    pct > 0.25 ? 'linear-gradient(90deg,#fb923c,#fbbf24)' :
                 'linear-gradient(90deg,#f87171,#fb923c)';

  if (state.timerLeft <= 0) {
    timeUp();
  }
}

function timeUp() {
  state.running = false;
  clearInterval(state.intervalId);

  const unhelped = state.puppies.filter(p => !p.helped).length;
  if (unhelped === 0) {
    levelPassed();
    return;
  }

  state.lives--;
  renderHearts();
  showToast(`⏰ Time's up! ${unhelped} puppy${unhelped > 1 ? 'ies' : ''} wasn't helped!`, 'rgba(185,28,28,0.9)');

  if (state.lives <= 0) {
    setTimeout(showGameOver, 1200);
  } else {
    setTimeout(startLevel, 1500);
  }
}

// ── Render puppies ────────────────────────────────────────────────────────────
function renderPuppies() {
  room.innerHTML = '';
  state.puppies.forEach(p => {
    const card = document.createElement('div');
    card.className = 'puppy-card ' + (p.helped ? 'helped' : 'needs-help');
    card.dataset.id = p.id;

    card.innerHTML = `
      <span class="condition-icon">${p.helped ? '✅' : p.condition.icon}</span>
      <div class="puppy-emoji">${p.emoji}</div>
      <div class="puppy-name">${p.name}</div>
      <div class="puppy-status ${p.helped ? 'status-ok' : 'status-needs'}">
        ${p.helped ? 'All good! 🐾' : p.condition.label}
      </div>
    `;

    if (!p.helped) {
      card.addEventListener('click', () => openPanel(p));
    }
    room.appendChild(card);
  });
}

// ── Treatment panel ───────────────────────────────────────────────────────────
function openPanel(puppy) {
  state.activePuppy = puppy;
  panelEmoji.textContent = puppy.emoji;
  panelName.textContent  = puppy.name;
  panelIssue.textContent = `${puppy.condition.label} ${puppy.condition.icon}`;

  // Show 6 tools — correct one always included, rest random distractors
  const correctTool = TOOLS.find(t => t.id === puppy.condition.cure);
  const others      = pick(TOOLS.filter(t => t.id !== puppy.condition.cure), 5);
  const shown       = pick([correctTool, ...others], 6);

  toolsGrid.innerHTML = '';
  shown.forEach(tool => {
    const btn = document.createElement('div');
    btn.className = 'tool-btn';
    btn.innerHTML = `<span class="tool-icon">${tool.icon}</span><span class="tool-name">${tool.name}</span>`;
    btn.addEventListener('click', () => useTool(tool));
    toolsGrid.appendChild(btn);
  });

  panel.classList.add('open');
}

function closePanel() {
  panel.classList.remove('open');
  state.activePuppy = null;
}

$('btn-close-panel').addEventListener('click', closePanel);

function useTool(tool) {
  const puppy = state.activePuppy;
  if (!puppy) return;

  if (tool.id === puppy.condition.cure) {
    puppy.helped = true;
    closePanel();
    showToast(`🐾 ${puppy.name} feels better!`, 'rgba(21,128,61,0.9)');
    renderPuppies();

    // Check if all helped
    if (state.puppies.every(p => p.helped)) {
      setTimeout(levelPassed, 600);
    }
  } else {
    state.lives--;
    renderHearts();
    showToast(`❌ That didn't help! Try something else.`, 'rgba(185,28,28,0.9)');

    if (state.lives <= 0) {
      closePanel();
      setTimeout(showGameOver, 1000);
    }
  }
}

// ── Level passed ──────────────────────────────────────────────────────────────
function levelPassed() {
  state.running = false;
  clearInterval(state.intervalId);

  $('lc-title').textContent = `All puppies are happy! 🐾`;
  $('lc-sub').textContent   = `You finished Level ${state.level} before the owners arrived!`;
  levelcomplete.style.display = 'flex';
}

$('btn-nextlevel').addEventListener('click', () => {
  state.level++;
  state.lives = Math.min(3, state.lives + 1); // earn a heart back
  startLevel();
});

// ── Game over ─────────────────────────────────────────────────────────────────
function showGameOver() {
  state.running = false;
  clearInterval(state.intervalId);
  closePanel();
  gameover.style.display = 'flex';
}

$('btn-retry').addEventListener('click', () => {
  state.lives = 3;
  state.level = 1;
  gameover.style.display = 'none';
  startLevel();
});

// ── Start button (intro screen) ───────────────────────────────────────────────
$('btn-start').addEventListener('click', () => {
  $('intro').style.display = 'none';
  startLevel();
});
