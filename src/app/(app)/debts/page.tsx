import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { createDebt, deleteDebt } from "@/app/actions/debtActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEBT_TYPES = ["CREDIT_CARD", "INSTALLMENT", "SIGNATURE_LOAN", "STUDENT_LOAN", "MEDICAL_PLAN", "OTHER"];
const STRATEGIES = ["MINIMUM_ONLY", "AVALANCHE", "SNOWBALL", "CONSOLIDATION_CANDIDATE", "HOLD"];

export default async function DebtsPage() {
  const debts = await prisma.debt.findMany({ orderBy: [{ balance: "desc" }] });

  const totalKnownBalance = debts.reduce((sum, d) => sum + (d.balance ? toNumber(d.balance) : 0), 0);
  const unknownCount = debts.filter((d) => d.balance === null || d.minimumPayment === null).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Debts</h1>
        <p className="text-muted-foreground">
          ${totalKnownBalance.toFixed(2)} in known balances across {debts.length} debts
          {unknownCount > 0 && ` · ${unknownCount} need balance/payment confirmation`}
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Lender</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">APR</TableHead>
                <TableHead className="text-right">Min. payment</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-muted-foreground">{d.lender}</TableCell>
                  <TableCell className="text-right">
                    {d.balance !== null ? (
                      `$${toNumber(d.balance).toFixed(2)}`
                    ) : (
                      <Badge variant="destructive">Unknown</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {d.apr !== null ? `${toNumber(d.apr).toFixed(2)}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {d.minimumPayment !== null ? (
                      `$${toNumber(d.minimumPayment).toFixed(2)}`
                    ) : (
                      <Badge variant="destructive">Unknown</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{d.strategy.replaceAll("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <form action={deleteDebt}>
                      <input type="hidden" name="id" value={d.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a debt</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDebt} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lender">Lender</Label>
              <Input id="lender" name="lender" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debtType">Type</Label>
              <Select name="debtType" defaultValue="CREDIT_CARD">
                <SelectTrigger id="debtType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEBT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Balance (leave blank if unknown)</Label>
              <Input id="balance" name="balance" type="number" step="0.01" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apr">APR %</Label>
              <Input id="apr" name="apr" type="number" step="0.01" min="0" max="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumPayment">Minimum payment</Label>
              <Input id="minimumPayment" name="minimumPayment" type="number" step="0.01" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDay">Due day</Label>
              <Input id="dueDay" name="dueDay" type="number" min="1" max="31" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <Select name="strategy" defaultValue="MINIMUM_ONLY">
                <SelectTrigger id="strategy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">Add debt</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
