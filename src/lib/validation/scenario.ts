import { z } from "zod";
import { Person } from "@/generated/prisma/enums";
import { cuid } from "./shared";

/// `assumptions` is deliberately a free-form JSON bag (e.g. { rent: 1400,
/// extraDebtPayment: 200 }) — scenarios are a sandbox, not a modeled
/// entity, so we validate shape (plain object) rather than exact keys.
export const scenarioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  assumptions: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  createdBy: z.nativeEnum(Person),
});

export const updateScenarioSchema = scenarioSchema.partial().extend({ id: cuid });

export type ScenarioInput = z.infer<typeof scenarioSchema>;
