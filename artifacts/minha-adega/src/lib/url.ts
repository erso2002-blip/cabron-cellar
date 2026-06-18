export function normalizeWebsiteUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isLikelyWebsiteUrl(value: string | null | undefined) {
  const normalized = normalizeWebsiteUrl(value);
  if (!normalized) return true;

  try {
    const url = new URL(normalized);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function websiteHostname(value: string | null | undefined) {
  const normalized = normalizeWebsiteUrl(value);
  if (!normalized) return "";

  try {
    return new URL(normalized).hostname.replace(/^www\./i, "");
  } catch {
    return value?.trim() ?? "";
  }
}
