export function hasCanonicalQueryEncoding(url) {
  if (!url?.searchParams || typeof url.search !== "string") return false;
  const canonical = url.searchParams.toString();
  return url.search === (canonical ? `?${canonical}` : "");
}
