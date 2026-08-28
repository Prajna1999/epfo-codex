export function readBrowserStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(window.localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}

export function writeBrowserStore<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
