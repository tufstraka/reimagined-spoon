require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const nocache = require('nocache');
const path = require('path');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
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
}));
app.use(nocache());
app.use(cors({ origin: '*' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

//For FCC testing purposes
fccTestingRoutes(app);

// JSON error response for 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

const portNum = process.env.PORT || 3000;
// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = socket(server);
const players = {};
const canvasWidth = 640;
const canvasHeight = 480;

function generateNewCollectible() {
  return {
    id: Date.now().toString(),
    x: Math.floor(Math.random() * (canvasWidth - 10)),
    y: Math.floor(Math.random() * (canvasHeight - 10)),
    value: Math.ceil(Math.random() * 5)
  };
}

let collectible = generateNewCollectible();

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  players[socket.id] = {
    id: socket.id,
    x: Math.floor(Math.random() * (canvasWidth - 20)),
    y: Math.floor(Math.random() * (canvasHeight - 20)),
    score: 0
  };

  io.emit('players', players);
  io.emit('collectible', collectible);

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

  socket.on('newCollectible', () => {
    collectible = generateNewCollectible();
    io.emit('collectible', collectible);
  });
});


module.exports = app; // For testing
