// ─── Kroger Worker Sim ───────────────────────────────────────────────────────
// Web prototype using Three.js first-person view
// ─────────────────────────────────────────────────────────────────────────────

const canvas   = document.getElementById('canvas');
const toast    = document.getElementById('toast');
const timerBar = document.getElementById('timer-bar');
const taskText = document.getElementById('task-text');

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

function resizeRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeRenderer);

// ── Scene & Camera ────────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue for open store feel
scene.fog = new THREE.Fog(0x87ceeb, 10, 40);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 0); // eye height

// ── Lighting ──────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(5, 10, 5);
sun.castShadow = true;
scene.add(sun);

// ── Materials ─────────────────────────────────────────────────────────────────
const MAT = {
  floor:    new THREE.MeshLambertMaterial({ color: 0xf5f0e8 }),
  wall:     new THREE.MeshLambertMaterial({ color: 0xdce8f0 }),
  shelf:    new THREE.MeshLambertMaterial({ color: 0xb0855a }),
  produce:  new THREE.MeshLambertMaterial({ color: 0x4caf50 }),
  dairy:    new THREE.MeshLambertMaterial({ color: 0x90caf9 }),
  bakery:   new THREE.MeshLambertMaterial({ color: 0xffcc80 }),
  frozen:   new THREE.MeshLambertMaterial({ color: 0xb3e5fc }),
  checkout: new THREE.MeshLambertMaterial({ color: 0xe31837 }),
  sign:     new THREE.MeshLambertMaterial({ color: 0xe31837 }),
  signText: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  customer: new THREE.MeshLambertMaterial({ color: 0xffb347 }),
  head:     new THREE.MeshLambertMaterial({ color: 0xffe0bd }),
  bubble:   new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }),
  stock:    new THREE.MeshLambertMaterial({ color: 0x8d6e63 }),
};

// ── Store Layout Builder ───────────────────────────────────────────────────────
function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

// Floor
box(50, 0.1, 50, MAT.floor, 0, 0, 0);

// Ceiling
box(50, 0.1, 50, MAT.wall, 0, 5, 0);

// Perimeter walls
box(50, 5, 0.3, MAT.wall, 0, 2.5, -25);  // back
box(50, 5, 0.3, MAT.wall, 0, 2.5, 25);   // front
box(0.3, 5, 50, MAT.wall, -25, 2.5, 0);  // left
box(0.3, 5, 50, MAT.wall, 25, 2.5, 0);   // right

// ── Sections ──────────────────────────────────────────────────────────────────
// Each section: sign + shelf rows

const sections = [
  { name: 'PRODUCE',  color: 0x4caf50, mat: MAT.produce,  z: -15, x: -10 },
  { name: 'DAIRY',    color: 0x90caf9, mat: MAT.dairy,    z: -15, x:   0 },
  { name: 'BAKERY',   color: 0xffcc80, mat: MAT.bakery,   z: -15, x:  10 },
  { name: 'FROZEN',   color: 0xb3e5fc, mat: MAT.frozen,   z:  -5, x: -10 },
  { name: 'CHECKOUT', color: 0xe31837, mat: MAT.checkout, z:  10, x:   0 },
];

// Shelf cluster per section
sections.forEach(sec => {
  // Back shelf
  box(4, 2.5, 0.4, MAT.shelf, sec.x, 1.25, sec.z);
  // Stock items on shelf
  for (let i = -1; i <= 1; i++) {
    const itemBox = box(0.5, 0.5, 0.3, sec.mat, sec.x + i * 1.2, 1.8, sec.z - 0.3);
    itemBox.userData.section = sec.name;
  }
  // Aisle shelf (facing player)
  box(4, 2.5, 0.4, MAT.shelf, sec.x, 1.25, sec.z + 2);

  // Sign above shelf
  const signMesh = box(3, 0.5, 0.1, MAT.sign, sec.x, 3, sec.z - 0.3);
  signMesh.userData.isSign = true;
  signMesh.userData.section = sec.name;
});

// Stockroom entrance (back-left)
box(4, 4, 0.2, MAT.wall, -22, 2, -20);
const stockDoor = box(1.5, 3, 0.1, MAT.stock, -22, 1.5, -20);
stockDoor.userData.isStockroom = true;

