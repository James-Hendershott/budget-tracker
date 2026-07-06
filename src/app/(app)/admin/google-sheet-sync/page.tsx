import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/// Intentionally inert — see docs/GOOGLE_SHEETS_COMPANION.md. The
/// PostgreSQL database is always the source of truth; this screen exists
/// so the seam is visible in the nav without pretending sync works.
export default async function GoogleSheetSyncPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Google Sheet Sync</h1>
        <p className="text-muted-foreground">
          Not active yet. See <code>docs/GOOGLE_SHEETS_COMPANION.md</code> for the planned tabs,
          columns, and conflict-resolution rules.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import / Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            When this ships, it will let an admin manually pull rows Savanah added in a shared
            Google Sheet into the app, or push the app&apos;s current data out to a sheet. The app
            database stays the source of truth — conflicting edits get flagged for review, never
            silently overwritten.
          </p>
          <div className="flex gap-2">
            <Button disabled>Import from Sheet</Button>
            <Button disabled variant="outline">
              Export to Sheet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
