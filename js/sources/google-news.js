// Google News RSS — fills gaps where company blogs are slow/dead.
// Each query targets a specific company so we always have a fresh signal.
import { fetchXML } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'gnews';

const QUERIES = [
  { q: 'Anthropic Claude OR "Claude Code"', author: 'Anthropic', tag: 'anthropic' },
  { q: '"OpenAI" GPT OR Codex OR Sora', author: 'OpenAI', tag: 'openai' },
  { q: 'Google DeepMind OR Gemini OR Gemma', author: 'Google DeepMind', tag: 'google' },
  { q: 'Meta AI OR Llama', author: 'Meta', tag: 'meta' },
  { q: 'Mistral AI', author: 'Mistral', tag: 'mistral' },
  { q: 'xAI Grok', author: 'xAI', tag: 'xai' },
  { q: 'DeepSeek AI', author: 'DeepSeek', tag: 'deepseek' },
  { q: 'Perplexity AI', author: 'Perplexity', tag: 'perplexity' },
];

function buildUrl(q) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
}

function stripHTML(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

function extractPublisher(item) {
  // Google News tags publisher in <source> element.
  const src = item.querySelector('source');
  return src?.textContent?.trim() || '';
}

async function fetchOne({ q, author, tag }) {
  const doc = await fetchXML(buildUrl(q), { useProxy: true });
  const items = Array.from(doc.querySelectorAll('item')).slice(0, 15);
  return items.map(item => {
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const pub = item.querySelector('pubDate')?.textContent || new Date().toISOString();
    const desc = stripHTML(item.querySelector('description')?.textContent || '').slice(0, 200);
    const publisher = extractPublisher(item);
    return {
      id: `gnews-${tag}-${link.slice(-30).replace(/[^a-z0-9]/gi, '')}`,
      // Strip "- Publisher" suffix Google News appends
      title: title.replace(/ - [^-]+$/, '').trim(),
      url: link,
      description: desc,
      author,
      sourceName: publisher ? `${publisher} via Google News` : `Google News (${author})`,
      source: 'gnews',
      publishedAt: pub,
      engagement: { score: 0, comments: 0 },
      tags: ['ai', tag],
      type: 'news',
      extra: { authority: 0.7, publisher },
    };
  });
}

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  const results = await Promise.allSettled(QUERIES.map(fetchOne));
  const items = [];
  for (const r of results) {
    if (r.status === 'fulfilled') items.push(...r.value);
  }

  cache.set(CACHE_KEY, items, CONFIG.CACHE_TTL.news);
  return items;
}
