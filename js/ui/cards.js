export function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function scoreClass(score) {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function sourceBadgeClass(source) {
  const map = {
    hackernews: 'hn', devto: 'devto', reddit: 'reddit',
    arxiv: 'arxiv', semantic_scholar: 'semantic', huggingface: 'huggingface', rss: 'rss',
    major_releases: 'major',
  };
  if (map[source]) return map[source];
  // Per-company RSS feeds
  if (source?.includes('anthropic')) return 'anthropic';
  if (source?.includes('openai')) return 'openai';
  if (source?.includes('google')) return 'google';
  if (source?.includes('vllm')) return 'vllm';
  if (source?.includes('anyscale')) return 'vllm';
  return 'rss';
}

export function createNewsCard(item) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.source = item.source;
  el.dataset.score = item.score;

  el.innerHTML = `
    <div class="card__score card__score--${scoreClass(item.score)}"></div>
    <div class="card__header">
      <span class="card__source-badge card__source-badge--${sourceBadgeClass(item.source)}">${item.sourceName}</span>
      <h3 class="card__title"><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.title)}</a></h3>
    </div>
    ${item.description ? `<p class="card__description">${escapeHTML(item.description)}</p>` : ''}
    <div class="card__meta">
      ${item.author ? `<span class="card__meta-item"><span class="material-icons-outlined">person</span>${escapeHTML(item.author)}</span>` : ''}
      <span class="card__meta-item"><span class="material-icons-outlined">schedule</span>${timeAgo(item.publishedAt)}</span>
      ${item.engagement.score ? `<span class="card__meta-item"><span class="material-icons-outlined">arrow_upward</span>${formatNumber(item.engagement.score)}</span>` : ''}
      ${item.engagement.comments ? `<span class="card__meta-item"><span class="material-icons-outlined">chat_bubble_outline</span>${formatNumber(item.engagement.comments)}</span>` : ''}
    </div>
  `;
  return el;
}

