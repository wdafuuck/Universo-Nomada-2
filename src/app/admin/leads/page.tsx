import { LeadStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { LeadsTable } from "./leads-table";
import { StatusFilter } from "./status-filter";
import { CsvExportButton } from "./csv-export-button";

const VALID = new Set<string>(Object.values(LeadStatus));

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusParam = params.status && VALID.has(params.status) ? params.status : "all";

  const [leads, grouped, total] = await Promise.all([
    db.lead.findMany({
      where: statusParam === "all" ? undefined : { status: statusParam as LeadStatus },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    db.lead.count(),
  ]);

  const counts: Record<string, number> = { total };
  for (const g of grouped) counts[g.status] = g._count._all;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Leads</h2>
          <p className="text-sm text-slate-500 mt-1">
            Personas que pidieron cotización desde el sitio.
          </p>
        </div>
        <CsvExportButton leads={leads} />
      </div>

      <StatusFilter active={statusParam} counts={counts} />

      <LeadsTable leads={leads} />
    </div>
  );
}
