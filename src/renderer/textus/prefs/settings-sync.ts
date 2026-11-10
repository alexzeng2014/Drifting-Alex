/** The stored-settings shape shared by the vendored settings helpers. */
export type Raw = Record<string, unknown>;

export function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
