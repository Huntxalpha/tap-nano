// Tap Nano – jeu de rapidité

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// État du jeu
let state = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let timeLeft = 20; // durée totale en secondes

// Paramètres dynamiques
let lastTime = null;
let lastSpawn = 0;
const targets = [];

// Accès DOM
const startOverlay = document.getElementById('start-overlay');
const endOverlay = document.getElementById('end-overlay');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const shareButton = document.getElementById('share-button');
const scoreSpan = document.getElementById('score');
const timeSpan = document.getElementById('time');
const finalScoreSpan = document.getElementById('final-score');

// Fonction pour démarrer une partie
function startGame() {
  state = 'playing';
  score = 0;
  timeLeft = 20;
  targets.length = 0;
  lastSpawn = 0;
  lastTime = null;
  updateScoreboard();
  hideOverlay(startOverlay);
  hideOverlay(endOverlay);
  requestAnimationFrame(gameLoop);
}

// Fonction de fin de partie
function endGame() {
  state = 'gameover';
  finalScoreSpan.textContent = score.toString();
  showOverlay(endOverlay);
}

// Génère une cible aléatoire
function spawnTarget() {
  // Détermine la difficulté en fonction du temps restant (0 à 1)
  const progress = 1 - timeLeft / 20;
  // La taille diminue au fil du temps (de 35 à 20)
  const radius = 35 - 15 * progress;
  const ttl = 2000 - 1000 * progress; // durée de vie en ms
  const x = radius + Math.random() * (WIDTH - 2 * radius);
  const y = radius + Math.random() * (HEIGHT - 2 * radius);
  const color = `hsl(${Math.random() * 360}, 70%, 60%)`;
  targets.push({ x, y, radius, ttl });
}

// Met à jour les cibles
function updateTargets(dt) {
  for (let i = targets.length - 1; i >= 0; i--) {
    const t = targets[i];
    t.ttl -= dt;
    if (t.ttl <= 0) {
      targets.splice(i, 1);
    }
  }
}

// Met à jour le tableau de bord
function updateScoreboard() {
  scoreSpan.textContent = score.toString();
  timeSpan.textContent = Math.ceil(timeLeft).toString();
}

// Boucle de jeu
function gameLoop(timestamp) {
  if (state !== 'playing') return;
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  // Mise à jour du temps restant
  timeLeft -= dt / 1000;
  if (timeLeft <= 0) {
    timeLeft = 0;
    updateScoreboard();
    endGame();
    return;
  }

  // Ajuste la difficulté : spawn interval en fonction du temps restant
  const progress = 1 - timeLeft / 20;
  const spawnInterval = 1000 - 700 * progress; // de 1000ms à 300ms

  if (timestamp - lastSpawn > spawnInterval) {
    spawnTarget();
    lastSpawn = timestamp;
  }

  updateTargets(dt);
  draw();
  updateScoreboard();
  requestAnimationFrame(gameLoop);
}

// Dessine le jeu
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Dessine chaque cible
  targets.forEach(t => {
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fillStyle = t.color;
    ctx.fill();
  });
}

// Détermine si un point est à l'intérieur d'une cible
function hitTest(x, y, target) {
  const dx = x - target.x;
  const dy = y - target.y;
  return Math.sqrt(dx * dx + dy * dy) <= target.radius;
}

// Gère les clics et les touches
function handlePointer(clientX, clientY) {
  // Convertit les coordonnées du client en coordonnées du canvas
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  for (let i = targets.length - 1; i >= 0; i--) {
    if (hitTest(x, y, targets[i])) {
      targets.splice(i, 1);
      score++;
      updateScoreboard();
      break;
    }
  }
}

// Événements pointeur
canvas.addEventListener('click', e => {
  if (state !== 'playing') return;
  handlePointer(e.clientX, e.clientY);
});
canvas.addEventListener('touchstart', e => {
  if (state !== 'playing') return;
  e.preventDefault();
  const touch = e.touches[0];
  handlePointer(touch.clientX, touch.clientY);
}, { passive: false });

// Boutons
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
shareButton.addEventListener('click', () => {
  const url = window.location.href;
  const tweet = `J'ai obtenu un score de ${score} à Tap Nano ! Essayez-vous aussi : ${url}`;
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  window.open(shareUrl, '_blank');
});

// Fonctions d'affichage des overlays
function showOverlay(el) {
  el.style.display = 'flex';
}
function hideOverlay(el) {
  el.style.display = 'none';
}

// Affiche l'overlay de départ
showOverlay(startOverlay);
