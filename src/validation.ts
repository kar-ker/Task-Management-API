export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateExactKeys(
  body: Record<string, unknown>,
  allowedKeys: string[],
  errors: string[]
): void {
  for (const key of Object.keys(body)) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unexpected field: ${key}`);
    }
  }
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function isIsoDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function isNonEmptyString(value: unknown, maxLength?: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    (maxLength === undefined || value.length <= maxLength)
  );
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

export function parseExpiresInSeconds(value: unknown, fallback = 900): number {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : value;
  return typeof parsed === "number" && Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}