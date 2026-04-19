// Comprehensive Anthropic source.
// Combines: news sitemap (most reliable for blog posts), GitHub release feeds,
// and YouTube channel feed. Anthropic's RSS is broken — sitemap.xml is the
// canonical place for every published news post with a real lastmod date.
import { fetchXML } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'anthropic';

const SITEMAP_URL = 'https://www.anthropic.com/sitemap.xml';

// GitHub atom feeds for Anthropic-owned repos. Releases > commits for signal.
const GITHUB_FEEDS = [
  { repo: 'anthropics/claude-code', kind: 'releases', label: 'Claude Code' },
  { repo: 'anthropics/anthropic-sdk-python', kind: 'releases', label: 'Python SDK' },
  { repo: 'anthropics/anthropic-sdk-typescript', kind: 'releases', label: 'TypeScript SDK' },
  { repo: 'anthropics/dxt', kind: 'releases', label: 'Desktop Extensions' },
  { repo: 'anthropics/anthropic-cookbook', kind: 'commits', label: 'Cookbook' },
  { repo: 'anthropics/anthropic-quickstarts', kind: 'commits', label: 'Quickstarts' },
];

// YouTube channel: Anthropic
const YOUTUBE_FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCrDwWp7EBBv4NwvScIpBDOA';

function titleFromSlug(slug) {
  // Convert 'claude-opus-4-7' → 'Claude Opus 4 7'; small words stay lowercase.
  const small = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
  return slug.split('-').map((w, i) => {
    if (i > 0 && small.has(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

async function fetchSitemap() {
  const doc = await fetchXML(SITEMAP_URL, { useProxy: true });
  const urls = Array.from(doc.querySelectorAll('url'));
  const items = [];
  for (const u of urls) {
    const loc = u.querySelector('loc')?.textContent?.trim();
    const lastmod = u.querySelector('lastmod')?.textContent?.trim();
    if (!loc || !lastmod) continue;
    const m = loc.match(/\/news\/([a-z0-9-]+)$/i);
    if (!m) continue;
    const slug = m[1];
    items.push({
      id: `anthropic-news-${slug}`,
      title: titleFromSlug(slug),
      url: loc,
      description: '',
      author: 'Anthropic',
      sourceName: 'Anthropic',
      source: 'anthropic',
      publishedAt: lastmod,
      engagement: { score: 0, comments: 0 },
      tags: ['ai', 'anthropic', /claude/i.test(slug) ? 'claude' : 'anthropic'],
      type: /claude-(opus|sonnet|haiku|code|design)|sdk|api|developer|model/i.test(slug) ? 'release' : 'news',
      extra: { authority: 1.0 },
    });
  }
  return items;
}

async function fetchGithubFeed({ repo, kind, label }) {
  const url = `https://github.com/${repo}/${kind === 'releases' ? 'releases.atom' : 'commits/main.atom'}`;
  const doc = await fetchXML(url, { useProxy: true });
  const entries = Array.from(doc.querySelectorAll('entry')).slice(0, 10);
  return entries.map(e => {
    const title = e.querySelector('title')?.textContent?.trim() || '';
    const link = e.querySelector('link')?.getAttribute('href') || '';
    const updated = e.querySelector('updated')?.textContent || new Date().toISOString();
    const id = `anthropic-${repo.split('/')[1]}-${title.replace(/[^a-z0-9]/gi, '').slice(0, 30)}`;
    const summaryHtml = e.querySelector('content, summary')?.textContent || '';
    const desc = summaryHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    return {
      id,
      title: kind === 'releases' ? `${label} ${title}` : `${label}: ${title}`,
      url: link,
      description: desc,
      author: 'Anthropic',
      sourceName: `Anthropic / ${label}`,
      source: 'anthropic',
      publishedAt: updated,
      engagement: { score: 0, comments: 0 },
      tags: ['ai', 'anthropic', kind === 'releases' ? 'release' : 'code', label.toLowerCase().replace(/\s+/g, '-')],
      type: kind === 'releases' ? 'release' : 'news',
      extra: { authority: 1.0, repo },
    };
  });
}

async function fetchYouTube() {
  const doc = await fetchXML(YOUTUBE_FEED, { useProxy: true });
  const entries = Array.from(doc.querySelectorAll('entry')).slice(0, 10);
  return entries.map(e => {
    const title = e.querySelector('title')?.textContent?.trim() || '';
    const link = e.querySelector('link')?.getAttribute('href') || '';
    const published = e.querySelector('published')?.textContent || new Date().toISOString();
    const videoId = e.querySelector('videoId, yt\\:videoId')?.textContent?.trim() || '';
    return {
      id: `anthropic-yt-${videoId || title.slice(0, 30).replace(/[^a-z0-9]/gi, '')}`,
      title,
      url: link,
      description: '',
      author: 'Anthropic',
      sourceName: 'Anthropic / YouTube',
      source: 'anthropic',
      publishedAt: published,
      engagement: { score: 0, comments: 0 },
      tags: ['ai', 'anthropic', 'video'],
      type: 'news',
      extra: { authority: 0.85, video: true, videoId },
    };
  });
}

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  const promises = [
    fetchSitemap().catch(() => []),
    ...GITHUB_FEEDS.map(f => fetchGithubFeed(f).catch(() => [])),
    fetchYouTube().catch(() => []),
  ];
  const results = await Promise.all(promises);
  const items = results.flat();

  // Dedup by id
  const seen = new Set();
  const deduped = items.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });

  cache.set(CACHE_KEY, deduped, CONFIG.CACHE_TTL.news);
  return deduped;
}
