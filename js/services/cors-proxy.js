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
    if (proxy) {
      try {
        return await fetch(proxy.buildUrl(url), options);
      } catch {
        // Proxy that worked before is now failing; fall through to retry chain.
        delete proxyMemory[domain];
      }
    }
  }

  // Try direct first
  try {
    const resp = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      proxyMemory[domain] = 'direct';
      return resp;
    }
  } catch {
    // CORS or network error, fall through to proxies
  }

  for (const proxy of CONFIG.CORS_PROXIES) {
    try {
      const resp = await fetch(proxy.buildUrl(url), { ...options, signal: AbortSignal.timeout(10000) });
      if (resp.ok || resp.status === 304) {
        const ct = resp.headers.get('content-type') || '';
        // Some proxies return HTML error pages with 200 — only reject when XML/JSON was expected
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
