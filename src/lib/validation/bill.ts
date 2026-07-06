import { z } from "zod";
import { BillCategory, BillStatus, Owner, Priority } from "@/generated/prisma/enums";
import { cuid, dueDay, money, notes } from "./shared";

export const recurringBillSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.nativeEnum(BillCategory),
  priority: z.nativeEnum(Priority),
  defaultAmount: money,
  dueDay,
  autopay: z.boolean().default(false),
  owner: z.nativeEnum(Owner),
  active: z.boolean().default(true),
  notes,
});

export const updateRecurringBillSchema = recurringBillSchema.partial().extend({ id: cuid });

export const billInstanceSchema = z.object({
  recurringBillId: cuid.optional().nullable(),
  month: z.coerce.date(),
  name: z.string().min(1).max(200),
  category: z.nativeEnum(BillCategory),
  priority: z.nativeEnum(Priority),
  plannedAmount: money,
  actualAmount: money.optional().nullable(),
  dueDay,
  autopay: z.boolean().default(false),
  owner: z.nativeEnum(Owner),
  status: z.nativeEnum(BillStatus).default(BillStatus.PLANNED),
  notes,
});

export const updateBillInstanceSchema = billInstanceSchema.partial().extend({ id: cuid });

export type RecurringBillInput = z.infer<typeof recurringBillSchema>;
export type BillInstanceInput = z.infer<typeof billInstanceSchema>;