export function createPaperCard(item) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.source = item.source;
  el.dataset.score = item.score;

  const tags = (item.tags || []).slice(0, 3);

  el.innerHTML = `
    <div class="card__score card__score--${scoreClass(item.score)}"></div>
    <div class="card__header">
      <span class="card__source-badge card__source-badge--${sourceBadgeClass(item.source)}">${item.sourceName}</span>
      <h3 class="card__title"><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.title)}</a></h3>
    </div>
    ${item.description ? `<p class="card__description">${escapeHTML(item.description)}</p>` : ''}
    <div class="card__meta">
      ${item.author ? `<span class="card__meta-item"><span class="material-icons-outlined">person</span>${escapeHTML(truncate(item.author, 50))}</span>` : ''}
      <span class="card__meta-item"><span class="material-icons-outlined">schedule</span>${timeAgo(item.publishedAt)}</span>
      ${item.engagement.score ? `<span class="card__meta-item"><span class="material-icons-outlined">format_quote</span>${formatNumber(item.engagement.score)} citations</span>` : ''}
      ${item.extra?.pdfUrl ? `<span class="card__meta-item"><a href="${escapeAttr(item.extra.pdfUrl)}" target="_blank" rel="noopener"><span class="material-icons-outlined">picture_as_pdf</span>PDF</a></span>` : ''}
    </div>
    ${tags.length ? `<div class="card__tags">${tags.map(t => `<span class="card__tag">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
  `;
  return el;
}

export function createReleaseCard(item) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.source = item.source;
  el.dataset.score = item.score;

  const tags = (item.tags || []).filter(Boolean).slice(0, 3);
  const isGitHub = item.source === 'github';
  const isHFModel = item.source === 'hf_models';

  el.innerHTML = `
    <div class="card__score card__score--${scoreClass(item.score)}"></div>
    <div class="card__header">
      <span class="card__source-badge card__source-badge--${sourceBadgeClass(item.source)}">${escapeHTML(item.sourceName)}</span>
      <h3 class="card__title"><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.title)}</a></h3>
    </div>
    ${item.description ? `<p class="card__description">${escapeHTML(item.description)}</p>` : ''}
    <div class="card__meta">
      ${item.author ? `<span class="card__meta-item"><span class="material-icons-outlined">person</span>${escapeHTML(truncate(item.author, 30))}</span>` : ''}
      <span class="card__meta-item"><span class="material-icons-outlined">schedule</span>${timeAgo(item.publishedAt)}</span>
      ${isGitHub && item.extra?.tagName ? `<span class="card__meta-item"><span class="material-icons-outlined">local_offer</span>${escapeHTML(item.extra.tagName)}</span>` : ''}
      ${isGitHub && item.engagement.score ? `<span class="card__meta-item"><span class="material-icons-outlined">star</span>${formatNumber(item.engagement.score)}</span>` : ''}
      ${isHFModel && item.extra?.downloads ? `<span class="card__meta-item"><span class="material-icons-outlined">download</span>${formatNumber(item.extra.downloads)}</span>` : ''}
      ${isHFModel && item.extra?.likes ? `<span class="card__meta-item"><span class="material-icons-outlined">favorite</span>${formatNumber(item.extra.likes)}</span>` : ''}
      ${!isGitHub && !isHFModel && item.engagement.score ? `<span class="card__meta-item"><span class="material-icons-outlined">arrow_upward</span>${formatNumber(item.engagement.score)}</span>` : ''}
      ${!isGitHub && !isHFModel && item.engagement.comments ? `<span class="card__meta-item"><span class="material-icons-outlined">chat_bubble_outline</span>${formatNumber(item.engagement.comments)}</span>` : ''}
    </div>
    ${tags.length ? `<div class="card__tags">${tags.map(t => `<span class="card__tag">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
  `;
  return el;
}

export function createResourceCard(resource) {
  const el = document.createElement('article');
  el.className = 'resource-card';
  el.dataset.cost = resource.cost;
  el.dataset.level = resource.level;

  el.innerHTML = `
    <div class="resource-card__header">
      <span class="resource-card__cost resource-card__cost--${resource.cost}">${resource.cost}</span>
      <span class="resource-card__level resource-card__level--${resource.level}">${resource.level}</span>
    </div>
    <h3 class="resource-card__title"><a href="${escapeAttr(resource.url)}" target="_blank" rel="noopener">${escapeHTML(resource.title)}</a></h3>
    <p class="resource-card__description">${escapeHTML(resource.description)}</p>
    <span class="resource-card__provider"><span class="material-icons-outlined">business</span>${escapeHTML(resource.provider)}</span>
    ${resource.tags?.length ? `<div class="resource-card__tags">${resource.tags.map(t => `<span class="resource-card__tag">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
  `;
  return el;
}

export function createPodcastCard(podcast) {
  const el = document.createElement('article');
  el.className = 'podcast-card';
  el.dataset.category = podcast.category;

  const tags = (podcast.tags || []).slice(0, 4);

  el.innerHTML = `
    <div class="podcast-card__header">
      <span class="podcast-card__category podcast-card__category--${podcast.category}">${escapeHTML(podcast.category)}</span>
      <span class="podcast-card__frequency"><span class="material-icons-outlined">schedule</span>${escapeHTML(podcast.frequency)}</span>
    </div>
    <h3 class="podcast-card__title"><a href="${escapeAttr(podcast.url)}" target="_blank" rel="noopener">${escapeHTML(podcast.title)}</a></h3>
    <span class="podcast-card__host"><span class="material-icons-outlined">person</span>${escapeHTML(podcast.host)}</span>
    <p class="podcast-card__description">${escapeHTML(podcast.description)}</p>
    <div class="podcast-card__meta">
      <span class="podcast-card__subscribers"><span class="material-icons-outlined">group</span>${escapeHTML(podcast.subscribers)} subscribers</span>
    </div>
    ${tags.length ? `<div class="podcast-card__tags">${tags.map(t => `<span class="podcast-card__tag">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
  `;
  return el;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}
