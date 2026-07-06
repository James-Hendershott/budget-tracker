import { z } from "zod";
import { Person } from "@/generated/prisma/enums";
import { cuid, money, notes } from "./shared";

/// Quick Add is the screen Savanah will use most on her phone — keep
/// this schema forgiving (few required fields) since friction here
/// means transactions don't get logged at all.
export const transactionSchema = z.object({
  date: z.coerce.date(),
  amount: money,
  category: z.string().min(1).max(100),
  merchant: z.string().max(200).optional().nullable(),
  paidBy: z.nativeEnum(Person),
  paymentMethod: z.string().max(100).optional().nullable(),
  countsTowardBudget: z.boolean().default(true),
  notes,
});

export const updateTransactionSchema = transactionSchema.partial().extend({ id: cuid });

export type TransactionInput = z.infer<typeof transactionSchema>;
