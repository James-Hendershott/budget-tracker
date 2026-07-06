/// Prisma's Decimal fields come back as Decimal.js-like instances, not
/// plain numbers — this converts safely for display/calculation. Money
/// is stored as Decimal in Postgres (never Float) to avoid rounding
/// drift; it's only coerced to number at the UI boundary.
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}
