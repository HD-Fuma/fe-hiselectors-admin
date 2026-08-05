const ABSOLUTE_ASSET_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export function assetUrl(path: string, baseUrl = import.meta.env.BASE_URL) {
  if (!path || ABSOLUTE_ASSET_URL.test(path)) {
    return path;
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${path.replace(/^\/+/, "")}`;
}
