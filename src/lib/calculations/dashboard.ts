/// Pure calculation functions for the dashboard's "are we okay this
/// month, and safe until the next paycheck?" answer. Kept dependency-free
/// (no Prisma imports) so they're cheap to unit test — the functions most
/// likely to have a bug that costs real money if wrong.

export interface BillLike {
  priority: "REQUIRED" | "IMPORTANT" | "REVIEW" | "OPTIONAL";
  status: "PLANNED" | "PENDING" | "PAID" | "REVIEW" | "SKIPPED";
  plannedAmount: number;
  actualAmount: number | null;
  dueDay: number;
}

export interface SurvivalTotals {
  /** Sum of planned amounts for every REQUIRED bill this month. */
  requiredTotal: number;
  /** Sum of actual (or planned, if not yet paid) amounts already marked PAID. */
  paidSoFar: number;
  /** requiredTotal - paidSoFar, floored at 0. */
  remainingRequired: number;
}

export function computeSurvivalTotals(bills: BillLike[]): SurvivalTotals {
  const required = bills.filter((b) => b.priority === "REQUIRED" && b.status !== "SKIPPED");

  const requiredTotal = round2(sum(required.map((b) => b.plannedAmount)));

  const paidSoFar = round2(
    sum(required.filter((b) => b.status === "PAID").map((b) => b.actualAmount ?? b.plannedAmount))
  );

  return {
    requiredTotal,
    paidSoFar,
    remainingRequired: Math.max(0, round2(requiredTotal - paidSoFar)),
  };
}

export interface SafeToSpendInput {
  /** Income actually received so far this pay cycle. */
  incomeReceivedSoFar: number;
  /** REQUIRED bills already paid so far this pay cycle. */
  requiredBillsPaidSoFar: number;
  /** REQUIRED bills still due before the next paycheck lands. */
  requiredBillsStillDueBeforeNextPaycheck: number;
}

/**
 * Safe-to-spend = money in hand right now, minus what's still legally
 * owed before more money arrives. Never negative in the return value —
 * a negative result means "you're already behind," which the dashboard
 * surfaces as an alert rather than a spendable number.
 */
export function computeSafeToSpend(input: SafeToSpendInput): number {
  const raw =
    input.incomeReceivedSoFar -
    input.requiredBillsPaidSoFar -
    input.requiredBillsStillDueBeforeNextPaycheck;
  return round2(Math.max(0, raw));
}

export interface DebtLike {
  id: string;
  balance: number | null;
  apr: number | null;
  minimumPayment: number | null;
  includeInPayoffPlan: boolean;
}

/**
 * Orders debts for a payoff plan. Avalanche = highest APR first (saves
 * the most interest). Snowball = smallest balance first (fastest wins,
 * for momentum). Debts missing the sort key (unknown balance/APR) sort
 * last within their group — they need review before they can be planned
 * around, not a guessed position.
 */
export function sortDebtsForPayoff(
  debts: DebtLike[],
  strategy: "AVALANCHE" | "SNOWBALL"
): DebtLike[] {
  const eligible = debts.filter((d) => d.includeInPayoffPlan);

  const key = strategy === "AVALANCHE" ? (d: DebtLike) => d.apr : (d: DebtLike) => d.balance;

  return [...eligible].sort((a, b) => {
    const aKey = key(a);
    const bKey = key(b);
    if (aKey === null && bKey === null) return 0;
    if (aKey === null) return 1;
    if (bKey === null) return -1;
    return strategy === "AVALANCHE" ? bKey - aKey : aKey - bKey;
  });
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
