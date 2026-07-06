import { describe, expect, it } from "vitest";
import { computeSafeToSpend, computeSurvivalTotals, sortDebtsForPayoff } from "./dashboard";
import type { BillLike, DebtLike } from "./dashboard";

function bill(overrides: Partial<BillLike> = {}): BillLike {
  return {
    priority: "REQUIRED",
    status: "PLANNED",
    plannedAmount: 100,
    actualAmount: null,
    dueDay: 15,
    ...overrides,
  };
}

describe("computeSurvivalTotals", () => {
  it("sums only REQUIRED, non-SKIPPED bills for the required total", () => {
    const totals = computeSurvivalTotals([
      bill({ priority: "REQUIRED", plannedAmount: 100 }),
      bill({ priority: "OPTIONAL", plannedAmount: 50 }),
      bill({ priority: "REQUIRED", plannedAmount: 25, status: "SKIPPED" }),
    ]);
    expect(totals.requiredTotal).toBe(100);
  });

  it("counts paidSoFar using actualAmount when present, else plannedAmount", () => {
    const totals = computeSurvivalTotals([
      bill({ plannedAmount: 100, actualAmount: 95, status: "PAID" }),
      bill({ plannedAmount: 50, actualAmount: null, status: "PAID" }),
      bill({ plannedAmount: 30, status: "PLANNED" }),
    ]);
    expect(totals.paidSoFar).toBe(145);
    expect(totals.requiredTotal).toBe(180);
    expect(totals.remainingRequired).toBe(35);
  });

  it("never returns a negative remainingRequired even if overpaid", () => {
    const totals = computeSurvivalTotals([
      bill({ plannedAmount: 100, actualAmount: 150, status: "PAID" }),
    ]);
    expect(totals.remainingRequired).toBe(0);
  });

  it("returns zeros for an empty bill list", () => {
    const totals = computeSurvivalTotals([]);
    expect(totals).toEqual({ requiredTotal: 0, paidSoFar: 0, remainingRequired: 0 });
  });
});

describe("computeSafeToSpend", () => {
  it("subtracts paid and still-due required bills from income received", () => {
    const result = computeSafeToSpend({
      incomeReceivedSoFar: 1000,
      requiredBillsPaidSoFar: 400,
      requiredBillsStillDueBeforeNextPaycheck: 300,
    });
    expect(result).toBe(300);
  });

  it("floors at 0 instead of going negative when already behind", () => {
    const result = computeSafeToSpend({
      incomeReceivedSoFar: 200,
      requiredBillsPaidSoFar: 400,
      requiredBillsStillDueBeforeNextPaycheck: 300,
    });
    expect(result).toBe(0);
  });
});

describe("sortDebtsForPayoff", () => {
  // APR ranking and balance ranking deliberately disagree on b vs c, so a
  // test asserting the wrong ordering (or a sort that ignores strategy)
  // actually fails instead of passing by coincidence.
  const debts: DebtLike[] = [
    { id: "a", balance: 1000, apr: 10, minimumPayment: 50, includeInPayoffPlan: true },
    { id: "b", balance: 200, apr: 25, minimumPayment: 20, includeInPayoffPlan: true },
    { id: "c", balance: 500, apr: 30, minimumPayment: 30, includeInPayoffPlan: true },
    { id: "d", balance: 50, apr: 40, minimumPayment: 10, includeInPayoffPlan: false },
    { id: "e", balance: null, apr: null, minimumPayment: null, includeInPayoffPlan: true },
  ];

  it("excludes debts not marked includeInPayoffPlan", () => {
    const result = sortDebtsForPayoff(debts, "AVALANCHE");
    expect(result.find((d) => d.id === "d")).toBeUndefined();
  });

  it("avalanche orders highest APR first, unknowns last", () => {
    const result = sortDebtsForPayoff(debts, "AVALANCHE");
    expect(result.map((d) => d.id)).toEqual(["c", "b", "a", "e"]);
  });

  it("snowball orders smallest balance first, unknowns last", () => {
    const result = sortDebtsForPayoff(debts, "SNOWBALL");
    expect(result.map((d) => d.id)).toEqual(["b", "c", "a", "e"]);
  });
});
