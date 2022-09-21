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
  const reviews = await Promise.all(
    reviewLinks.map(async (reviewData) => {
      const content = await extractMainContentFromURL(reviewData.externalUrl);
      return {
        opencritic: reviewData,
        ...content,
      };
    })
  );
  return reviews;
};
