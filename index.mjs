import { writeFile } from 'node:fs/promises';
import { getSteamReviews } from './preprocessing/fetch-steam-reviews.mjs';

// const res = await getSteamReviews({ appId: '1150760' }); // Gloomwood - ~1000 reviews
const res = await getSteamReviews({ appId: '1666250' }); // Circus Electrique ~35 reviews

await writeFile('./reviews.json', JSON.stringify(res, null, 2), 'utf-8');
