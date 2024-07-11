require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const socket = require('socket.io');
const cors = require('cors');
const nocache = require('nocache');
const helmet = require('helmet');
const path = require('path');

const app = express();

// Security Middleware
// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  hidePoweredBy: { setTo: 'PHP 7.4.3' },
  xssFilter: true,
  noSniff: true,
}));
app.use(nocache());
app.use(helmet.noSniff());


app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

// 404 Not Found Middleware
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

const portNum = process.env.PORT || 3000;
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
});

const io = socket(server);
const players = {};
const canvasWidth = 640;
const canvasHeight = 480;

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Add new player with random position
  players[socket.id] = {
    id: socket.id,
    x: Math.floor(Math.random() * (canvasWidth - 20)),
    y: Math.floor(Math.random() * (canvasHeight - 20)),
    score: 0
  };

  io.emit('players', players);

  socket.on('move', (data) => {
    if (players[socket.id]) {
      const { dir, speed } = data;
      if (dir === 'up') players[socket.id].y -= speed;
      if (dir === 'down') players[socket.id].y += speed;
      if (dir === 'left') players[socket.id].x -= speed;
      if (dir === 'right') players[socket.id].x += speed;
      io.emit('players', players);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('players', players);
  });

  socket.on('updateScore', (data) => {
    if (players[data.playerId]) {
      players[data.playerId].score = data.score;
      io.emit('players', players);
    }
  });

  socket.on('newCollectible', (data) => {
    io.emit('collectible', data);
  });
});

module.exports = app; // For testing
