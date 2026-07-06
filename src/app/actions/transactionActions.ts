"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validation/transaction";

export async function createTransaction(formData: FormData) {
  const data = transactionSchema.parse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    merchant: formData.get("merchant") || undefined,
    paidBy: formData.get("paidBy"),
    paymentMethod: formData.get("paymentMethod") || undefined,
    countsTowardBudget: formData.get("countsTowardBudget") !== "off",
    notes: formData.get("notes") || undefined,
  });

  await prisma.transaction.create({
    data: { ...data, amount: data.amount.toString() },
  });

  revalidatePath("/transactions");
  revalidatePath("/");
  redirect("/transactions");
}

export async function deleteTransaction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/transactions");
  revalidatePath("/");
}
