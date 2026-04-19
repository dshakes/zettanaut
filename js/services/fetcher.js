import { fetchWithProxy } from './cors-proxy.js';

const DEFAULT_TIMEOUT = 12000;

export async function fetchJSON(url, { useProxy = false, timeout = DEFAULT_TIMEOUT } = {}) {
  const fetchFn = useProxy ? fetchWithProxy : fetch;
  const resp = await fetchFn(url, { signal: AbortSignal.timeout(timeout) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

export async function fetchXML(url, { useProxy = false, timeout = DEFAULT_TIMEOUT } = {}) {
  const fetchFn = useProxy ? fetchWithProxy : fetch;
  const resp = await fetchFn(url, { signal: AbortSignal.timeout(timeout) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  const text = await resp.text();
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  // Surface parser errors so failed feeds register as failed rather than empty.
  if (doc.querySelector('parsererror')) throw new Error(`XML parse error for ${url}`);
  return doc;
}
