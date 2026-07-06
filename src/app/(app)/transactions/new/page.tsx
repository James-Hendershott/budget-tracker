import { createTransaction } from "@/app/actions/transactionActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function todayLocalDate() {
  return new Date().toISOString().slice(0, 10);
}

/// The screen Savanah will use most, on her phone. Minimal required
/// fields, big touch targets, sensible defaults (today, counts toward
/// budget) so logging a transaction is a few taps, not a chore.
export default function QuickAddTransactionPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Quick Add</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                autoFocus
                className="h-14 text-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" required className="h-12" placeholder="Groceries, gas, medical…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant (optional)</Label>
              <Input id="merchant" name="merchant" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid by</Label>
              <Select name="paidBy" defaultValue="JAMES">
                <SelectTrigger id="paidBy" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAMES">James</SelectItem>
                  <SelectItem value="SAVANAH">Savanah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={todayLocalDate()} className="h-12" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="countsTowardBudget" defaultChecked className="size-5" />
              Counts toward budget
            </label>
            <Button type="submit" className="h-14 w-full text-lg">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
