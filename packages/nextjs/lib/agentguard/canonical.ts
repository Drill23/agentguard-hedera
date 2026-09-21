import { createHash } from "node:crypto";
export type SensitiveAction = {
  action: string;
  actor: string;
  audience?: string;
  expiresAt: string;
  nonce: string;
  payload: unknown;
};
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, normalize(nested)]),
    );
  return value;
}
export function canonicalizeAction(action: SensitiveAction): string {
  return JSON.stringify(normalize(action));
}
export function hashAction(action: SensitiveAction): string {
  return createHash("sha256").update(canonicalizeAction(action)).digest("hex");
}
