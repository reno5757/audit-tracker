// components/ProjectsTable.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { FileText, FileArchive, FileType } from "lucide-react";

type Row = {
  id: number;
  reference: string;
  customer: string;
  certification_type: string;
  inspection_date: string; // YYYY-MM-DD (empty string if none)
  city: string;
  status: string;
  notes: string;
  files: Partial<{
    inspectionPlanPDF: { href: string; label: string };
    auditReportPDF: { href: string; label: string };
    auditReportWord: { href: string; label: string };
    invoicePDF: { href: string; label: string };
    travelFeesZIP: { href: string; label: string };
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
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium truncate max-w-[15ch]";
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
      <Icon className="h-5 w-5 shrink-0" />
    </a>
  ) : (
    <span
      className={`${base} text-slate-400`}
      title="No file"
    >
      -
    </span>
  );
};

// -------- tanstack: helpers for sorting --------
const parseDateSafe = (s: string) => {
  if (!s) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(s);
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
};

// Optional custom order for status, fallback to alpha
const statusRank = (s: string) => {
  const v = s.toLowerCase();
  if (["approved", "passed", "ok"].includes(v)) return 3;
  if (["pending", "in progress"].includes(v)) return 2;
  if (["failed", "rejected"].includes(v)) return 1;
  return 0; // unknown/empty
};

export default function ProjectsTable({ rows }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    // default sort (optional): by inspection date desc
    { id: "inspection_date", desc: true },
  ]);

  const columns = React.useMemo<ColumnDef<Row, any>[]>(
    () => [
      {
        id: "reference",
        accessorKey: "reference",
        header: Header("Reference"),
        cell: ({ row }) => (
          <span
            title={row.original.reference}
            className="line-clamp-2 max-w-[30ch] font-medium text-slate-900"
          >
            {row.original.reference}
          </span>
        ),
        sortingFn: "alphanumeric",
        enableSorting: true,
      },
      {
        id: "customer",
        accessorKey: "customer",
        header: Header("Customer"),
        cell: ({ row }) => (
          <span
            title={row.original.customer}
            className="truncate max-w-[24ch] text-slate-700 block"
          >
            {row.original.customer}
          </span>
        ),
        sortingFn: "alphanumeric",
        enableSorting: true,
      },
      {
        id: "certification_type",
        accessorKey: "certification_type",
        header: StaticHeader("Certification Type"),
        cell: ({ row }) =>
          row.original.certification_type ? (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 ring-1 ring-inset ring-slate-200">
              {row.original.certification_type}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
        enableSorting: false,
      },
      {
        id: "inspection_date",
        accessorKey: "inspection_date",
        header: Header("Inspection Date"),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-slate-700">
            {row.original.inspection_date}
          </span>
        ),
        sortingFn: (a, b, colId) =>
          parseDateSafe(a.getValue(colId)) - parseDateSafe(b.getValue(colId)),
        enableSorting: true,
      },
      {
        id: "city",
        accessorKey: "city",
        header: StaticHeader("City"),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-slate-700">
            {row.original.city}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: "status",
        accessorKey: "status",
        header: Header("Status"),
        cell: ({ row }) => (
          <span className={statusClasses(row.original.status)}>
            {row.original.status || "—"}
          </span>
        ),
        sortingFn: (a, b, colId) =>
          statusRank(a.getValue(colId)) - statusRank(b.getValue(colId)),
        enableSorting: true,
      },
      {
        id: "notes",
        accessorKey: "notes",
        header: StaticHeader("Notes"),
        cell: ({ row }) => (
          <span title={row.original.notes} className="line-clamp-1 max-w-[40ch]">
            {row.original.notes}
          </span>
        ),
        enableSorting: false,
      },
      // Files
      {
        id: "inspection_plan",
        header: StaticHeader("Inspection Plan"),
        cell: ({ row }) =>
          fileBadge(
            "pdf",
            row.original.files.inspectionPlanPDF?.href,
            row.original.files.inspectionPlanPDF?.label
          ),
        enableSorting: false,
      },
      {
        id: "audit_report",
        header: StaticHeader("Audit Report"),
        cell: ({ row }) => (
          <div className="inline-flex items-center gap-2">
            {fileBadge(
              "pdf",
              row.original.files.auditReportPDF?.href,
              row.original.files.auditReportPDF?.label
            )}
            {fileBadge(
              "word",
              row.original.files.auditReportWord?.href,
              row.original.files.auditReportWord?.label
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        id: "invoice_pdf",
        header: StaticHeader("Invoice"),
        cell: ({ row }) =>
          fileBadge(
            "pdf",
            row.original.files.invoicePDF?.href,
            row.original.files.invoicePDF?.label
          ),
        enableSorting: false,
      },
      {
        id: "travel_fees",
        header: StaticHeader("Travel Fees"),
        cell: ({ row }) =>
          fileBadge(
            "zip",
            row.original.files.travelFeesZIP?.href,
            row.original.files.travelFeesZIP?.label
          ),
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted(); // false | 'asc' | 'desc'
                  return (
                    <th
                      key={header.id}
                      className="sticky top-0 z-10 whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 text-center"
                      aria-sort={
                        sortDir === "asc"
                          ? "ascending"
                          : sortDir === "desc"
                          ? "descending"
                          : "none"
                      }
                    >
                      <button
                        className={`inline-flex items-center gap-1 ${
                          isSortable
                            ? "cursor-pointer hover:text-slate-900"
                            : "cursor-default"
                        } ${sortDir ? "text-slate-900" : "text-slate-600"}`}
                        onClick={
                          isSortable ? header.column.getToggleSortingHandler() : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {isSortable && (
                          <span className="text-[10px]">
                            {sortDir === "asc" ? "▲" : sortDir === "desc" ? "▼" : ""}
                          </span>
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No data yet.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-3 text-sm text-center align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- small header helpers ----
function Header(label: string) {
  return () => <span>{label}</span>;
}
function StaticHeader(label: string) {
  // visually same, but marked non-sortable in column def
  return () => <span>{label}</span>;
}
