const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requestHeadersWithCsrf(method: string | undefined, initial?: HeadersInit): Headers {
  const headers = new Headers(initial);
  if (SAFE_METHODS.has((method ?? "GET").toUpperCase()) || typeof document === "undefined") {
    return headers;
  }

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("XSRF-TOKEN="));
  if (cookie) {
    const token = cookie.slice("XSRF-TOKEN=".length);
    if (token) headers.set("X-XSRF-TOKEN", decodeURIComponent(token));
  }
  return headers;
}
