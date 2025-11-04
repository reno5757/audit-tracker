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
import { formatDate } from '@/utils/date';

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
// Canonical statuses used across the app
type Status =
  | 'A planifier'
  | 'Planifié'
  | 'En cours'
  | 'Rédaction rapport'
  | 'Terminé'
  | 'Annulé';

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();

const statusClasses = (s?: string | null) => {
  const v = norm(s);
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1";
  switch (v) {
    case 'a planifier':
      return `${base} text-slate-700 ring-slate-200 bg-slate-50`;
    case 'planifié':
      return `${base} text-sky-700 ring-sky-200 bg-sky-50`;
    case 'en cours':
      return `${base} text-amber-700 ring-amber-200 bg-amber-50`;
    case 'rédaction rapport':
      return `${base} text-violet-700 ring-violet-200 bg-violet-50`;
    case 'terminé':
      return `${base} text-emerald-700 ring-emerald-200 bg-emerald-50`;
    case 'annulé':
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

const statusRank = (s: string) => {
  switch (norm(s)) {
    case 'a planifier':         return 0;
    case 'planifié':            return 1;
    case 'en cours':            return 2;
    case 'rédaction rapport':   return 3;
    case 'terminé':             return 4;
    case 'annulé':              return 5; // usually sorted last
    default:                    return 99;
  }
};

export default function ProjectsTable({ rows, isAdmin = false }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "inspection_date", desc: true },
  ]);

  // NEW: default column sizing (per docs)
  const defaultColumn = React.useMemo(
    () => ({
      size: 180,   // sensible default for non-file cols
      minSize: 64, // keep them usable
    }),
    []
  );

  const columns = React.useMemo<ColumnDef<Row, any>[]>(
    () => [
      {
        id: "reference",
        accessorKey: "reference",
        header: Header("Réference"),
        cell: ({ row }) => (
          <span
            title={row.original.reference}
            className="line-clamp-2 font-medium text-slate-900"
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
        header: Header("Client"),
        cell: ({ row }) => (
          <span
            title={row.original.customer}
            className="truncate text-slate-700"
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
        header: StaticHeader("Certification"),
        cell: ({ row }) =>
          row.original.certification_type ? (
            <span className="truncate text-slate-700">
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
        header: Header("Date Inspection"),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-slate-700">
            {formatDate(row.original.inspection_date)}
          </span>
        ),
        sortingFn: (a, b, colId) =>
          parseDateSafe(a.getValue(colId)) - parseDateSafe(b.getValue(colId)),
        enableSorting: true,
      },
      {
        id: "city",
        accessorKey: "city",
        header: StaticHeader("Ville"),
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
  
      // Files 
      {
        id: "inspection_plan",
        header: StaticHeader("Plan Inspection"),
        cell: ({ row }) => (
          <div className="mx-auto">
            <SignedFileBadge
              kind="pdf"
              path={row.original.files.inspectionPlanPDF?.path}
              label={row.original.files.inspectionPlanPDF?.label}
            />
          </div>
        ),
        size: 1,           
        enableSorting: false,
      },
      {
        id: "audit_report",
        header: StaticHeader("Rapport"),
        cell: ({ row }) => (
          <div className="flex justify-center gap-1 mx-auto">
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
        size: 1,          
        enableSorting: false,
      },
      {
        id: "invoice_pdf",
        header: StaticHeader("Facture"),
        cell: ({ row }) => (
          <div className="mx-auto">
            <SignedFileBadge
              kind="pdf"
              path={row.original.files.invoicePDF?.path}
              label={row.original.files.invoicePDF?.label}
            />
          </div>
        ),
        size: 1,           
        enableSorting: false,
      },
      {
        id: "travel_fees",
        header: StaticHeader("Frais"),
        cell: ({ row }) => (
          <div className="mx-auto">
            <SignedFileBadge
              kind="zip"
              path={row.original.files.travelFeesZIP?.path}
              label={row.original.files.travelFeesZIP?.label}
            />
          </div>
        ),
        size: 1,           
        enableSorting: false,
      },
      //Notes
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
      //Action Edit
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
            inspection_date: r.inspection_date || null,
            audit_status: r.status,
            notes: r.notes || null,
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
    defaultColumn,              
    columnResizeMode: "onChange", 
  });

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 table-fixed">
          <colgroup>
            {table.getHeaderGroups().map((hg) =>
              hg.headers.map((header) => (
                <col key={header.id} style={{ width: `${header.getSize()}px` }} />
              ))
            )}
          </colgroup>

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
