export function hasCanonicalQueryEncoding(url) {
  if (!url?.searchParams || typeof url.search !== "string") return false;
  const ordered = new URLSearchParams(url.searchParams);
  ordered.sort();
  const canonical = ordered.toString();
  return url.search === (canonical ? `?${canonical}` : "");
}
