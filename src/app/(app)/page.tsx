import { prisma } from "@/lib/prisma";
import { computeSurvivalTotals, computeSafeToSpend } from "@/lib/calculations/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toNumber } from "@/lib/decimal";

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export default async function DashboardPage() {
  const now = new Date();
  const month = startOfMonth(now);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [bills, housingTarget, incomeEntries, goals] = await Promise.all([
    prisma.billInstance.findMany({ where: { month }, orderBy: { dueDay: "asc" } }),
    prisma.housingTarget.findUnique({ where: { month }, include: { payments: true } }),
    prisma.incomeEntry.findMany({
      where: { payDate: { gte: month, lt: new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)) } },
    }),
    prisma.goal.findMany(),
  ]);

  const billsForCalc = bills.map((b) => ({
    priority: b.priority,
    status: b.status,
    plannedAmount: toNumber(b.plannedAmount),
    actualAmount: b.actualAmount ? toNumber(b.actualAmount) : null,
    dueDay: b.dueDay,
  }));

  const totals = computeSurvivalTotals(billsForCalc);

  const incomeReceivedSoFar = incomeEntries.reduce(
    (sum, entry) => sum + (entry.actualAmount ? toNumber(entry.actualAmount) : 0),
    0
  );

  // Simplification until real pay-cycle windows exist (see IncomeEntry):
  // "still due before next paycheck" approximated as required bills due
  // in the next 7 days that aren't paid yet. Replace once income cadence
  // is tracked well enough to know the actual next pay date.
  const dueSoonUnpaid = bills.filter(
    (b) =>
      b.priority === "REQUIRED" &&
      b.status !== "PAID" &&
      b.status !== "SKIPPED" &&
      b.dueDay <= sevenDaysFromNow.getUTCDate()
  );
  const requiredBillsStillDueBeforeNextPaycheck = dueSoonUnpaid.reduce(
    (sum, b) => sum + toNumber(b.plannedAmount),
    0
  );

  const safeToSpend = computeSafeToSpend({
    incomeReceivedSoFar,
    requiredBillsPaidSoFar: totals.paidSoFar,
    requiredBillsStillDueBeforeNextPaycheck,
  });

  const housingPaid = housingTarget
    ? housingTarget.payments.reduce((sum, p) => sum + toNumber(p.amountPaid), 0)
    : 0;
  const housingTargetAmount = housingTarget ? toNumber(housingTarget.targetAmount) : null;

  const overdue = bills.filter(
    (b) => b.priority === "REQUIRED" && b.status !== "PAID" && b.status !== "SKIPPED" && b.dueDay < now.getUTCDate()
  );
  const dueSoon = dueSoonUnpaid.filter((b) => b.dueDay >= now.getUTCDate());
  const reviewItems = bills.filter((b) => b.status === "REVIEW");

  const debtBills = bills.filter((b) =>
    (["CREDIT_CARD", "STUDENT_LOAN", "PERSONAL_LOAN"] as const).includes(b.category as never)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h1>
        <p className="text-muted-foreground">Are we okay this month, and safe until the next paycheck?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Safe to spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${safeToSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              After required bills due in the next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly survival total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totals.requiredTotal.toFixed(2)}</div>
            <Progress
              value={totals.requiredTotal ? (totals.paidSoFar / totals.requiredTotal) * 100 : 0}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              ${totals.paidSoFar.toFixed(2)} paid · ${totals.remainingRequired.toFixed(2)} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Housing</CardTitle>
          </CardHeader>
          <CardContent>
            {housingTargetAmount === null ? (
              <p className="text-sm text-muted-foreground">
                No housing target set for this month yet.
              </p>
            ) : (
              <>
                <div className="text-3xl font-bold">${housingTargetAmount.toFixed(2)}</div>
                <Progress value={(housingPaid / housingTargetAmount) * 100} className="mt-2" />
                <p className="mt-1 text-xs text-muted-foreground">
                  ${housingPaid.toFixed(2)} paid · ${Math.max(0, housingTargetAmount - housingPaid).toFixed(2)} remaining
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {(overdue.length > 0 || dueSoon.length > 0 || reviewItems.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>{b.name}</span>
                <Badge variant="destructive">Overdue · due {b.dueDay}</Badge>
              </div>
            ))}
            {dueSoon.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>{b.name}</span>
                <Badge variant="secondary">Due soon · due {b.dueDay}</Badge>
              </div>
            ))}
            {reviewItems.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>{b.name}</span>
                <Badge variant="outline">Needs review</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required bills this month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bills
              .filter((b) => b.priority === "REQUIRED")
              .map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm">
                  <span>
                    {b.name} <span className="text-muted-foreground">· due {b.dueDay}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span>${toNumber(b.plannedAmount).toFixed(2)}</span>
                    <Badge variant={b.status === "PAID" ? "default" : "outline"}>{b.status}</Badge>
                  </div>
                </div>
              ))}
            {bills.filter((b) => b.priority === "REQUIRED").length === 0 && (
              <p className="text-sm text-muted-foreground">No required bills recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Debt minimums due</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {debtBills.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>
                  {b.name} <span className="text-muted-foreground">· due {b.dueDay}</span>
                </span>
                <span>${toNumber(b.plannedAmount).toFixed(2)}</span>
              </div>
            ))}
            {debtBills.length === 0 && (
              <p className="text-sm text-muted-foreground">No debt payments recorded this month.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.map((g) => {
              const target = toNumber(g.targetAmount);
              const current = toNumber(g.currentAmount);
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm">
                    <span>{g.name}</span>
                    <span>
                      ${current.toFixed(2)} / ${target.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={target ? (current / target) * 100 : 0} className="mt-1" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
