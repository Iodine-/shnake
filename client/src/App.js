import React, { useState, useEffect, Fragment } from 'react';
import io from 'socket.io-client';
import Portal from './Portal';
import { Stage, Layer, Rect, Line, Circle } from 'react-konva';
import KeyboardEventHandler from 'react-keyboard-event-handler';
import Rodal from 'rodal';

import { Switch, Pane } from 'evergreen-ui';
import Webcam from 'react-webcam';

import Player from './components/Player';
import Leaderboard from './components/Leaderboard';

import 'rodal/lib/rodal.css';

const videoConstraints = {
  width: 100,
  height: 100,
  facingMode: 'user'
};

const socket = io('https://mgroth01vl:4001');
socket.emit('newPlayer');

const KEYMAP = {
  up: 'up',
  left: 'left',
  right: 'right',
  down: 'down',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right'
};

socket.on('connect', function() {
  console.log(socket.id);
});

let playerDirection = '';

const WIDTH = 1200;
const HEIGHT = 1000;
const BLOCKSIZE = 40;

setInterval(() => {
  socket.emit('playerMovement', playerDirection);
}, 1000 / 24);

socket.on('died', message => {
  console.log('died');
  playerDirection = '';
});

function Coin({ coin }) {
  return (
    <Circle
      x={coin.x * BLOCKSIZE}
      y={coin.y * BLOCKSIZE}
      offset={{ x: -BLOCKSIZE / 2, y: -BLOCKSIZE / 2 }}
      width={14}
      height={14}
      fill="yellow"
      shadowBlur={2}
      shadowOpacity={0.8}
    />
  );
}

function GridV() {
  const lines = [];
  for (var i = 0; i < WIDTH / BLOCKSIZE; i++) {
    lines.push(
      <Line
        points={[
          Math.round(i * BLOCKSIZE) + 0.5,
          0,
          Math.round(i * BLOCKSIZE) + 0.5,
          HEIGHT
        ]}
        stroke="#eee"
        strokeWidth={1}
        key={`vline-${i}`}
      />
    );
  }
  return lines;
}

function GridH() {
  const lines = [];
  for (var j = 0; j < HEIGHT / BLOCKSIZE; j++) {
    lines.push(
      <Line
        points={[
          0,
          Math.round(j * BLOCKSIZE),
          WIDTH,
          Math.round(j * BLOCKSIZE)
        ]}
        stroke="#eee"
        strokeWidth={0.5}
        key={`hline-${j}`}
      />
    );
  }
  return lines;
}

function EditNameModal({ playerName, open, handleClose }) {
  const [name, setName] = useState(playerName);

  const updateName = () => {
    if (name === '') {
      setName(playerName);
    }
    handleClose(name);
  };

  return (
    <Rodal visible={open} onClose={updateName}>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>
      </div>
    </Rodal>
  );
}

function setDirection(direction) {
  playerDirection = direction;
}

function App() {
  const [players, setPlayers] = useState([]);
  const [player, setPlayer] = useState({});
  const [editingName, setEditingName] = useState(false);
  const [coins, setCoins] = useState([]);
  const [camera, setCamera] = useState(false);

  const handleEditName = () => {
    setEditingName(true);
  };

  const closeEditName = name => {
    setEditingName(false);
    socket.emit('updateName', name);
  };

  const changeDirection = key => {
    const direction = KEYMAP[key];
    if (players[socket.id]) {
      if (players[socket.id].level <= 1) {
        return setDirection(direction);
      }
    }
    switch (direction) {
      case 'left':
        if (playerDirection !== 'right') {
          setDirection(direction);
        }
        break;
      case 'right':
        if (playerDirection !== 'left') {
          setDirection(direction);
        }
        break;
      case 'up':
        if (playerDirection !== 'down') {
          setDirection(direction);
        }
        break;
      case 'down':
        if (playerDirection !== 'up') {
          setDirection(direction);
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    socket.on('state', payload => {
      setPlayers(payload.players);
      setCoins(payload.coins);
    });
  }, []);

  useEffect(() => {
    socket.on('state', payload => {
      if (player.id !== socket.id) {
        setPlayer(payload.players[socket.id] || {});
      }
    });
  }, []);

  const webcamRef = React.useRef(null);

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    socket.emit('updatePlayerImage', imageSrc);
  }, [webcamRef]);

  const clearImage = () => {
    socket.emit('updatePlayerImage', '');
  };

  return (
    <div>
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Rect
            height={window.innerHeight}
            width={window.innerWidth}
            fill="limegreen"
            zIndex={-1}
          />
          <Portal>
            <div
              style={{
                position: 'absolute',
                backgroundColor: 'white',
                boxShadow: '0 0 5px #777',
                top: 0,
                right: 0,
                width: 250,
                height: window.innerHeight
              }}
            >
              <Leaderboard player players={players} />
              <div style={{ position: 'absolute', padding: 15, bottom: 0 }}>
                Name: {player && player.name}
                <a
                  style={{ cursor: 'pointer', marginLeft: 10 }}
                  onClick={handleEditName}
                >
                  &#9998;
                </a>
                <Pane>
                  Enable Camera
                  <Switch
                    marginBottom={16}
                    onChange={e => setCamera(e.target.checked)}
                  />
                </Pane>
                {camera && (
                  <Fragment>
                    <Webcam
                      audio={false}
                      height={100}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      width={100}
                      videoConstraints={videoConstraints}
                    />
                    <button onClick={capture}>Capture</button>
                    <button onClick={clearImage}>Clear</button>
                  </Fragment>
                )}
              </div>
            </div>
          </Portal>
        </Layer>
        <Layer
          x={(window.innerWidth - WIDTH - 250) / 2}
          y={(window.innerHeight - HEIGHT) / 2}
        >
          <Rect width={1200} height={1000} fill={'#fff'} />
          <GridV />
          <GridH />
          {Object.keys(players).map((v, i) => {
            return <Player player={players[v]} id={v} key={v} />;
          })}
          {coins.map((v, i) => {
            return <Coin key={`coin${i}`} coin={v} />;
          })}
        </Layer>
      </Stage>
      <EditNameModal
        playerName={player.name}
        open={editingName}
        handleClose={name => closeEditName(name)}
      />
      <KeyboardEventHandler
        handleKeys={['left', 'right', 'up', 'down', 'w', 'a', 's', 'd']}
        handleEventType="keydown"
        onKeyEvent={(key, e) => changeDirection(key)}
      />
    </div>
  );
}

export default App;
