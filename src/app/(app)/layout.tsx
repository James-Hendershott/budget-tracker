import type { ReactNode } from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/income", label: "Income" },
  { href: "/bills", label: "Bills" },
  { href: "/housing", label: "Housing" },
  { href: "/transactions", label: "Transactions" },
  { href: "/debts", label: "Debts" },
  { href: "/goals", label: "Goals" },
  { href: "/scenarios", label: "What-If" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden shrink-0 border-r bg-card p-4 md:block md:w-56">
        <div className="mb-6 font-semibold">Budget Tracker</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
          {session?.user.role === "ADMIN" && (
            <Link
              href="/admin/users"
              className="rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              Admin
            </Link>
          )}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="mt-6"
        >
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Sign out
          </Button>
        </form>
      </aside>

      <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t bg-card p-2 md:hidden">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2 py-1 text-xs hover:bg-accent"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
