import { writeFile } from 'node:fs/promises';
import { getOpenCriticReviews } from './preprocessing/fetch-opencritic-reviews.mjs';
import { getSteamReviewsApi } from './preprocessing/fetch-steam-reviews-api.mjs';

const steamReviews = await getSteamReviewsApi({ appId: '1602080' }); // Soulstice
const openCriticReviews = await getOpenCriticReviews('Soulstice');

await writeFile(
  './reviews.json',
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
