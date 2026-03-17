export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="metric stack">
      <span className="meta">{label}</span>
      <strong className="metric-value">{value}</strong>
      {hint ? <span className="helper">{hint}</span> : null}
    </div>
  );
}
