import { fetchWithProxy } from './cors-proxy.js';

export async function fetchJSON(url, { useProxy = false, timeout = 8000 } = {}) {
  const fetchFn = useProxy ? fetchWithProxy : fetch;
  const resp = await fetchFn(url, { signal: AbortSignal.timeout(timeout) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

export async function fetchXML(url, { useProxy = false, timeout = 8000 } = {}) {
  const fetchFn = useProxy ? fetchWithProxy : fetch;
  const resp = await fetchFn(url, { signal: AbortSignal.timeout(timeout) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  const text = await resp.text();
  return new DOMParser().parseFromString(text, 'text/xml');
}
