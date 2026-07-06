import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function GoalsPage() {
  const goals = await prisma.goal.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Goals</h1>
        <p className="text-muted-foreground">
          Move fund, future down payment, emergency fund, HSA/FSA usage, debt payoff.
        </p>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No goals set yet. Adding goals from this page is coming next.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const target = toNumber(g.targetAmount);
            const current = toNumber(g.currentAmount);
            return (
              <Card key={g.id}>
                <CardHeader>
                  <CardTitle className="text-base">{g.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    ${current.toFixed(2)} / ${target.toFixed(2)}
                  </div>
                  <Progress value={target ? (current / target) * 100 : 0} className="mt-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
