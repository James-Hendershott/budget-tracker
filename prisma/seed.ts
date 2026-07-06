import "dotenv/config";
import argon2 from "argon2";
import crypto from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/// Demo seed data. Figures below are fictional — realistic enough to
/// exercise every feature (consolidation candidates, deferred-interest
/// promos, unconfirmed balances, medical payment plans, one-time review
/// items) without reflecting anyone's real finances.

function randomPassword() {
  return crypto.randomBytes(18).toString("base64url");
}

/// Only generates/hashes/prints a password when the account doesn't
/// already exist. `upsert`'s `update: {}` leaves an existing
/// passwordHash untouched — printing a freshly-generated password on
/// every re-run would be actively wrong (it wouldn't match what's
/// actually stored) rather than just redundant.
async function upsertUserWithPassword(params: {
  email: string;
  name: "JAMES" | "SAVANAH";
  envPasswordVar: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) {
    return { user: existing, printedPassword: null as string | null };
  }

  const password = process.env[params.envPasswordVar] ?? randomPassword();
  const user = await prisma.user.create({
    data: {
      email: params.email,
      name: params.name,
      role: "ADMIN",
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
    },
  });
  return { user, printedPassword: process.env[params.envPasswordVar] ? null : password };
}

async function main() {
  const james = await upsertUserWithPassword({
    email: "james@demo.example.com",
    name: "JAMES",
    envPasswordVar: "SEED_JAMES_PASSWORD",
  });

  const savanah = await upsertUserWithPassword({
    email: "savanah@demo.example.com",
    name: "SAVANAH",
    envPasswordVar: "SEED_SAVANAH_PASSWORD",
  });

  if (james.printedPassword || savanah.printedPassword) {
    console.log("Seeded new users:");
    if (james.printedPassword) {
      console.log(`  James  (${james.user.email}) — temp password: ${james.printedPassword}`);
    }
    if (savanah.printedPassword) {
      console.log(`  Savanah (${savanah.user.email}) — temp password: ${savanah.printedPassword}`);
      console.log("  ^ update Savanah's email to her real address via /admin/users");
    }
  } else {
    console.log("Users already exist — passwordHash left untouched (not reprinted).");
  }

  // --- Debts (payoff-planning view) ---------------------------------
  const debts: Parameters<typeof prisma.debt.create>[0]["data"][] = [
    {
      name: "Outdoors Store Card",
      lender: "Capital One",
      debtType: "CREDIT_CARD",
      balance: "3210.55",
      minimumPayment: "95.00",
      apr: "21.74",
      dueDay: 14,
      strategy: "CONSOLIDATION_CANDIDATE",
      notes:
        "21.74% on general purchases; 9.99% on store-branded purchases. High-interest consolidation candidate.",
    },
    {
      name: "Retail Store Card / Synchrony",
      lender: "Synchrony",
      debtType: "CREDIT_CARD",
      balance: "2894.10",
      minimumPayment: "154.00",
      apr: "23.46",
      dueDay: 13,
      strategy: "CONSOLIDATION_CANDIDATE",
      notes:
        "Total statement balance. Of this, ~$2,610.00 is the regular-APR (23.46%) portion — the actual consolidation candidate — and ~$284.10 is a 0% promotional balance that should NOT be consolidated unless its payoff deadline is at risk.",
    },
    {
      name: "Discover Card",
      lender: "Discover",
      debtType: "CREDIT_CARD",
      balance: "540.10",
      minimumPayment: "22.00",
      apr: "26.49",
      dueDay: 20,
      strategy: "CONSOLIDATION_CANDIDATE",
      notes:
        "Balance is from an older statement than the others — needs refreshing before this number is trusted. Highest APR of the known cards.",
    },
    {
      name: "Home Improvement Store Credit Card",
      lender: "Home Store / Citi",
      debtType: "CREDIT_CARD",
      balance: "410.00",
      minimumPayment: "24.00",
      apr: "29.99",
      dueDay: 12,
      strategy: "CONSOLIDATION_CANDIDATE",
      notes:
        "Total balance. Of this, $160.00 is revolving (29.99% APR, consolidation candidate) and $250.00 is a deferred-interest promo expiring in a few months — must be paid off by then or back-interest applies. Do not consolidate the promo portion.",
    },
    {
      name: "Credit Union Signature Loan - Fixed",
      lender: "Local Credit Union",
      debtType: "SIGNATURE_LOAN",
      balance: "5980.00",
      payoffAmount: "6035.40",
      minimumPayment: "160.00",
      apr: "16.49",
      dueDay: 20,
      strategy: "CONSOLIDATION_CANDIDATE",
      notes:
        "Optional consolidation candidate — only worth rolling in if a new loan's APR is clearly below 16.49% after fees.",
    },
    {
      name: "Student Loan Servicer",
      lender: "Federal Student Aid Servicer",
      debtType: "STUDENT_LOAN",
      minimumPayment: "80.00",
      dueDay: 10,
      strategy: "HOLD",
      notes:
        "Balance and APR are UNKNOWN — must be added before this debt's numbers can be trusted or it can be considered for consolidation. Monthly payment amount is known.",
    },
    {
      name: "Pediatric Medical Payment Plan (kids, combined)",
      lender: "Regional Health System",
      debtType: "MEDICAL_PLAN",
      balance: "1650.00",
      minimumPayment: "95.00",
      dueDay: 7,
      strategy: "HOLD",
      notes:
        "Combined balance across both kids. 18-month payment plan, likely no interest — leave out of consolidation unless terms change.",
    },
    {
      name: "Orthopedics Payment Plan",
      lender: "Regional Orthopedics",
      debtType: "MEDICAL_PLAN",
      balance: "210.00",
      minimumPayment: "25.00",
      dueDay: 15,
      strategy: "HOLD",
      notes: "Estimated ~10 months remaining on the payment plan.",
    },
    {
      name: "University Medical Center",
      lender: "State University Medical Center",
      debtType: "MEDICAL_PLAN",
      balance: "360.00",
      minimumPayment: "50.00",
      dueDay: 10,
      strategy: "HOLD",
      notes: "Estimated ~7 months remaining on the payment plan.",
    },
    {
      name: "Urgent Care Payment Plan",
      lender: "Urgent Care Group",
      debtType: "MEDICAL_PLAN",
      balance: "20.00",
      minimumPayment: "20.00",
      dueDay: 21,
      strategy: "HOLD",
      notes: "Likely the final month of this plan.",
    },
    {
      name: "Online Retailer Installment A",
      lender: "Online Retailer",
      debtType: "INSTALLMENT",
      balance: "140.00",
      minimumPayment: "35.00",
      apr: "26.17",
      strategy: "HOLD",
      notes:
        "Remaining balance and due date not fully confirmed — verify before including in any consolidation or payoff plan.",
    },
    {
      name: "Online Retailer Installment B",
      lender: "Online Retailer",
      debtType: "INSTALLMENT",
      balance: "70.00",
      minimumPayment: "18.00",
      apr: "26.28",
      strategy: "HOLD",
      notes:
        "Remaining balance and due date not fully confirmed — small enough to likely pay off separately.",
    },
    {
      name: "Online Retailer Installment C",
      lender: "Online Retailer",
      debtType: "INSTALLMENT",
      balance: "610.00",
      minimumPayment: "42.00",
      apr: "23.72",
      strategy: "CONSOLIDATION_CANDIDATE",
      notes:
        "Largest of the online-retailer installment plans. Due date needs confirmation. Optional cleanup item in the suggested consolidation package.",
    },
    {
      name: "Online Retailer Installment D",
      lender: "Online Retailer",
      debtType: "INSTALLMENT",
      apr: "23.64",
      strategy: "HOLD",
      notes:
        "Current remaining balance AND monthly payment are both UNKNOWN — not even present in the latest active-plan list. Must verify before this debt can be trusted at all.",
    },
    {
      name: "Specialty Retailer Installment",
      lender: "Specialty Retailer (BNPL)",
      debtType: "INSTALLMENT",
      balance: "85.00",
      minimumPayment: "21.00",
      apr: "22.20",
      dueDay: 14,
      strategy: "CONSOLIDATION_CANDIDATE",
      notes: "Small balance — fine to include in a consolidation package or pay off separately.",
    },
    {
      name: "Hobby Store Installment",
      lender: "Hobby Store (BNPL)",
      debtType: "INSTALLMENT",
      balance: "55.00",
      minimumPayment: "14.00",
      apr: "22.14",
      dueDay: 24,
      strategy: "CONSOLIDATION_CANDIDATE",
      notes: "Small balance — fine to include in a consolidation package or pay off separately.",
    },
  ];

  for (const debt of debts) {
    await prisma.debt.upsert({
      where: { name_lender: { name: debt.name as string, lender: debt.lender as string } },
      update: {},
      create: debt,
    });
  }

  // --- Monthly required bills (cash-flow view) -----------------------
  // Only the recurring debts with a confirmed due day get a bill here —
  // the unconfirmed-due-date installments above stay Debt-only until
  // their due dates are known.
  const month = new Date(Date.UTC(2026, 6, 1)); // 2026-07-01

  const recurringBills: {
    name: string;
    category: Parameters<typeof prisma.recurringBill.create>[0]["data"]["category"];
    plannedAmount: string;
    dueDay: number;
    owner: Parameters<typeof prisma.recurringBill.create>[0]["data"]["owner"];
    notes?: string;
  }[] = [
    { name: "Outdoors Store Card", category: "CREDIT_CARD", plannedAmount: "95.00", dueDay: 14, owner: "TOGETHER" },
    { name: "Retail Store Card / Synchrony", category: "CREDIT_CARD", plannedAmount: "154.00", dueDay: 13, owner: "TOGETHER" },
    { name: "Discover Card", category: "CREDIT_CARD", plannedAmount: "22.00", dueDay: 20, owner: "TOGETHER", notes: "Confirm current balance/minimum — statement used was older." },
    { name: "Home Improvement Store Credit Card", category: "CREDIT_CARD", plannedAmount: "24.00", dueDay: 12, owner: "TOGETHER", notes: "Deferred-interest promo portion expires soon." },
    { name: "Credit Union Signature Loan", category: "PERSONAL_LOAN", plannedAmount: "160.00", dueDay: 20, owner: "TOGETHER" },
    { name: "Student Loan Servicer", category: "STUDENT_LOAN", plannedAmount: "80.00", dueDay: 10, owner: "TOGETHER", notes: "Balance/APR still unknown — payment amount only." },
    { name: "Pediatric Medical Payment Plan", category: "MEDICAL", plannedAmount: "95.00", dueDay: 7, owner: "TOGETHER", notes: "Both kids combined, 18-month plan." },
    { name: "Orthopedics Payment Plan", category: "MEDICAL", plannedAmount: "25.00", dueDay: 15, owner: "TOGETHER" },
    { name: "University Medical Center", category: "MEDICAL", plannedAmount: "50.00", dueDay: 10, owner: "TOGETHER" },
    { name: "Urgent Care Payment Plan", category: "MEDICAL", plannedAmount: "20.00", dueDay: 21, owner: "TOGETHER", notes: "Likely final month." },
    { name: "Specialty Retailer Installment", category: "OTHER", plannedAmount: "21.00", dueDay: 14, owner: "TOGETHER" },
    { name: "Hobby Store Installment", category: "OTHER", plannedAmount: "14.00", dueDay: 24, owner: "TOGETHER" },
  ];

  for (const bill of recurringBills) {
    const recurring = await prisma.recurringBill.upsert({
      where: { name: bill.name },
      update: {},
      create: {
        name: bill.name,
        category: bill.category,
        priority: "REQUIRED",
        defaultAmount: bill.plannedAmount,
        dueDay: bill.dueDay,
        owner: bill.owner,
        notes: bill.notes,
      },
    });

    const existingInstance = await prisma.billInstance.findFirst({
      where: { recurringBillId: recurring.id, month },
    });
    if (!existingInstance) {
      await prisma.billInstance.create({
        data: {
          recurringBillId: recurring.id,
          month,
          name: recurring.name,
          category: recurring.category,
          priority: recurring.priority,
          plannedAmount: recurring.defaultAmount,
          dueDay: recurring.dueDay,
          autopay: recurring.autopay,
          owner: recurring.owner,
          status: "PLANNED",
          notes: recurring.notes,
        },
      });
    }
  }

  // --- One-time items flagged for review, not yet resolved -----------
  const oneTimeItems = [
    {
      name: "Dental Office Balance",
      plannedAmount: "620.00",
      dueDay: 1,
      notes: "On hold — insurance resubmitting. Plan is to pay via HSA.",
      status: "REVIEW" as const,
    },
    {
      name: "Veterinary Clinic Balance",
      plannedAmount: "310.00",
      dueDay: 1,
      notes: "Needs action — decide which card/method pays this so it isn't double-counted once moved.",
      status: "REVIEW" as const,
    },
  ];

  for (const item of oneTimeItems) {
    const existing = await prisma.billInstance.findFirst({
      where: { name: item.name, month, recurringBillId: null },
    });
    if (!existing) {
      await prisma.billInstance.create({
        data: {
          month,
          name: item.name,
          category: "ONE_TIME",
          priority: "REVIEW",
          plannedAmount: item.plannedAmount,
          dueDay: item.dueDay,
          autopay: false,
          owner: "TOGETHER",
          status: item.status,
          notes: item.notes,
        },
      });
    }
  }

  console.log(`Seeded ${debts.length} debts, ${recurringBills.length} recurring bills, ${oneTimeItems.length} one-time review items.`);
  console.log(
    "No income, housing target, or goal amounts were seeded — left for the user to enter for real rather than guessed."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
