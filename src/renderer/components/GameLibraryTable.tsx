import React, { useEffect, useState } from 'react';
import { Grid } from 'gridjs-react';
import { html } from 'gridjs';
import { Game } from '../assets/types';
import 'gridjs/dist/theme/mermaid.css';
import '../assets/css/game-table.css';

export default function GameLibraryTable() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    window.api.getGames().then(setGames);
  }, []);

  // Helper: wrap cell in duplicate highlight if needed
  const wrapDuplicate = (game: Game, value: string | number) =>
    html(
      `<span class="${game.duplicate ? 'duplicate-row-cell' : ''}">${value}</span>`
    );

  return (
    <Grid
      data={games.map((game) => [
        wrapDuplicate(game, game.title),
        wrapDuplicate(game, game.genre || ''),
        wrapDuplicate(
          game,
          game.stores
            .map(
              (store) =>
                `<span class="store-badge store-${store.toLowerCase()}">${store}</span>`
            )
            .join(' ')
        ),
        wrapDuplicate(game, `$${game.pricePaid?.toFixed(2) || 0}`),
        wrapDuplicate(game, game.duplicate ? 'Yes' : 'No'),
      ])}
      columns={['Title', 'Genre', 'Store(s)', 'Price Paid', 'Duplicate']}
      search={true}
      sort={true}
      pagination={{ limit: 10 }}
    />
  );
}
