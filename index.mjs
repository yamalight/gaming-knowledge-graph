import camelCase from 'camelcase';
import { stat, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { games } from './games-list.mjs';
import { getOpenCriticReviews } from './preprocessing/fetch/opencritic.mjs';
import { getSteamReviewsApi } from './preprocessing/fetch/steam.api.mjs';

const INTERGAME_TIMEOUT = 1000;

const processGames = async () => {
  for (const game of games) {
    const filePath = `./dataset/${camelCase(game.gameName)}.json`;
    try {
      await stat(filePath);
      console.log('Game', game.gameName, 'already processed, skipping...');
      continue;
    } catch (err) {
      console.log('Processing', game.gameName);
    }

    const steamReviews = await getSteamReviewsApi({ appId: game.steamId });
    const openCriticReviews = await getOpenCriticReviews(game.gameName);
    await writeFile(
      filePath,
      JSON.stringify(
        {
          steamReviews,
          openCriticReviews,
        },
        null,
        2
      ),
      'utf-8'
    );

    await setTimeout(INTERGAME_TIMEOUT);
  }
};

processGames();
