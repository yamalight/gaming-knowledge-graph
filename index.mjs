import camelCase from 'camelcase';
import { stat, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { games } from './games-list.mjs';
import { getOpenCriticReviews } from './preprocessing/fetch/opencritic.mjs';
import { getSteamReviewsApi } from './preprocessing/fetch/steam.api.mjs';

const INTERGAME_TIMEOUT = 1000;

const getSteamReviews = async () => {
  // get steam reviews
  for (const game of games) {
    const filePath = `./dataset/${camelCase(game.gameName)}-steam.json`;
    try {
      await stat(filePath);
      console.log('Game', game.gameName, 'already processed, skipping...');
      continue;
    } catch (err) {
      console.log('Processing', game.gameName);
    }

    const steamReviews = await getSteamReviewsApi({ appId: game.steamId });
    await writeFile(filePath, JSON.stringify(steamReviews, null, 2), 'utf-8');
    console.log('Saved', filePath);

    await setTimeout(INTERGAME_TIMEOUT);
  }
};

const getCriticReviews = async () => {
  // get opencritic reviews
  for (const game of games) {
    const filePath = `./dataset/${camelCase(game.gameName)}-opencritic.json`;
    try {
      await stat(filePath);
      console.log('Game', game.gameName, 'already processed, skipping...');
      continue;
    } catch (err) {
      console.log('Processing', game.gameName);
    }

    const openCriticReviews = await getOpenCriticReviews(game.gameName);
    await writeFile(
      filePath,
      JSON.stringify(openCriticReviews, null, 2),
      'utf-8'
    );
    console.log('Saved', filePath);

    await setTimeout(INTERGAME_TIMEOUT);
  }
};

const processGames = async () => {
  // await getSteamReviews();
  await getCriticReviews();
};

processGames();
