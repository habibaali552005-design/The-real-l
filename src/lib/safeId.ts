export function safeRandomUUID(prefix = "id"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return `${prefix}-${crypto.randomUUID()}`;
    } catch {
      // fallback if crypto.randomUUID is blocked in non-HTTPS or iframe
    }
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
