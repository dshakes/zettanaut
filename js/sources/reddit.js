import { fetchJSON } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'reddit';

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  const subs = CONFIG.SEARCH_QUERIES.reddit_subreddits;
  const url = `https://www.reddit.com/r/${subs}/hot.json?limit=${CONFIG.MAX_ITEMS_PER_SOURCE}&raw_json=1`;

  const data = await fetchJSON(url, { useProxy: true });
  const children = data?.data?.children || [];

  const items = children
    .filter(c => c.data && !c.data.stickied)
    .map(c => {
      const d = c.data;
      return {
        id: `reddit-${d.id}`,
        title: d.title || '',
        url: d.url && !d.url.startsWith('/r/') ? d.url : `https://www.reddit.com${d.permalink}`,
        description: d.selftext ? d.selftext.slice(0, 200) : '',
        source: 'reddit',
        sourceName: `r/${d.subreddit}`,
        author: d.author || '',
        publishedAt: new Date(d.created_utc * 1000).toISOString(),
        engagement: { score: d.score || 0, comments: d.num_comments || 0 },
        tags: [d.subreddit],
        type: 'news',
      };
    });

  cache.set(CACHE_KEY, items, CONFIG.CACHE_TTL.news);
  return items;
}
