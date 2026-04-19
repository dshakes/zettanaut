const KEY = 'zettanaut:saved';

let cache = null;

function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch { /* quota — silent */ }
}

export function isSaved(id) {
  return Boolean(load()[id]);
}

export function toggleSave(item) {
  const store = load();
  if (store[item.id]) {
    delete store[item.id];
    persist();
    return false;
  }
  // Snapshot lightweight item for the saved view.
  store[item.id] = {
    id: item.id,
    title: item.title,
    url: item.url,
    description: item.description,
    source: item.source,
    sourceName: item.sourceName,
    author: item.author,
    publishedAt: item.publishedAt,
    engagement: item.engagement || { score: 0, comments: 0 },
    tags: item.tags || [],
    type: item.type,
    extra: item.extra,
    score: item.score || 0,
    savedAt: new Date().toISOString(),
  };
  persist();
  return true;
}

export function listSaved() {
  const store = load();
  return Object.values(store).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

export function clearSaved() {
  cache = {};
  persist();
}
