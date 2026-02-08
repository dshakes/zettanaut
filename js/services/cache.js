const PREFIX = 'ai-digest:';

export const cache = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  set(key, data, ttl) {
    try {
      const entry = JSON.stringify({ data, timestamp: Date.now(), ttl });
      localStorage.setItem(PREFIX + key, entry);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        this.evictOldest();
        try {
          localStorage.setItem(PREFIX + key, JSON.stringify({ data, timestamp: Date.now(), ttl }));
        } catch { /* give up */ }
      }
    }
  },

  evictOldest() {
    let oldest = null;
    let oldestTime = Infinity;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k.startsWith(PREFIX)) continue;
      try {
        const entry = JSON.parse(localStorage.getItem(k));
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldest = k;
        }
      } catch { /* skip */ }
    }
    if (oldest) localStorage.removeItem(oldest);
  },

  clear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  },
};
