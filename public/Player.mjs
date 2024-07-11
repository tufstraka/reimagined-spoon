class Player {
  constructor({ x, y, score, id }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.score = score;
    this.width = 20; // Default player width
    this.height = 20; // Default player height
  }

  movePlayer(dir, speed) {
    if (dir === 'up') this.y -= speed;
    if (dir === 'down') this.y += speed;
    if (dir === 'left') this.x -= speed;
    if (dir === 'right') this.x += speed;
  }

  collision(item) {
    return this.x < item.x + item.width &&
           this.x + this.width > item.x &&
           this.y < item.y + item.height &&
           this.y + this.height > item.y;
  }

  calculateRank(players) {
    const sortedPlayers = players.sort((a, b) => b.score - a.score);
    const rank = sortedPlayers.findIndex(p => p.id === this.id) + 1;
    return `Rank: ${rank}/${players.length}`;
  }
}

export default Player;