// ── Interactable targets (raycaster checks these) ──────────────────────────────
const interactables = [];

// Register section meshes as interactable
scene.traverse(obj => {
  if (obj.userData.section || obj.userData.isStockroom) {
    interactables.push(obj);
  }
});

// ── Customer NPCs ─────────────────────────────────────────────────────────────
const customers = [];
const CUSTOMER_TASKS = [
  { msg: 'Excuse me, where is the Produce section?', target: 'PRODUCE' },
  { msg: 'Can you help me find the Dairy aisle?',    target: 'DAIRY'   },
  { msg: 'Where are the baked goods?',               target: 'BAKERY'  },
  { msg: 'Do you have frozen pizza?',                target: 'FROZEN'  },
  { msg: 'Which lane is open for checkout?',         target: 'CHECKOUT'},
];

function spawnCustomer(taskIndex) {
  const task = CUSTOMER_TASKS[taskIndex % CUSTOMER_TASKS.length];
  const spawnX = (Math.random() - 0.5) * 20;
  const spawnZ = (Math.random() - 0.5) * 10;

  // Body
  const body = box(0.5, 1, 0.3, MAT.customer, spawnX, 0.5, spawnZ);
  // Head
  const head = box(0.4, 0.4, 0.4, MAT.head, spawnX, 1.3, spawnZ);

  // Speech bubble (flat plane above head)
  const bubble = box(1.8, 0.5, 0.05, MAT.bubble, spawnX, 2.2, spawnZ);
  bubble.lookAt(camera.position);

  const customer = { body, head, bubble, task, active: true };
  customers.push(customer);
  return customer;
}

// ── Game State ────────────────────────────────────────────────────────────────
const state = {
  level:          1,
  score:          0,
  taskIndex:      0,
  timerMax:       15,   // seconds
  timerLeft:      15,
  failCount:      0,
  maxFails:       3,
  currentCustomer: null,
  phase: 'idle',        // idle | active | complete
  keys: { up: false, left: false, right: false, down: false },
};

function startLevel() {
  state.phase      = 'active';
  state.failCount  = 0;
  state.timerLeft  = state.timerMax;
  state.taskIndex  = 0;

  // Clear old customers
  customers.forEach(c => {
    scene.remove(c.body);
    scene.remove(c.head);
    scene.remove(c.bubble);
  });
  customers.length = 0;

  spawnNextCustomer();
}

function spawnNextCustomer() {
  const c = spawnCustomer(state.taskIndex);
  state.currentCustomer = c;
  taskText.textContent  = c.task.msg;
  state.timerLeft       = state.timerMax;
  document.getElementById('task-card').style.display = 'block';
}

function showToast(msg, color = '#222') {
  toast.textContent  = msg;
  toast.style.background = color;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 1800);
}

function taskSuccess() {
  state.score++;
  showToast('✅ Great job!', 'rgba(56,142,60,0.9)');
  state.taskIndex++;

  const tasksThisLevel = state.level + 1; // level 1 = 2 tasks, level 2 = 3, etc.
  if (state.taskIndex >= tasksThisLevel) {
    levelComplete();
  } else {
    setTimeout(spawnNextCustomer, 1200);
  }
}

function taskFail() {
  state.failCount++;
  showToast(`⏰ Too slow! (${state.maxFails - state.failCount} chances left)`, 'rgba(183,28,28,0.9)');
  if (state.failCount >= state.maxFails) {
    setTimeout(() => {
      showToast('😟 Restarting level...', 'rgba(0,0,0,0.85)');
      setTimeout(startLevel, 1800);
    }, 1200);
  } else {
    state.timerLeft = state.timerMax;
  }
}

function levelComplete() {
  state.phase = 'idle';
  document.getElementById('task-card').style.display = 'none';
  showToast(`🎉 Level ${state.level} done! Score: ${state.score}`, 'rgba(56,142,60,0.9)');
  state.level++;
  state.timerMax = Math.max(8, state.timerMax - 1); // harder each level
  document.getElementById('level-badge').textContent = `LEVEL ${state.level}`;
  setTimeout(startLevel, 2500);
}

