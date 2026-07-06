import { z } from "zod";
import { HousingLineItem, Person } from "@/generated/prisma/enums";
import { cuid, money, notes } from "./shared";

export const housingTargetSchema = z.object({
  month: z.coerce.date(),
  targetAmount: money,
  notes,
});

export const updateHousingTargetSchema = housingTargetSchema.partial().extend({ id: cuid });

export const housingPaymentSchema = z.object({
  housingTargetId: cuid,
  paymentDate: z.coerce.date(),
  amountPaid: money,
  paidBy: z.nativeEnum(Person),
  appliedTo: z.nativeEnum(HousingLineItem),
  notes,
});

export const updateHousingPaymentSchema = housingPaymentSchema.partial().extend({ id: cuid });

export type HousingTargetInput = z.infer<typeof housingTargetSchema>;
export type HousingPaymentInput = z.infer<typeof housingPaymentSchema>;
