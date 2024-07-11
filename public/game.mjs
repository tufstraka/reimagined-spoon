import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

const players = {};
let collectible;

// Listen for player updates
socket.on('players', (data) => {
  Object.keys(data).forEach(id => {
    if (!players[id]) {
      players[id] = new Player(data[id]);
    } else {
      players[id].x = data[id].x;
      players[id].y = data[id].y;
      players[id].score = data[id].score;
    }
  });
  render();
});

// Listen for collectible updates
socket.on('collectible', (data) => {
  collectible = new Collectible(data);
  render();
});

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw players
  Object.values(players).forEach(player => {
    context.fillRect(player.x, player.y, 20, 20);
  });

  // Draw collectible if available
  if (collectible) {
    context.fillRect(collectible.x, collectible.y, 10, 10);
  }
}

// Handle key presses for player movement
document.addEventListener('keydown', (e) => {
  let dir;
  if (e.key === 'ArrowUp' || e.key === 'w') dir = 'up';
  if (e.key === 'ArrowDown' || e.key === 's') dir = 'down';
  if (e.key === 'ArrowLeft' || e.key === 'a') dir = 'left';
  if (e.key === 'ArrowRight' || e.key === 'd') dir = 'right';
  if (dir) {
    socket.emit('move', { dir, speed: 5 });
  }
});

// Handle player collision with collectible
setInterval(() => {
  if (collectible) {
    Object.values(players).forEach(player => {
      if (collectible.checkCollision(player)) {
        player.score += collectible.value;
        socket.emit('updateScore', { playerId: player.id, score: player.score });
        socket.emit('newCollectible');
      }
    });
  }
}, 100);