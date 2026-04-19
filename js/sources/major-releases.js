import { fetchJSON } from '../services/fetcher.js';
import { CONFIG } from '../config.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function fetchItems() {
  try {
    // Hourly cache-buster: fresh enough for a manually-edited JSON, lets the
    // browser HTTP-cache the file across page loads within the hour.
    const hourBucket = Math.floor(Date.now() / 3600000);
    const data = await fetchJSON(`data/major-releases.json?v=${hourBucket}`);
    const releases = data.releases || [];
    const cutoff = Date.now() - CONFIG.CURATED_RELEASE_MAX_AGE_DAYS * DAY_MS;

    return releases.map(r => {
      const ts = new Date(r.date + 'T12:00:00').getTime();
      const isStale = ts < cutoff;
      return {
        id: `major-${Array.from(r.title.slice(0, 20), c => c.charCodeAt(0).toString(36)).join('')}`,
        title: r.title,
        url: r.url,
        description: r.description,
        source: 'major_releases',
        sourceName: r.company,
        author: r.company,
        publishedAt: r.date + 'T12:00:00',
        // Soften significance once curated entry is past freshness window so live items can lead.
        engagement: { score: isStale ? Math.max(20, r.significance - 40) : r.significance, comments: 0 },
        tags: [r.category, r.company].filter(Boolean),
        type: 'release',
        extra: {
          category: r.category,
          significance: r.significance,
          stale: isStale,
        },
      };
    });
  } catch {
    console.warn('Major releases fetch failed, skipping');
    return [];
  }
}
