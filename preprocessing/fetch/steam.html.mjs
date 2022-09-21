import * as cheerio from 'cheerio';
import { setTimeout } from 'node:timers/promises';

function htmlToReviews(html) {
  const $ = cheerio.load(`<body>${html}</body>`);
  // const newCursor = $('input[name=userreviewscursor]').attr('value');
  // console.log({ newCursor });
  // console.log(result);
  const reviews = Array.from($('.apphub_Card')).map((item) => {
    const it = $(item);
    const recommended = it.find('.reviewInfo .title').html();
    const timePlayed = it.find('.reviewInfo .hours').html();
    const timePosted = it.find('.apphub_CardTextContent .date_posted').html();
    // remove time from text
    it.find('.apphub_CardTextContent .date_posted').remove();
    const reviewText = it.find('.apphub_CardTextContent').html();
    const authorLink = it
      .find('.apphub_CardContentAuthorName a:nth-child(2)')
      .attr('href');
    const authorName = it
      .find('.apphub_CardContentAuthorName a:nth-child(2)')
      .html();
    return {
      // source: it,
      recommended,
      timePlayed,
      timePosted,
      reviewText: reviewText.replace(/\n\n+/g, '\n').replace(/\t+/g, ''),
      authorLink,
      authorName,
    };
  });

  return Array.from(reviews);
}

function findCursor(html) {
  const $ = cheerio.load(`<body>${html}</body>`);
  const cursor = $('input[name="userreviewscursor"]').attr('value');
  return cursor;
}

const SLEEP_TIMEOUT = 500;

export const getSteamReviews = async ({ appId }) => {
  const baseUrl = `https://steamcommunity.com/app/${appId}/reviews/?browsefilter=mostrecent`;

  const result = await fetch(baseUrl).then((r) => r.text());
  const initialReviews = htmlToReviews(result);
  const newCursor = findCursor(result);
  await setTimeout(SLEEP_TIMEOUT);
  console.log(
    'Fetched',
    initialReviews.length,
    'reviews. Continuing to next page...'
  );

  return getSteamReviewsNext({
    appId,
    cursor: newCursor,
    reviews: initialReviews,
  });
};

export const getSteamReviewsNext = async ({
  appId,
  cursor = undefined,
  page = 2,
  reviews = [],
}) => {
  const baseUrl = `https://steamcommunity.com/app/${appId}/homecontent/`;
  const numberPerPage = 10;
  const offset = page * numberPerPage - numberPerPage;
  const paramsObject = {
    ...(cursor ? { userreviewscursor: cursor } : {}),
    ...(offset > 0 ? { userreviewsoffset: offset } : {}),
    p: page,
    workshopitemspage: page,
    readytouseitemspage: page,
    mtxitemspage: page,
    itemspage: page,
    screenshotspage: page,
    videospage: page,
    artpage: page,
    allguidepage: page,
    webguidepage: page,
    integratedguidepage: page,
    discussionspage: page,
    numperpage: numberPerPage,
    browsefilter: 'mostrecent',
    l: 'english',
    appid: appId,
    appHubSubSection: '10',
    filterLanguage: 'default',
    searchText: '',
    maxInappropriateScore: '100',
    forceanon: 0,
  };
  const params = new URLSearchParams(paramsObject).toString();

  const url = `${baseUrl}?${params}`;

  const result = await fetch(url).then((r) => r.text());
  const newCursor = findCursor(result);
  const newReviews = htmlToReviews(result);

  if (newReviews.length === 0 || !newCursor) {
    console.log(
      'Done fetching reviews, got',
      reviews.length,
      'total reviews. Saving to file..'
    );
    return reviews;
  }

  const allReviews = reviews.concat(newReviews);
  await setTimeout(SLEEP_TIMEOUT);

  console.log(
    'Fetched',
    allReviews.length,
    'reviews. Continuing to next page...'
  );

  return getSteamReviewsNext({
    appId,
    cursor: newCursor,
    page: page + 1,
    reviews: allReviews,
  });
};
