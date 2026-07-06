"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { debtSchema, updateDebtSchema } from "@/lib/validation/debt";

function parseFormAmount(value: FormDataEntryValue | null) {
  if (value === null || value === "") return undefined;
  return value;
}

export async function createDebt(formData: FormData) {
  const data = debtSchema.parse({
    name: formData.get("name"),
    lender: formData.get("lender"),
    debtType: formData.get("debtType"),
    balance: parseFormAmount(formData.get("balance")),
    payoffAmount: parseFormAmount(formData.get("payoffAmount")),
    apr: parseFormAmount(formData.get("apr")),
    minimumPayment: parseFormAmount(formData.get("minimumPayment")),
    dueDay: parseFormAmount(formData.get("dueDay")),
    includeInPayoffPlan: formData.get("includeInPayoffPlan") === "on",
    strategy: formData.get("strategy") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await prisma.debt.create({
    data: {
      ...data,
      balance: data.balance?.toString(),
      payoffAmount: data.payoffAmount?.toString(),
      apr: data.apr?.toString(),
      minimumPayment: data.minimumPayment?.toString(),
    },
  });

  revalidatePath("/debts");
  revalidatePath("/");
}

export async function updateDebt(formData: FormData) {
  const data = updateDebtSchema.parse({
    id: formData.get("id"),
    balance: parseFormAmount(formData.get("balance")),
    minimumPayment: parseFormAmount(formData.get("minimumPayment")),
    strategy: formData.get("strategy") || undefined,
    includeInPayoffPlan: formData.get("includeInPayoffPlan") === "on",
  });
  const { id, ...rest } = data;

  await prisma.debt.update({
    where: { id },
    data: {
      ...rest,
      balance: rest.balance?.toString(),
      minimumPayment: rest.minimumPayment?.toString(),
    },
  });

  revalidatePath("/debts");
  revalidatePath("/");
}

export async function deleteDebt(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.debt.delete({ where: { id } });
  revalidatePath("/debts");
  revalidatePath("/");
}
