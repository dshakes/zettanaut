import { fetchJSON } from '../services/fetcher.js';

export async function fetchItems() {
  // No localStorage cache — this is a local file, instant to load
  const data = await fetchJSON(`data/major-releases.json?v=${Date.now()}`);
  const releases = data.releases || [];

  return releases.map(r => ({
    id: `major-${Array.from(r.title.slice(0, 20), c => c.charCodeAt(0).toString(36)).join('')}`,
    title: r.title,
    url: r.url,
    description: r.description,
    source: 'major_releases',
    sourceName: r.company,
    author: r.company,
    publishedAt: r.date + 'T12:00:00',  // noon local to avoid timezone day-shift
    engagement: { score: r.significance, comments: 0 },
    tags: [r.category, r.company].filter(Boolean),
    type: 'release',
    extra: {
      category: r.category,
      significance: r.significance,
    },
  }));
}
