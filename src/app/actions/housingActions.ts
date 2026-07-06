"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { housingTargetSchema, housingPaymentSchema } from "@/lib/validation/housing";

export async function upsertHousingTarget(formData: FormData) {
  const data = housingTargetSchema.parse({
    month: formData.get("month"),
    targetAmount: formData.get("targetAmount"),
    notes: formData.get("notes") || undefined,
  });

  await prisma.housingTarget.upsert({
    where: { month: data.month },
    update: { targetAmount: data.targetAmount.toString(), notes: data.notes },
    create: { ...data, targetAmount: data.targetAmount.toString() },
  });

  revalidatePath("/housing");
  revalidatePath("/");
}

export async function createHousingPayment(formData: FormData) {
  const data = housingPaymentSchema.parse({
    housingTargetId: formData.get("housingTargetId"),
    paymentDate: formData.get("paymentDate"),
    amountPaid: formData.get("amountPaid"),
    paidBy: formData.get("paidBy"),
    appliedTo: formData.get("appliedTo"),
    notes: formData.get("notes") || undefined,
  });

  await prisma.housingPayment.create({
    data: { ...data, amountPaid: data.amountPaid.toString() },
  });

  revalidatePath("/housing");
  revalidatePath("/");
}
