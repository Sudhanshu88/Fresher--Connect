export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return <div className="empty-state">{label}</div>;
}
