import { z } from "zod";

/// Every Server Action is a trust boundary — client-submitted data is
/// parsed against one of these schemas before it ever reaches Prisma.
/// Money is validated as a plain number here (form-friendly) and the
/// action layer converts to a string for Prisma's Decimal fields.
export const money = z.coerce.number().finite().min(0).max(1_000_000);
export const moneyOptional = money.optional().nullable();
export const apr = z.coerce.number().finite().min(0).max(100).optional().nullable();
export const dueDay = z.coerce.number().int().min(1).max(31);
export const dueDayOptional = dueDay.optional().nullable();
export const notes = z.string().max(2000).optional().nullable();
export const cuid = z.string().cuid();
