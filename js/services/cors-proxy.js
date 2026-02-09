import { CONFIG } from '../config.js';

const proxyMemory = {};

export async function fetchWithProxy(url, options = {}) {
  const domain = new URL(url).hostname;
  const remembered = proxyMemory[domain];

  if (remembered === 'direct') {
    return fetch(url, options);
  }

  if (remembered) {
    const proxy = CONFIG.CORS_PROXIES.find(p => p.name === remembered);
    if (proxy) return fetch(proxy.buildUrl(url), options);
  }

  // Try direct first
  try {
    const resp = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
    proxyMemory[domain] = 'direct';
    return resp;
  } catch {
    // CORS or network error, try proxies
  }

  for (const proxy of CONFIG.CORS_PROXIES) {
    try {
      const resp = await fetch(proxy.buildUrl(url), { ...options, signal: AbortSignal.timeout(8000) });
      if (resp.ok || resp.status === 304) {
        // Guard against proxies returning HTML error pages as 200
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('text/html') && !url.includes('.html')) {
          continue;
        }
        proxyMemory[domain] = proxy.name;
        return resp;
      }
    } catch {
      continue;
    }
  }

  throw new Error(`All proxies failed for ${url}`);
}
