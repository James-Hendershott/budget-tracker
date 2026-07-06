import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function IncomePage() {
  const entries = await prisma.incomeEntry.findMany({ orderBy: { payDate: "desc" }, take: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Income Planner</h1>
        <p className="text-muted-foreground">
          James paid weekly, Savanah paid bi-weekly. What has to be covered before the next paycheck?
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pay date</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Actual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.payDate.toLocaleDateString()}</TableCell>
                  <TableCell>{e.person}</TableCell>
                  <TableCell className="text-muted-foreground">{e.purpose ?? "—"}</TableCell>
                  <TableCell className="text-right">${toNumber(e.expectedAmount).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {e.actualAmount ? `$${toNumber(e.actualAmount).toFixed(2)}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No income entries yet. Adding/editing income from this page is coming next —
                    for now this reads real data only.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
