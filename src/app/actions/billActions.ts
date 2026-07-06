"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/// Deliberately narrow: the dashboard/bills page only ever needs to mark
/// a bill's status and record what was actually paid — full field
/// editing (amount, due day, owner) goes through /bills/[id] later.
export async function updateBillStatus(formData: FormData) {
  const id = formData.get("id");
  const status = formData.get("status");
  const actualAmountRaw = formData.get("actualAmount");

  if (typeof id !== "string" || typeof status !== "string") return;

  await prisma.billInstance.update({
    where: { id },
    data: {
      status: status as never,
      actualAmount: actualAmountRaw ? actualAmountRaw.toString() : undefined,
    },
  });

  revalidatePath("/bills");
  revalidatePath("/");
}
