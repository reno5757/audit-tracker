// app/page.tsx
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import ProjectsClient from "@/components/ProjectsClient";

export const revalidate = 0;

type Project = {
  id: number;
  year: number | null;
  project_name: string | null;
  customer: string | null;
  city: string | null;
  inspection_date: string | null;
  audit_status: string | null;
  certification_type: string | null;
  notes: string | null;
  last_updated: string | null;
};

type FileRow = {
  id: number;
  project_id: number | null;
  kind: string | null;
  path: string | null;
  mime: string | null;
  size: number | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
};

const fmtDate = (d: string | null) =>
  !d ? "" : isNaN(+new Date(d)) ? (d as string) : new Date(d as string).toISOString().slice(0, 10);

const basename = (p?: string | null) => {
  if (!p) return "";
  const i = p.lastIndexOf("/");
  return i >= 0 ? p.slice(i + 1) : p;
};

const FILE_SLOTS = [
  "inspectionPlanPDF",
  "auditReportPDF",
  "auditReportWord",
  "invoicePDF",
  "travelFeesZIP",
] as const;

type FileSlot = (typeof FILE_SLOTS)[number];
type FileSlots = Partial<Record<FileSlot, { href: string; label: string }>>;

const classifyFile = (f: FileRow): FileSlot | undefined => {
  const k = (f.kind || "").toLowerCase();
  const m = (f.mime || "").toLowerCase();
  const p = (f.path || "").toLowerCase();
  const has = (s: string) => k.includes(s) || p.includes(s);

  if ((m.includes("pdf") || has("pdf")) && (has("inspection") || has("plan") || has("inspection_plan")))
    return "inspectionPlanPDF";
  if (m.includes("pdf") && (has("audit") || has("report"))) return "auditReportPDF";
  if (
    (m.includes("word") || m.includes("msword") || m.includes("doc") || m.includes("docx") || p.endsWith(".doc") || p.endsWith(".docx")) &&
    (has("audit") || has("report"))
  )
    return "auditReportWord";
  if ((m.includes("pdf") || has("pdf")) && (has("invoice") || has("facture"))) return "invoicePDF";
  if ((m.includes("zip") || p.endsWith(".zip")) && (has("travel") || has("fees") || has("expenses") || has("frais") || has("deplacement")))
    return "travelFeesZIP";
  return undefined;
};

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: projData, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, year, project_name, customer, city, inspection_date, audit_status, certification_type, notes, last_updated"
    )
    .order("year", { ascending: false })
    .order("id", { ascending: false });

  if (pErr) {
    return (
      <main className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <h1 className="text-lg font-semibold">Projects</h1>
        </div>
        <p className="mt-2 text-sm text-red-700">Error: {pErr.message}</p>
      </main>
    );
  }

  const { data: fileData, error: fErr } = await supabase
    .from("files")
    .select("id, project_id, kind, path, mime, size, uploaded_by, uploaded_at");
  if (fErr) console.error(fErr);

  const filesByProject = new Map<number, FileSlots>();
  (fileData ?? []).forEach((f) => {
    if (typeof f.project_id !== "number") return;
    const slots = filesByProject.get(f.project_id) ?? {};
    const slot = classifyFile(f);
    if (slot && !slots[slot]) {
      const name = basename(f.path) || f.kind || "file";
      // TODO: replace '#' with a signed Supabase Storage URL
      slots[slot] = { href: "#", label: name };
    }
    filesByProject.set(f.project_id, slots);
  });

  const rows = (projData ?? []).map((p) => ({
    id: p.id,
    reference: p.project_name ?? "",
    customer: p.customer ?? "",
    certification_type: p.certification_type ?? "",
    inspection_date: fmtDate(p.inspection_date),
    city: p.city ?? "",
    status: p.audit_status ?? "",
    notes: p.notes ?? "",
    files: filesByProject.get(p.id) ?? {},
  }));

  return (
    <main className="mx-auto p-6 lg:p-8">
      <ProjectsClient initialRows={rows} />
    </main>
  );
}
