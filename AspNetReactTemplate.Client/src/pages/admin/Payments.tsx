import { useEffect, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

import {
  AdminDataTable,
  AdminTableCard,
  AdminTableHead,
  AdminTablePagination,
  PAGE_SIZE,
  type AdminTableColumn,
} from "@/components/domains/admin/TableLayout";

type PaymentRecord = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  manualId: number;
  manualTitle: string;
  stripeSessionId: string;
  paidAt: string;
};

const ADMIN_PAID_ACCESS_COLUMNS: AdminTableColumn[] = [
  { key: "user", label: "Uživatel" },
  { key: "email", label: "E-mail" },
  { key: "manual", label: "Návod" },
  { key: "paid-at", label: "Zaplaceno" },
  { key: "stripe-session", label: "Stripe Session" },
];

export default function AdminPayments() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

  useEffect(() => {
    const items = records.length;
    setTotalItems(items);
    setTotalPages(Math.max(1, Math.ceil(items / PAGE_SIZE)));
    setPage((p) =>
      Math.min(Math.max(1, p), Math.max(1, Math.ceil(items / PAGE_SIZE))),
    );
  }, [records]);

  const normalizedPage = Math.min(Math.max(1, page), totalPages);
  const pageStart = (normalizedPage - 1) * PAGE_SIZE;
  const pagedRecords = records.slice(pageStart, pageStart + PAGE_SIZE);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("cs-CZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <main className="mx-auto w-[95%] xl:w-[90%] 2xl:w-[80%] px-6 py-8">
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
            <p className="text-lg font-medium">
              Žádné platby zatím neproběhly.
            </p>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <AdminTableCard
            title="Platby za AI přístup"
            description="Přehled všech uživatelů, kteří zaplatili za AI přístup k návodu."
            actions={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <CreditCard className="size-3" />
                {records.length} plateb celkem
              </span>
            }
          >
            <AdminDataTable>
              <AdminTableHead columns={ADMIN_PAID_ACCESS_COLUMNS} />
              <tbody>
                {pagedRecords.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                      idx % 2 === 0 ? "" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
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
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        {r.stripeSessionId.slice(0, 24)}…
                        <ExternalLink className="size-2.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminDataTable>

            <AdminTablePagination
              page={normalizedPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={setPage}
              disabled={loading}
            />
          </AdminTableCard>
        )}
      </main>
    </div>
  );
}
