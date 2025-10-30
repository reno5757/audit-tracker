// components/ProjectsTable.tsx
"use client";

import * as React from "react";
import { FileText, FileArchive, FileType } from "lucide-react";

type Row = {
  id: number;
  reference: string;
  customer: string;
  certification_type: string;
  inspection_date: string; // YYYY-MM-DD
  city: string;
  status: string;
  notes: string;
  files: Partial<{
    inspectionPlanPDF: { href: string; label: string };
    auditReportPDF:   { href: string; label: string };
    auditReportWord:  { href: string; label: string };
    invoicePDF:       { href: string; label: string };
    travelFeesZIP:    { href: string; label: string };
  }>;
};

type Props = { rows: Row[] };

const statusClasses = (s?: string | null) => {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1";
  switch ((s || "").toLowerCase()) {
    case "passed":
    case "ok":
    case "approved":
      return `${base} text-emerald-700 ring-emerald-200 bg-emerald-50`;
    case "pending":
    case "in progress":
      return `${base} text-amber-700 ring-amber-200 bg-amber-50`;
    case "failed":
    case "rejected":
      return `${base} text-rose-700 ring-rose-200 bg-rose-50`;
    default:
      return `${base} text-slate-700 ring-slate-200 bg-slate-50`;
  }
};

type FileKind = "pdf" | "word" | "zip";

const truncate15 = (s?: string) =>
  !s ? "—" : s.length > 15 ? s.slice(0, 12) + "…" : s;

const fileBadge = (kind: FileKind, href?: string, fullName?: string) => {
  const base =
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset truncate max-w-[15ch]";
  const styles =
    kind === "pdf"
      ? "bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100"
      : kind === "word"
      ? "bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100"
      : "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100";

  const Icon = kind === "pdf" ? FileText : kind === "word" ? FileType : FileArchive;
  const label = truncate15(fullName);

  return href ? (
    <a
      href={href}
      className={`${base} ${styles}`}
      title={fullName}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  ) : (
    <span
      className={`${base} bg-slate-50 text-slate-400 ring-slate-200`}
      title="No file"
    >
      —
    </span>
  );
};

export default function ProjectsTable({ rows }: Props) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Reference",
                "Customer",
                "Certification Type",
                "Inspection Date",
                "City",
                "Status",
                "Notes",
                "Inspection Plan (PDF)",
                "Audit Report",            // <-- combined column
                "Invoice (PDF)",
                "Travel Fees (ZIP)",
              ].map((h) => (
                <th
                  key={h}
                  className="sticky top-0 z-10 whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No data yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="max-w-[30ch] px-3 py-3 text-sm font-medium text-slate-900">
                    <span title={r.reference} className="line-clamp-2">
                      {r.reference}
                    </span>
                  </td>
                  <td className="max-w-[24ch] px-3 py-3 text-sm text-slate-700">
                    <span title={r.customer} className="truncate">
                      {r.customer}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm">
                    {r.certification_type ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 ring-1 ring-inset ring-slate-200">
                        {r.certification_type}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
                    {r.inspection_date}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-700">
                    {r.city}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm">
                    <span className={statusClasses(r.status)}>
                      {r.status || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    <span title={r.notes} className="line-clamp-1 max-w-[40ch]">
                      {r.notes}
                    </span>
                  </td>

                  {/* Inspection Plan (PDF) */}
                  <td className="whitespace-nowrap px-3 py-3 text-sm">
                    {fileBadge(
                      "pdf",
                      r.files.inspectionPlanPDF?.href,
                      r.files.inspectionPlanPDF?.label
                    )}
                  </td>

                  {/* Audit Report (combined PDF + Word) */}
                  <td className="whitespace-nowrap px-3 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {fileBadge(
                        "pdf",
                        r.files.auditReportPDF?.href,
                        r.files.auditReportPDF?.label
                      )}
                      {fileBadge(
                        "word",
                        r.files.auditReportWord?.href,
                        r.files.auditReportWord?.label
                      )}
                    </div>
                  </td>

                  {/* Invoice (PDF) */}
                  <td className="whitespace-nowrap px-3 py-3 text-sm">
                    {fileBadge(
                      "pdf",
                      r.files.invoicePDF?.href,
                      r.files.invoicePDF?.label
                    )}
                  </td>

                  {/* Travel Fees (ZIP) */}
                  <td className="whitespace-nowrap px-3 py-3 text-sm">
                    {fileBadge(
                      "zip",
                      r.files.travelFeesZIP?.href,
                      r.files.travelFeesZIP?.label
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
