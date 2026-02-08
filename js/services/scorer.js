import { CONFIG } from '../config.js';

function recencyScore(publishedAt) {
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  return Math.max(0, Math.min(100, 100 * Math.exp(-ageHours / 48)));
}

function engagementScore(item) {
  const s = item.engagement?.score || 0;
  const c = item.engagement?.comments || 0;
  const combined = s + c * 0.5;

  switch (item.source) {
    case 'hackernews': return Math.min(100, combined / 3);
    case 'reddit': return Math.min(100, combined / 10);
    case 'devto': return Math.min(100, combined / 2);
    case 'huggingface': return Math.min(100, combined / 1.5);
    case 'semantic_scholar': return Math.min(100, s / 5);
    case 'major_releases': return Math.min(100, s);
    case 'arxiv': return 30;
    default:
      // RSS feeds (rss_*) have no engagement data
      if (item.source?.startsWith('rss_')) return 40;
      return 20;
  }
}

function authorityScore(item) {
  // Direct match first
  let authority = CONFIG.SOURCE_AUTHORITY[item.source];
  // Try rss prefix match
  if (authority == null && item.source?.startsWith('rss_')) {
    authority = CONFIG.SOURCE_AUTHORITY.rss;
  }
  return (authority ?? 0.5) * 100;
}

export function scoreItem(item) {
  const r = recencyScore(item.publishedAt);
  const e = engagementScore(item);
  const a = authorityScore(item);
  return Math.round(r * 0.35 + e * 0.35 + a * 0.30);
}

export function scoreAndSort(items) {
  return items
    .map(item => ({ ...item, score: scoreItem(item) }))
    .sort((a, b) => b.score - a.score);
}
