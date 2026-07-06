import { z } from "zod";
import { Person } from "@/generated/prisma/enums";
import { cuid, money, moneyOptional, notes } from "./shared";

export const incomeEntrySchema = z.object({
  person: z.nativeEnum(Person),
  expectedAmount: money,
  actualAmount: moneyOptional,
  payDate: z.coerce.date(),
  purpose: z.string().max(200).optional().nullable(),
  notes,
});

export const updateIncomeEntrySchema = incomeEntrySchema.partial().extend({ id: cuid });

export type IncomeEntryInput = z.infer<typeof incomeEntrySchema>;
