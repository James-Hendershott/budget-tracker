import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/decimal";
import { updateBillStatus } from "@/app/actions/billActions";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["PLANNED", "PENDING", "PAID", "REVIEW", "SKIPPED"];

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export default async function BillsPage() {
  const month = startOfMonth(new Date());
  const bills = await prisma.billInstance.findMany({
    where: { month },
    orderBy: [{ dueDay: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Monthly Required Bills — {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h1>
        <p className="text-muted-foreground">{bills.length} bills tracked this month</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead>Due day</TableHead>
                <TableHead>Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">
                    {b.name}
                    {b.notes && <p className="text-xs font-normal text-muted-foreground">{b.notes}</p>}
                  </TableCell>
                  <TableCell>{b.category.replaceAll("_", " ")}</TableCell>
                  <TableCell>
                    <Badge variant={b.priority === "REQUIRED" ? "default" : "outline"}>
                      {b.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${toNumber(b.plannedAmount).toFixed(2)}</TableCell>
                  <TableCell>{b.dueDay}</TableCell>
                  <TableCell>
                    <form action={updateBillStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={b.id} />
                      <Select name="status" defaultValue={b.status}>
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        name="actualAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="actual"
                        defaultValue={b.actualAmount ? toNumber(b.actualAmount) : undefined}
                        className="h-8 w-24"
                      />
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {bills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No bills recorded for this month yet.
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
