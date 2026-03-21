export function LoadingBlock({ label = "Preparing your experience..." }: { label?: string }) {
  return <div className="empty-state">{label}</div>;
}
