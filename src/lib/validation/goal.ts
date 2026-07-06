import { z } from "zod";
import { GoalType } from "@/generated/prisma/enums";
import { cuid, money, notes } from "./shared";

export const goalSchema = z.object({
  type: z.nativeEnum(GoalType),
  name: z.string().min(1).max(200),
  targetAmount: money,
  currentAmount: money.default(0),
  targetDate: z.coerce.date().optional().nullable(),
  notes,
});

export const updateGoalSchema = goalSchema.partial().extend({ id: cuid });

export type GoalInput = z.infer<typeof goalSchema>;
