import { z } from "zod";
import { DebtType, DebtStrategy } from "@/generated/prisma/enums";
import { apr, cuid, dueDayOptional, moneyOptional, notes } from "./shared";

export const debtSchema = z.object({
  name: z.string().min(1).max(200),
  lender: z.string().min(1).max(200),
  debtType: z.nativeEnum(DebtType),
  balance: moneyOptional,
  payoffAmount: moneyOptional,
  apr,
  minimumPayment: moneyOptional,
  dueDay: dueDayOptional,
  includeInPayoffPlan: z.boolean().default(true),
  strategy: z.nativeEnum(DebtStrategy).default(DebtStrategy.MINIMUM_ONLY),
  notes,
});

export const updateDebtSchema = debtSchema.partial().extend({ id: cuid });

export type DebtInput = z.infer<typeof debtSchema>;
