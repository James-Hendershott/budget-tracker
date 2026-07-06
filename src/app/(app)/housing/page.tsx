import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export default async function HousingPage() {
  const month = startOfMonth(new Date());
  const target = await prisma.housingTarget.findUnique({
    where: { month },
    include: { payments: { orderBy: { paymentDate: "desc" } } },
  });

  const targetAmount = target ? toNumber(target.targetAmount) : 0;
  const paid = target?.payments.reduce((sum, p) => sum + toNumber(p.amountPaid), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Housing Payment Tracker</h1>
        <p className="text-muted-foreground">Rent and utilities paid in pieces through the month.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!target ? (
            <p className="text-sm text-muted-foreground">
              No housing target set for this month yet. Setting a target and logging payments
              from this page is coming next.
            </p>
          ) : (
            <>
              <div className="text-2xl font-bold">
                ${paid.toFixed(2)} / ${targetAmount.toFixed(2)}
              </div>
              <Progress value={targetAmount ? (paid / targetAmount) * 100 : 0} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                ${Math.max(0, targetAmount - paid).toFixed(2)} remaining
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {target && target.payments.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Applied to</TableHead>
                  <TableHead>Paid by</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {target.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.paymentDate.toLocaleDateString()}</TableCell>
                    <TableCell>{p.appliedTo.replaceAll("_", " ")}</TableCell>
                    <TableCell>{p.paidBy}</TableCell>
                    <TableCell className="text-right">${toNumber(p.amountPaid).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
