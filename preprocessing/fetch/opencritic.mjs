import { readFile, stat, writeFile } from 'node:fs/promises';
import ProgressBar from 'progress';
import { extractMainContentFromURL } from '../extract/content.mjs';

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.RAPID_API_KEY,
    'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com',
  },
};

const gameInfoByName = async (gameName) => {
  const url = `https://opencritic-api.p.rapidapi.com/game/search?criteria=${encodeURIComponent(
    gameName
  )}`;

  const games = await fetch(url, options).then((res) => res.json());
  return games[0];
};

const getGameReviews = async ({ game, allReviews = [], skip = 0 }) => {
  const filePath = `./dataset/${game.id}-oc-api.json`;
  try {
    await stat(filePath);
    console.log('Game OC', game.id, 'already processed, skipping...');
    const dataStr = await readFile(filePath, 'utf-8');
    const data = JSON.parse(dataStr);
    return data;
  } catch (err) {
    console.log('Processing', game.id);
  }

  const url = `https://opencritic-api.p.rapidapi.com/review/game/${game.id}?skip=${skip}`;

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com',
    },
  };

  const reviews = await fetch(url, options).then((res) => res.json());
  if (reviews.length === 0) {
    console.log(`Done fetching`);
    await writeFile(filePath, JSON.stringify(allReviews, null, 2), 'utf-8');
    console.log(`Saved`, game.id);
    return allReviews;
  }

  const newAllReviews = allReviews.concat(reviews);
  console.log(`Fetched ${allReviews.length} reviews, continuing...`);
  return await getGameReviews({
    game,
    allReviews: newAllReviews,
    skip: skip + reviews.length,
  });
};

export const getOpenCriticReviews = async (gameName) => {
  const game = await gameInfoByName(gameName);
  const reviewLinks = await getGameReviews({ game });

  // create progress bar if needed
  const progress = new ProgressBar(
    ':bar :percent [:current / :total] | :elapsed - :eta ( :rate )  ',
    { total: reviewLinks.length }
  );

  const reviews = await Promise.all(
    reviewLinks.map(async (reviewData) => {
      try {
        const content = await extractMainContentFromURL(reviewData.externalUrl);
        progress.tick();
        return {
          opencritic: reviewData,
          ...content,
        };
      } catch (err) {
        return {
          opencritic: reviewData,
          error: err,
        };
      }
    })
  );
  // for some reason not using structured cloning sometimes results in circular JSON
  // (even though we don't really have any circular structures?)
  return structuredClone(reviews);
};
