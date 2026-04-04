import { useEffect, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PaidAccessRecord = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  manualId: number;
  manualTitle: string;
  stripeSessionId: string;
  paidAt: string;
};

export default function AdminPaidAccess() {
  const [records, setRecords] = useState<PaidAccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("/api/payment/admin/paid-access", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Chyba serveru: ${res.status}`);
        setRecords(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Nepodařilo se načíst data.");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
            Načítám data...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <CreditCard className="mb-3 size-10 opacity-30" />
            <p className="text-lg font-medium">Žádné platby zatím neproběhly.</p>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">Platby za AI přístup</CardTitle>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <CreditCard className="size-3" />
                  {records.length} plateb celkem
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Přehled všech uživatelů, kteří zaplatili za AI přístup k návodu.
              </p>
            </CardHeader>

            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Uživatel
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      E-mail
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Návod
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Zaplaceno
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Stripe Session
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                        idx % 2 === 0 ? "" : "bg-muted/10"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                            {r.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{r.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.userEmail}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/guide/${r.manualId}`}
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          {r.manualTitle}
                          <ExternalLink className="size-3 opacity-60" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(r.paidAt)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://dashboard.stripe.com/test/payments/${r.stripeSessionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          {r.stripeSessionId.slice(0, 24)}…
                          <ExternalLink className="size-2.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
