"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { goalSchema, updateGoalSchema } from "@/lib/validation/goal";

export async function createGoal(formData: FormData) {
  const data = goalSchema.parse({
    type: formData.get("type"),
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || 0,
    targetDate: formData.get("targetDate") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await prisma.goal.create({
    data: {
      ...data,
      targetAmount: data.targetAmount.toString(),
      currentAmount: data.currentAmount.toString(),
    },
  });

  revalidatePath("/goals");
}

export async function updateGoalProgress(formData: FormData) {
  const data = updateGoalSchema.parse({
    id: formData.get("id"),
    currentAmount: formData.get("currentAmount"),
  });
  const { id, ...rest } = data;

  await prisma.goal.update({
    where: { id },
    data: { ...rest, currentAmount: rest.currentAmount?.toString() },
  });

  revalidatePath("/goals");
}
