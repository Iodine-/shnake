import React, { Fragment } from 'react';
import { Rect, Line, Circle, Group } from 'react-konva';

const BLOCKSIZE = process.env.REACT_APP_BLOCK_SIZE;

function Eye({ flipped }) {
  return (
    <Circle
      x={0}
      y={0}
      offsetX={flipped ? -5 : -5}
      offsetY={flipped ? -15 : -5}
      width={7}
      height={7}
      fill="black"
      stroke="white"
      strokeWidth={3}
    />
  );
}

function Mouth({ flipped }) {
  const mouth = {
    regular: [0, 15, 10, 15, 12, 10],
    flipped: [0, 5, 10, 5, 12, 10]
  };
  return (
    <Line
      x={0}
      y={0}
      points={flipped ? mouth.flipped : mouth.regular}
      tension={0.5}
      stroke="black"
    />
  );
}

function Face({ player, flipped }) {
  if (player.image) {
    const newImage = new window.Image();
    newImage.src = player.image;

    return (
      <Rect
        width={player.size}
        height={player.size}
        fillPatternImage={newImage}
        fillPatternScaleX={0.4}
        fillPatternScaleY={0.4}
        shadowBlur={3}
        shadowOpacity={0.5}
      />
    );
  } else {
    return (
      <Fragment>
        <Rect
          width={player.size}
          height={player.size}
          fill={player.colour}
          shadowBlur={3}
          shadowOpacity={0.5}
        />
        <Eye flipped={flipped} />
        <Mouth flipped={flipped} />
      </Fragment>
    );
  }
}

function Torso({ player }) {
  return (
    <Rect
      width={player.size}
      height={player.size}
      fill={player.colour}
      shadowBlur={3}
      shadowOpacity={0.5}
    />
  );
}

function PlayerCell({ player, head, flipped }) {
  if (head) {
    return <Face player={player} flipped={flipped} />;
  } else {
    return <Torso player={player} flipped={flipped} />;
  }
}

export default function Player(props) {
  const { player, id } = props;
  const { segments = [] } = player;

  const segment = (data, head, direction) => {
    let rotation = 0;
    let flipped = false;

    switch (direction) {
      case 'up':
        rotation = 90;
        break;
      case 'right':
        flipped = true;
        rotation = 180;
        break;
      case 'left':
        rotation = 0;
        flipped = false;
        break;
      case 'down':
        rotation = 270;
        break;
      default:
        break;
    }
    return (
      <Group
        x={data.x * BLOCKSIZE + BLOCKSIZE / 2}
        y={data.y * BLOCKSIZE + BLOCKSIZE / 2}
        offsetX={BLOCKSIZE / 2}
        offsetY={BLOCKSIZE / 2}
        rotation={rotation}
        key={`id${data.x}${data.y}${player.id}${player.level}`}
      >
        <Group>
          <PlayerCell player={player} head={head} flipped={flipped} />
        </Group>
      </Group>
    );
  };
  return segments.map((data, i) => {
    return segment(data, i === segments.length - 1, player.direction);
  });
}
