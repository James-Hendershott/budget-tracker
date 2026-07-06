"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scenarioSchema } from "@/lib/validation/scenario";

export async function createScenario(formData: FormData) {
  const assumptionsRaw = formData.get("assumptions");
  const data = scenarioSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    assumptions: assumptionsRaw ? JSON.parse(assumptionsRaw.toString()) : {},
    createdBy: formData.get("createdBy"),
  });

  await prisma.scenario.create({ data });
  revalidatePath("/scenarios");
}

/// Applying a scenario never mutates the real budget automatically — it
/// only stamps appliedAt so it's clear which what-if was actually acted
/// on. Making the real bill/debt edits that realize it is a manual,
/// deliberate follow-up step.
export async function markScenarioApplied(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.scenario.update({ where: { id }, data: { appliedAt: new Date() } });
  revalidatePath("/scenarios");
}
