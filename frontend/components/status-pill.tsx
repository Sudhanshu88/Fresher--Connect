import { normalizeStatusLabel } from "@/lib/format";

function statusTone(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["offered", "hired", "approved", "verified", "shortlisted"].includes(normalized)) {
    return "success";
  }
  if (["rejected", "disabled"].includes(normalized)) {
    return "danger";
  }
  if (["pending", "reviewing", "interview", "under_review"].includes(normalized)) {
    return "warning";
  }
  return "";
}

export function StatusPill({ value }: { value?: string | null }) {
  const tone = statusTone(value);
  return <span className={`pill${tone ? ` ${tone}` : ""}`}>{normalizeStatusLabel(value)}</span>;
}
