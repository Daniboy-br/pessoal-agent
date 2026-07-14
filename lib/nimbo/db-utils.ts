export type DbResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

export function assertData<T>(result: DbResult<T>, message: string): T {
  if (result.error) throw new Error(`${message}: ${result.error.message}`);
  if (!result.data) throw new Error(`${message}: empty result`);
  return result.data;
}

export function assertOk(result: { error: { message: string } | null }, message: string) {
  if (result.error) throw new Error(`${message}: ${result.error.message}`);
}

export function safeJson(value: unknown) {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

export function clipText(value: string, maxLength = 800) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}
