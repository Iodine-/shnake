import React, { Fragment } from 'react';
import { Table } from 'evergreen-ui';

export default function Leaderboard({ player, players }) {
  const playersArr = [];
  for (const player in players) {
    if (players.hasOwnProperty(player)) {
      playersArr.push(players[player]);
    }
  }

  const isCurrentPlayer = id => {
    // console.log(player);
    // console.log(id);
    if (player.id === id) {
      return 'success';
    } else {
      return 'none';
    }
  };

  return (
    <Fragment>
      <Table>
        <Table.Head>
          <Table.TextHeaderCell>Name</Table.TextHeaderCell>
          <Table.TextHeaderCell>Score</Table.TextHeaderCell>
        </Table.Head>
        <Table.Body height={240}>
          {playersArr.map(player => {
            const intent = isCurrentPlayer(player.id);
            return (
              <Table.Row
                key={player.id}
                intent={intent}
                isSelectable={false}
                onSelect={() => alert(player.name)}
              >
                <Table.TextCell>{player.name}</Table.TextCell>
                <Table.TextCell isNumber>{player.level}</Table.TextCell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Fragment>
  );
}
