import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import ProjectsClient from "@/components/ProjectsClient";
import NewProjectButton from "@/components/NewProjectButton";
import { FolderKanban } from "lucide-react";

export const revalidate = 0;

type Project = {
  id: number;
  year: number;
  reference: string | null;
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
  slot:
    | "inspectionPlanPDF"
    | "auditReportPDF"
    | "auditReportWord"
    | "invoicePDF"
    | "travelFeesZIP"
    | null;
  path: string | null;
  mime: string | null;
  size: number | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
};

const fmtDate = (d: string | null) =>
  !d
    ? ""
    : isNaN(+new Date(d))
    ? (d as string)
    : new Date(d as string).toISOString().slice(0, 10);

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
type FileSlots = Partial<Record<FileSlot, { path: string; label: string; kind: 'pdf' | 'word' | 'zip' }>>;

const classifyFile = (f: FileRow): FileSlot | undefined =>
  (f.slot as FileSlot) || undefined;

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = await createClient();

  // --- Get current user & check admin ---
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();
    isAdmin = !!data;
  }

  // --- Load projects ---
  const { data: projData, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, year, reference, customer, city, inspection_date, audit_status, certification_type, notes, last_updated"
    )
    .order("inspection_date", { ascending: false });

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

  // --- Load files (with slot) ---
  const { data: fileData, error: fErr } = await supabase
    .from("files")
    .select("id, project_id, slot, path, mime, size, uploaded_by, uploaded_at");

  if (fErr) console.error(fErr);

  // --- Group files by project ---
  const filesByProject = new Map<number, FileSlots>();
  (fileData ?? []).forEach((f) => {
    if (typeof f.project_id !== "number") return;
    const slots = filesByProject.get(f.project_id) ?? {};
    const slot = classifyFile(f);
    if (slot && !slots[slot]) {
      const name = basename(f.path) || slot || "file";
      const mime = (f.mime || "").toLowerCase();
      const p = (f.path || "").toLowerCase();

      let kind: 'pdf' | 'word' | 'zip' = 'pdf'; // default
      if (mime.includes('zip') || p.endsWith('.zip')) kind = 'zip';
      else if (
        mime.includes('word') ||
        mime.includes('msword') ||
        mime.includes('doc') ||
        mime.includes('docx') ||
        p.endsWith('.doc') ||
        p.endsWith('.docx')
      )
        kind = 'word';

      slots[slot] = { path: f.path!, label: name, kind };
    }
    filesByProject.set(f.project_id, slots);
  });

  // --- Combine projects + files ---
  const rows = (projData ?? []).map((p) => ({
    id: p.id,
    reference: p.reference ?? "",
    customer: p.customer ?? "",
    certification_type: p.certification_type ?? "",
    inspection_date: fmtDate(p.inspection_date),
    city: p.city ?? "",
    status: p.audit_status ?? "",
    notes: p.notes ?? "",
    files: filesByProject.get(p.id) ?? {},
  }));

 
  // --- Render page ---
  return (
    <main className="mx-auto p-6 lg:p-8">
      {user && isAdmin && (
        <div className="text-sm text-gray-600 mb-2">
          Logged in as <span className="font-medium">admin</span> for {user.email}
          {" · "}
          <a href="/logout" className="text-blue-600 hover:underline">
            Logout
          </a>
        </div>
      )}

    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
          <FolderKanban className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Audits Efectis </h1>
        </div>
      </div>
      {user && isAdmin && <NewProjectButton />}
    </div>

      <ProjectsClient initialRows={rows} isAdmin={isAdmin}/>
    </main>
  );
}
