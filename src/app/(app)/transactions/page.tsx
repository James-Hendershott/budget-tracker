import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { deleteTransaction } from "@/app/actions/transactionActions";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Button asChild>
          <Link href="/transactions/new">Quick Add</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Paid by</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.date.toLocaleDateString()}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell className="text-muted-foreground">{t.merchant ?? "—"}</TableCell>
                  <TableCell>{t.paidBy}</TableCell>
                  <TableCell className="text-right">${toNumber(t.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={t.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No transactions yet.
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
