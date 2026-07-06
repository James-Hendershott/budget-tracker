import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ScenariosPage() {
  const scenarios = await prisma.scenario.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">What-If Scenarios</h1>
        <p className="text-muted-foreground">
          Sandboxed — never changes the real budget unless explicitly applied.
        </p>
      </div>

      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No scenarios yet. Building scenarios here (cheaper rent, extra debt payment,
            accepting the consolidation loan, etc.) is coming next.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {s.name}
                  {s.appliedAt && <Badge>Applied</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                  {JSON.stringify(s.assumptions, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
