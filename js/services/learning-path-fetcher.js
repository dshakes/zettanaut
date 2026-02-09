import { fetchJSON } from './fetcher.js';
import { cache } from './cache.js';

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const HN_BASE = 'https://hn.algolia.com/api/v1/search';
const DEVTO_BASE = 'https://dev.to/api/articles';

// Topic definitions per stage — search queries for HN + Dev.to tags
const TOPICS = {
  'deep-learning':  { q: 'deep learning tutorial architecture CNN',  tag: 'deeplearning' },
  'nlp-transformers': { q: 'transformer NLP attention tutorial',     tag: 'nlp' },
  'llm-finetuning': { q: 'LLM fine-tuning training RLHF',          tag: 'llm' },
  'agentic-ai':     { q: 'AI agent agentic design ReAct tool use',  tag: 'ai' },
  'mlops':          { q: 'MLOps pipeline deployment kubernetes',     tag: 'mlops' },
  'llm-serving':    { q: 'LLM inference serving vLLM deployment',   tag: 'llm' },
  'mcp-gateways':   { q: 'MCP model context protocol gateway',      tag: 'ai' },
  'guardrails-ops': { q: 'AI guardrails safety production',         tag: 'machinelearning' },
  'llm-apis':       { q: 'prompt engineering LLM API tutorial',     tag: 'ai' },
  'rag-vectors':    { q: 'RAG retrieval augmented vector database', tag: 'ai' },
  'agents-mcp':     { q: 'AI agent building MCP tool LangGraph',   tag: 'ai' },
  'production-ai':  { q: 'production AI app deployment LLM',       tag: 'ai' },
};

const EDU_KEYWORDS = [
  'tutorial', 'guide', 'introduction', 'intro', 'explained',
  'how to', 'course', 'learn', 'beginner', 'from scratch',
  'step by step', 'fundamentals', 'getting started', 'overview',
  'practical', 'hands-on', 'walkthrough',
];

// ── Fetch helpers ──────────────────────────────────────────────

async function fetchHN(query) {
  const monthAgo = Math.floor((Date.now() - 30 * 86400 * 1000) / 1000);
  const url = `${HN_BASE}?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${monthAgo},points>5&hitsPerPage=10`;
  try {
    const data = await fetchJSON(url);
    return (data.hits || []).map(h => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points || 0,
      comments: h.num_comments || 0,
      date: h.created_at,
      source: 'hn',
    }));
  } catch { return []; }
}

async function fetchDevto(tag) {
  const url = `${DEVTO_BASE}?tag=${tag}&top=30&per_page=5`;
  try {
    const data = await fetchJSON(url);
    return (data || []).map(d => ({
      title: d.title,
      url: d.url,
      points: d.positive_reactions_count || 0,
      comments: d.comments_count || 0,
      date: d.published_at,
      source: 'devto',
    }));
  } catch { return []; }
}

// ── Scoring ────────────────────────────────────────────────────

function scoreResult(item) {
  const title = (item.title || '').toLowerCase();

  // Educational content bonus (tutorials/guides rank higher)
  const eduBonus = EDU_KEYWORDS.some(kw => title.includes(kw)) ? 25 : 0;

  // Popularity — normalized across sources
  const popularity = Math.min(100,
    item.source === 'hn'
      ? (item.points / 3) + (item.comments * 0.5)
      : (item.points / 2) + (item.comments * 0.5)
  );

  // Recency — 7-day half-life (educational content stays relevant longer)
  const ageHours = (Date.now() - new Date(item.date).getTime()) / 3.6e6;
  const recency = 100 * Math.exp(-ageHours / (7 * 24));

  // Source authority
  const authority = item.source === 'hn' ? 90 : 60;

  return (recency * 0.20) + (popularity * 0.30) + (authority * 0.20) + (eduBonus * 0.30);
}

// ── Fetch trending for a topic ─────────────────────────────────

async function fetchTrending(topicId) {
  const key = 'lp-trending:' + topicId;
  const cached = cache.get(key);
  if (cached) return cached;

  const topic = TOPICS[topicId];
  if (!topic) return [];

  const [hn, devto] = await Promise.allSettled([
    fetchHN(topic.q),
    fetchDevto(topic.tag),
  ]);

  const items = [
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(devto.status === 'fulfilled' ? devto.value : []),
  ];

  // Deduplicate by URL
  const seen = new Set();
  const unique = items.filter(i => {
    if (!i.url || seen.has(i.url)) return false;
    seen.add(i.url);
    return true;
  });

  const results = unique
    .map(i => ({ ...i, score: scoreResult(i) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2); // Top 2 trending per stage

  cache.set(key, results, CACHE_TTL);
  return results;
}

// ── Rendering ──────────────────────────────────────────────────

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderTrending(container, items) {
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const a = document.createElement('a');
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'learning-path__link learning-path__link--trending';
    a.innerHTML =
      '<span class="material-icons-outlined">trending_up</span> ' +
      escapeHTML(item.title) +
      ' <span class="learning-path__cost learning-path__cost--trending">trending</span>';
    fragment.appendChild(a);
  });
  container.appendChild(fragment);
}

// ── Init ───────────────────────────────────────────────────────

export function initLearningPath() {
  // 1. Collapsible stages — individual handlers per stage
  document.querySelectorAll('.learning-path__track-stage').forEach(stage => {
    stage.addEventListener('click', e => {
      if (e.target.closest('a') || e.target.closest('.learning-path__resources')) return;
      stage.classList.toggle('is-expanded');
    });
  });

  // 2. Mobile scroll indicator — update active dot on scroll
  const tracks = document.querySelector('.learning-path__tracks');
  const dots = document.querySelectorAll('.learning-path__scroll-dot');
  if (tracks && dots.length) {
    const updateDots = () => {
      const cardWidth = tracks.scrollWidth / 3;
      const idx = Math.min(2, Math.round(tracks.scrollLeft / cardWidth));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };
    tracks.addEventListener('scroll', updateDots, { passive: true });
  }

  // 3. Fetch trending resources for each stage with a data-topic attribute
  document.querySelectorAll('.learning-path__track-stage[data-topic]').forEach(stage => {
    const container = stage.querySelector('.learning-path__trending');
    if (!container) return;

    fetchTrending(stage.dataset.topic)
      .then(items => { if (items.length) renderTrending(container, items); })
      .catch(() => {}); // Curated resources remain as fallback
  });
}
