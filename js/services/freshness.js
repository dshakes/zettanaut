import { CONFIG } from '../config.js';

const HOUR_MS = 60 * 60 * 1000;

export function ageHours(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / HOUR_MS;
}

// Returns one of: 'new' | 'hot' | 'trending' | null
// 'new' = published <12h ago (visual urgency)
// 'hot' = high-engagement <48h (popular signal)
// 'trending' = decent engagement <72h
export function freshnessTag(item) {
  const h = ageHours(item.publishedAt);
  const score = item.engagement?.score || 0;

  if (h < CONFIG.FRESHNESS.new) return 'new';
  if (h < 48 && score >= CONFIG.FRESHNESS.hot_min_score) return 'hot';
  if (h < 72 && score >= CONFIG.FRESHNESS.trending_min_score) return 'trending';
  return null;
}

// Time bucket for grouped views: today | yesterday | this-week | older
export function timeBucket(dateStr) {
  const h = ageHours(dateStr);
  if (h < CONFIG.FRESHNESS.today) return 'today';
  if (h < CONFIG.FRESHNESS.yesterday) return 'yesterday';
  if (h < CONFIG.FRESHNESS.week) return 'this-week';
  return 'older';
}

export const BUCKET_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  'this-week': 'This Week',
  older: 'Earlier',
};

// Group items by time bucket, preserving sort order within each bucket.
export function groupByTime(items) {
  const groups = { today: [], yesterday: [], 'this-week': [], older: [] };
  for (const it of items) groups[timeBucket(it.publishedAt)].push(it);
  return groups;
}

// Count items by bucket — handy for showing "12 new today".
export function bucketCounts(items) {
  const counts = { today: 0, yesterday: 0, 'this-week': 0, older: 0, new: 0 };
  for (const it of items) {
    counts[timeBucket(it.publishedAt)]++;
    if (ageHours(it.publishedAt) < CONFIG.FRESHNESS.new) counts.new++;
  }
  return counts;
}

// Filter items by a time window in hours (e.g. last 24).
export function withinHours(items, hours) {
  return items.filter(it => ageHours(it.publishedAt) <= hours);
}
