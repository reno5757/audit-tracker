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
import SignedFileBadge from "@/components/SignedFileBadge";
import EditProjectButton from '@/components/EditProjectButton';

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
    inspectionPlanPDF: { path: string; label: string };
    auditReportPDF: { path: string; label: string };
    auditReportWord: { path: string; label: string };
    invoicePDF: { path: string; label: string };
    travelFeesZIP: { path: string; label: string };
  }>;
};

type Props = { rows: Row[] ; isAdmin?: boolean };

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

export default function ProjectsTable({ rows, isAdmin = false }: Props) {
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
            <span className="truncate max-w-[24ch] text-slate-700 block">
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
        cell: ({ row }) => (
          <SignedFileBadge
            kind="pdf"
            path={row.original.files.inspectionPlanPDF?.path}
            label={row.original.files.inspectionPlanPDF?.label}
          />
        ),
        enableSorting: false,
      },
      {
        id: "audit_report",
        header: StaticHeader("Audit Report"),
        cell: ({ row }) => (
          <div className="inline-flex items-center gap-2">
            <SignedFileBadge
              kind="pdf"
              path={row.original.files.auditReportPDF?.path}
              label={row.original.files.auditReportPDF?.label}
            />
            <SignedFileBadge
              kind="word"
              path={row.original.files.auditReportWord?.path}
              label={row.original.files.auditReportWord?.label}
            />
          </div>
        ),
        enableSorting: false,
      },
      {
        id: "invoice_pdf",
        header: StaticHeader("Invoice"),
        cell: ({ row }) => (
          <SignedFileBadge
            kind="pdf"
            path={row.original.files.invoicePDF?.path}
            label={row.original.files.invoicePDF?.label}
          />
        ),
        enableSorting: false,
      },
      {
        id: "travel_fees",
        header: StaticHeader("Travel Fees"),
        cell: ({ row }) => (
          <SignedFileBadge
            kind="zip"
            path={row.original.files.travelFeesZIP?.path}
            label={row.original.files.travelFeesZIP?.label}
          />
        ),
        enableSorting: false,
      },
      {
      id: 'actions',
      header: StaticHeader(''),
      cell: ({ row }) => {
        const r = row.original;

        if (!isAdmin) return null; // hide if not admin

        const project = {
          id: r.id,
          reference: r.reference,
          customer: r.customer,
          certification_type: r.certification_type,
          city: r.city,
          inspection_date: r.inspection_date || null, // '' -> null
          audit_status: r.status,                     // map to dialog prop
          notes: r.notes || null,                     // '' -> null
        };
        return <EditProjectButton project={project} />;
      },
      enableSorting: false,
      size: 120,
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
