"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { incomeEntrySchema } from "@/lib/validation/income";

export async function createIncomeEntry(formData: FormData) {
  const data = incomeEntrySchema.parse({
    person: formData.get("person"),
    expectedAmount: formData.get("expectedAmount"),
    actualAmount: formData.get("actualAmount") || undefined,
    payDate: formData.get("payDate"),
    purpose: formData.get("purpose") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await prisma.incomeEntry.create({
    data: {
      ...data,
      expectedAmount: data.expectedAmount.toString(),
      actualAmount: data.actualAmount?.toString(),
    },
  });

  revalidatePath("/income");
  revalidatePath("/");
}

export async function deleteIncomeEntry(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.incomeEntry.delete({ where: { id } });
  revalidatePath("/income");
  revalidatePath("/");
}