// ── Player Movement ───────────────────────────────────────────────────────────
const MOVE_SPEED = 0.07;
const TURN_SPEED = 0.03;

function updateMovement() {
  const { up, down, left, right } = state.keys;
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();

  if (up)    camera.position.addScaledVector(dir,  MOVE_SPEED);
  if (down)  camera.position.addScaledVector(dir, -MOVE_SPEED);
  if (left)  camera.rotation.y += TURN_SPEED;
  if (right) camera.rotation.y -= TURN_SPEED;

  // Clamp inside store
  camera.position.x = Math.max(-24, Math.min(24, camera.position.x));
  camera.position.z = Math.max(-24, Math.min(24, camera.position.z));
  camera.position.y = 1.6;
}

// D-pad buttons
function bindDpad(id, key) {
  const btn = document.getElementById(id);
  const press   = () => { state.keys[key] = true;  btn.classList.add('pressed'); };
  const release = () => { state.keys[key] = false; btn.classList.remove('pressed'); };
  btn.addEventListener('pointerdown',  press);
  btn.addEventListener('pointerup',    release);
  btn.addEventListener('pointerleave', release);
}
bindDpad('btn-up',    'up');
bindDpad('btn-left',  'left');
bindDpad('btn-right', 'right');
bindDpad('btn-down',  'down');

// Keyboard
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp'    || e.key === 'w') state.keys.up    = true;
  if (e.key === 'ArrowDown'  || e.key === 's') state.keys.down  = true;
  if (e.key === 'ArrowLeft'  || e.key === 'a') state.keys.left  = true;
  if (e.key === 'ArrowRight' || e.key === 'd') state.keys.right = true;
  if (e.key === ' ' || e.key === 'e') tryInteract();
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowUp'    || e.key === 'w') state.keys.up    = false;
  if (e.key === 'ArrowDown'  || e.key === 's') state.keys.down  = false;
  if (e.key === 'ArrowLeft'  || e.key === 'a') state.keys.left  = false;
  if (e.key === 'ArrowRight' || e.key === 'd') state.keys.right = false;
});

// ── Interaction (HELP button / Space) ─────────────────────────────────────────
const raycaster = new THREE.Raycaster();

function tryInteract() {
  if (state.phase !== 'active' || !state.currentCustomer) return;

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(interactables, true);

  if (hits.length === 0) {
    showToast('Nothing to interact with here.', 'rgba(0,0,0,0.7)');
    return;
  }

  const hit = hits[0].object;
  const section = hit.userData.section;
  const target  = state.currentCustomer.task.target;

  if (section === target) {
    // Remove current customer
    scene.remove(state.currentCustomer.body);
    scene.remove(state.currentCustomer.head);
    scene.remove(state.currentCustomer.bubble);
    state.currentCustomer.active = false;
    taskSuccess();
  } else {
    showToast(`That's the ${section} section — try another aisle!`, 'rgba(183,28,28,0.8)');
  }
}

document.getElementById('btn-action').addEventListener('click', tryInteract);
document.getElementById('btn-action').addEventListener('touchstart', e => { e.preventDefault(); tryInteract(); });

// ── Timer Loop ────────────────────────────────────────────────────────────────
let lastTime = performance.now();

function updateTimer(delta) {
  if (state.phase !== 'active') return;
  state.timerLeft -= delta;
  const pct = Math.max(0, state.timerLeft / state.timerMax);
  timerBar.style.width = (pct * 100) + '%';
  timerBar.style.background = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#f44336';

  if (state.timerLeft <= 0) {
    state.timerLeft = 0;
    taskFail();
  }
}

// ── Animate ───────────────────────────────────────────────────────────────────
function animate(now) {
  requestAnimationFrame(animate);
  const delta = (now - lastTime) / 1000;
  lastTime = now;

  updateMovement();
  updateTimer(delta);

  // Customers always face player
  customers.forEach(c => {
    if (!c.active) return;
    c.head.lookAt(camera.position);
    c.bubble.lookAt(camera.position);
  });

  renderer.render(scene, camera);
}

// ── Start ─────────────────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', () => {
  document.getElementById('start-screen').style.display = 'none';
  resizeRenderer();
  startLevel();
  animate(performance.now());
});

resizeRenderer();
