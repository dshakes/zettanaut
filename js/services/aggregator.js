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

async function fetchAllSafe(fetchers) {
  const results = await Promise.allSettled(fetchers.map(fn => fn()));
  const items = [];
  const errors = [];
  results.forEach((r) => {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      items.push(...r.value);
    } else {
      errors.push(r.reason?.message || 'Unknown error');
    }
  });
  return { items, errors };
}

export async function fetchAllNews() {
  const { items, errors } = await fetchAllSafe([fetchHN, fetchDevto, fetchReddit, fetchRSS]);
  const deduped = deduplicate(items);
  return { items: scoreAndSort(deduped), errors };
}

export async function fetchAllPapers() {
  const { items, errors } = await fetchAllSafe([fetchArxiv, fetchSemantic, fetchHF]);
  const deduped = deduplicate(items);
  return { items: scoreAndSort(deduped), errors };
}

export async function fetchAllReleases() {
  const { items, errors } = await fetchAllSafe([fetchMajorReleases, fetchHNReleases]);
  const deduped = deduplicate(items);
  return { items: scoreAndSort(deduped), errors };
}
