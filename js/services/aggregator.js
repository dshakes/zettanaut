import { scoreAndSort } from './scorer.js';
import { fetchItems as fetchHN } from '../sources/hackernews.js';
import { fetchItems as fetchDevto } from '../sources/devto.js';
import { fetchItems as fetchReddit } from '../sources/reddit.js';
import { fetchItems as fetchRSS } from '../sources/rss.js';
import { fetchItems as fetchArxiv } from '../sources/arxiv.js';
import { fetchItems as fetchSemantic } from '../sources/semanticscholar.js';
import { fetchItems as fetchHF } from '../sources/huggingface.js';
import { fetchItems as fetchHNReleases } from '../sources/hn-releases.js';
import { fetchItems as fetchMajorReleases } from '../sources/major-releases.js';
import { fetchItems as fetchAnthropic } from '../sources/anthropic.js';
import { fetchItems as fetchGoogleNews } from '../sources/google-news.js';

function deduplicate(items) {
  const seen = new Map();
  return items.filter(item => {
    const normTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (seen.has(item.url) || seen.has(normTitle)) return false;
    seen.set(item.url, true);
    seen.set(normTitle, true);
    return true;
  });
}

// Fetch with per-source labelling so we can surface which sources loaded vs failed.
async function fetchAllSafe(fetchers) {
  const results = await Promise.allSettled(fetchers.map(({ fn }) => fn()));
  const items = [];
  const sourceHealth = [];
  results.forEach((r, i) => {
    const label = fetchers[i].label;
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      items.push(...r.value);
      sourceHealth.push({ name: label, ok: true, count: r.value.length });
    } else {
      sourceHealth.push({ name: label, ok: false, count: 0, error: r.reason?.message || 'failed' });
    }
  });
  const errors = sourceHealth.filter(s => !s.ok).map(s => `${s.name}: ${s.error}`);
  return { items, errors, sourceHealth };
}

export async function fetchAllNews() {
  const result = await fetchAllSafe([
    { fn: fetchHN, label: 'Hacker News' },
    { fn: fetchDevto, label: 'Dev.to' },
    { fn: fetchReddit, label: 'Reddit' },
    { fn: fetchRSS, label: 'Blogs' },
    { fn: fetchAnthropic, label: 'Anthropic' },
    { fn: fetchGoogleNews, label: 'Google News' },
  ]);
  const deduped = deduplicate(result.items);
  return { items: scoreAndSort(deduped), errors: result.errors, sourceHealth: result.sourceHealth };
}

export async function fetchAllPapers() {
  const result = await fetchAllSafe([
    { fn: fetchArxiv, label: 'arXiv' },
    { fn: fetchSemantic, label: 'Semantic Scholar' },
    { fn: fetchHF, label: 'HuggingFace' },
  ]);
  const deduped = deduplicate(result.items);
  return { items: scoreAndSort(deduped), errors: result.errors, sourceHealth: result.sourceHealth };
}

export async function fetchAllReleases() {
  const result = await fetchAllSafe([
    { fn: fetchMajorReleases, label: 'Curated' },
    { fn: fetchHNReleases, label: 'HN Releases' },
    { fn: async () => (await fetchAnthropic()).filter(i => i.type === 'release'), label: 'Anthropic Releases' },
  ]);
  const deduped = deduplicate(result.items);
  return { items: scoreAndSort(deduped), errors: result.errors, sourceHealth: result.sourceHealth };
}
