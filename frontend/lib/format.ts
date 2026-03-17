export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", options || { dateStyle: "medium" }).format(new Date(value));
  } catch (_error) {
    return value;
  }
}

export function formatDateTime(value?: string | null) {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatPercent(value?: number | null) {
  const numeric = Number.isFinite(value) ? Number(value) : 0;
  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
}

export function normalizeStatusLabel(value?: string | null) {
  const text = String(value || "unknown")
    .replace(/[_-]+/g, " ")
    .trim();

  if (!text) {
    return "Unknown";
  }

  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function compactUrl(value?: string | null) {
  if (!value) {
    return "-";
  }

  try {
    const parsed = new URL(value);
    return parsed.host.replace(/^www\./i, "");
  } catch (_error) {
    return value.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  }
}

export function toCommaList(items?: string[] | null, fallback = "-") {
  if (!items || !items.length) {
    return fallback;
  }
  return items.join(", ");
}
