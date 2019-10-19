const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIO = require('socket.io');
const { randomNumber, randomColour, randomName } = require('./util/random');

const port = 4001;

const app = express();

const server = https.createServer(
  {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt')
  },
  app
);

const io = socketIO(server);

const MAX_COINS = 1;
const BLOCKSIZE = 40;
const GAME_SPEED = 12;
const CANVAS = {
  WIDTH: 800,
  HEIGHT: 600
};
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1000;

const gameState = {
  options: {
    wrap: true
  },
  tick: 0,
  players: {},
  coins: []
};

const randomCell = () => {
  return {
    x: randomNumber(0, CANVAS_WIDTH / BLOCKSIZE),
    y: randomNumber(0, CANVAS_HEIGHT / BLOCKSIZE)
  };
};

io.on('connection', socket => {
  console.log('New client connected');

  socket.on('change color', color => {
    console.log('Color Changed to: ', color);
    io.sockets.emit('change color', color);
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
    delete gameState.players[socket.id];
  });

  socket.on('newPlayer', () => {
    resetPlayer(socket.id);
  });

  socket.on('updateName', name => {
    console.log(`NEW NAME: ${socket.id}::${name}`);
    gameState.players[socket.id].name = name;
  });

  socket.on('updatePlayerImage', img => {
    console.log(`NEW IMAGE: ${socket.id}`);
    gameState.players[socket.id].image = img;
  });

  socket.on('playerMovement', playerDirection => {
    try {
      gameState.players[socket.id].direction = playerDirection;
    } catch (e) {}
  });
});

getPlayerName = id => {
  if (gameState.players[id]) {
    return gameState.players[id].name || randomName();
  }
  return randomName();
};

getPlayerColour = id => {
  if (gameState.players[id]) {
    return gameState.players[id].colour;
  }
  return randomColour();
};

getPlayerImage = id => {
  if (gameState.players[id]) {
    return gameState.players[id].image;
  }
  return '';
};

resetPlayer = id => {
  const { x, y } = randomCell();
  gameState.players[id] = {
    id,
    name: getPlayerName(id),
    colour: getPlayerColour(id),
    image: getPlayerImage(id),
    x,
    y,
    segments: [
      {
        x,
        y,
        age: 1
      }
    ],
    size: BLOCKSIZE,
    direction: '',
    level: 1
  };
};

updatePlayerSegments = (segments, level) => {
  if (segments.length > 1) {
    for (var i = segments.length - 1; i >= 0; i--) {
      segments[i].age++;
      if (segments[i].age > level) {
        segments.splice(i, 1);
      }
    }
  }
};

hasCollision = (x, y) => {
  let died = false;
  if (x * y < 0) {
    return true;
  }
  if (x * BLOCKSIZE >= CANVAS_WIDTH || y * BLOCKSIZE >= CANVAS_HEIGHT) {
    return true;
  }
  Object.keys(gameState.players).map(playerKey => {
    const player = gameState.players[playerKey];
    player.segments.forEach(cell => {
      if (cell.x === x && cell.y === y) {
        died = true;
      }
    });
  });
  return died;
};

playerDied = player => {
  console.log(`Player ${player.id} Crashed`);
  resetPlayer(player.id);
  io.to(player.id).emit('died');
};

updatePlayers = () => {
  Object.keys(gameState.players).map(playerKey => {
    const player = gameState.players[playerKey];
    // check if player collected coin
    const head = player.segments[player.segments.length - 1];
    gameState.coins.forEach((coin, i) => {
      if (head && coin.x === head.x && coin.y === head.y) {
        gameState.coins.splice(i, 1);
        player.level = player.level + 1;
      }
    });

    if (player.direction === 'left' && player.x > -1) {
      let newX = player.x - 1;
      if (gameState.options.wrap) {
        if (newX < 0) {
          newX = CANVAS_WIDTH / BLOCKSIZE - 1;
        }
      }
      if (!hasCollision(newX, player.y)) {
        player.x = newX;
        player.segments.push({
          x: newX,
          y: player.y,
          age: 0
        });
      } else {
        console.log('DIED');
        playerDied(player);
      }
    }
    if (player.direction === 'right' && player.x * BLOCKSIZE < CANVAS_WIDTH) {
      let newX = player.x + 1;
      if (gameState.options.wrap) {
        if (newX > CANVAS_WIDTH / BLOCKSIZE - 1) {
          newX = 0;
        }
      }
      if (!hasCollision(newX, player.y)) {
        player.x = newX;
        player.segments.push({
          x: newX,
          y: player.y,
          age: 0
        });
      } else {
        console.log('DIED');
        playerDied(player);
      }
    }

    if (player.direction === 'up' && player.y > -1) {
      let newY = player.y - 1;
      if (gameState.options.wrap) {
        if (newY < 0) {
          newY = CANVAS_HEIGHT / BLOCKSIZE - 1;
        }
      }
      if (!hasCollision(player.x, newY)) {
        player.y = newY;
        player.segments.push({
          x: player.x,
          y: newY,
          age: 0
        });
      } else {
        console.log('DIED');
        playerDied(player);
      }
    }
    if (player.direction === 'down' && player.y * BLOCKSIZE < CANVAS_HEIGHT) {
      let newY = player.y + 1;
      if (gameState.options.wrap) {
        if (newY > CANVAS_HEIGHT / BLOCKSIZE - 1) {
          newY = 0;
        }
      }
      if (!hasCollision(player.x, newY)) {
        player.y = newY;
        player.segments.push({
          x: player.x,
          y: newY,
          age: 0
        });
      } else {
        console.log('DIED');
        playerDied(player);
      }
    }
    updatePlayerSegments(player.segments, player.level);
  });
};

updateCoins = () => {
  if (gameState.coins.length < MAX_COINS) {
    gameState.coins.push({
      x: randomNumber(0, 1200 / 40),
      y: randomNumber(0, 1000 / 40)
    });
  }
};

setInterval(() => {
  gameState.tick = gameState.tick++;
  updatePlayers();
  updateCoins();
  io.sockets.emit('state', gameState);
}, 1000 / GAME_SPEED);

server.listen(port, () => console.log(`Listening on port ${port}`));
