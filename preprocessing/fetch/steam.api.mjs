import { setTimeout } from 'node:timers/promises';

const SLEEP_TIMEOUT = 100;

const defaultGameReview = {
  num_reviews: null,
  review_score: null,
  review_score_desc: null,
  total_positive: null,
  total_negative: null,
  total_reviews: null,
  reviews: [],
};

export const getSteamReviewsApi = async ({
  appId,
  cursor,
  gameResults = defaultGameReview,
}) => {
  const baseUrl = `https://store.steampowered.com/appreviews/${appId}`;
  const params = new URLSearchParams({
    json: 1,
    language: 'english',
    purchase_type: 'all',
    num_per_page: 100,
    ...(cursor?.length > 0 ? { cursor } : {}),
  }).toString();
  const url = `${baseUrl}?${params}`;

  // get results
  const {
    query_summary,
    reviews: newReviews,
    cursor: newCursor,
  } = await fetch(url).then((r) => r.json());

  // update metadata
  if (query_summary) {
    const {
      num_reviews,
      review_score,
      review_score_desc,
      total_positive,
      total_negative,
      total_reviews,
    } = query_summary;
    gameResults.num_reviews = num_reviews ?? gameResults.num_reviews;
    gameResults.review_score = review_score ?? gameResults.review_score;
    gameResults.review_score_desc =
      review_score_desc ?? gameResults.review_score_desc;
    gameResults.total_positive = total_positive ?? gameResults.total_positive;
    gameResults.total_negative = total_negative ?? gameResults.total_negative;
    gameResults.total_reviews = total_reviews ?? gameResults.total_reviews;
  }
  // add reviews to list
  gameResults.reviews = gameResults.reviews.concat(newReviews);
  await setTimeout(SLEEP_TIMEOUT);

  console.log(
    `Fetched ${gameResults.reviews.length} of ${gameResults.total_reviews} reviews. Continuing to next page...`
  );

  if (newCursor?.length > 0) {
    return getSteamReviewsApi({
      appId,
      cursor: newCursor,
      gameResults,
    });
  }

  return gameResults;
};
