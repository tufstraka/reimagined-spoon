class Collectible {
  constructor({ x, y, value, id }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.value = value;
    this.width = 10;
    this.height = 10;
  }

  // Check collision with player
  checkCollision(player) {
    return player.x < this.x + this.width &&
           player.x + player.width > this.x &&
           player.y < this.y + this.height &&
           player.y + player.height > this.y;
  }
}

export default Collectible;



