function effectivePort(url: URL) {
  if (url.port) return url.port;
  if (url.protocol === "http:" || url.protocol === "ws:") return "80";
  if (url.protocol === "https:" || url.protocol === "wss:") return "443";
  return "";
}

export function isAllowedHttpUrl(url: URL, baseURL: URL) {
  if (url.protocol === "data:" || url.protocol === "blob:") return true;

  return (
    (url.protocol === "http:" || url.protocol === "https:") &&
    url.origin === baseURL.origin
  );
}

export function isAllowedWebSocketUrl(url: URL, baseURL: URL) {
  return (
    (url.protocol === "ws:" || url.protocol === "wss:") &&
    url.hostname === baseURL.hostname &&
    effectivePort(url) === effectivePort(baseURL)
  );
}
