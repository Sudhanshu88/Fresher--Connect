export function Feedback({ message, tone = "default" }: { message: string; tone?: "default" | "error" | "success" }) {
  if (!message) {
    return null;
  }
  return <div className={`message${tone !== "default" ? ` ${tone}` : ""}`}>{message}</div>;
}
