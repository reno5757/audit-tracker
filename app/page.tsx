// app/page.tsx (server component)
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

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
  !d ? "" : (isNaN(+new Date(d)) ? d! : new Date(d!).toISOString().slice(0, 10));

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch projects
  const { data: projData, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, year, project_name, customer, city, inspection_date, audit_status, certification_type, notes, last_updated"
    )
    .order("year", { ascending: false })
    .order("id", { ascending: false });

  if (pErr) {
    console.error(pErr);
    return (
      <main style={{ padding: 16 }}>
        <h1>Projects</h1>
        <p style={{ color: "crimson" }}>Error: {pErr.message}</p>
      </main>
    );
  }

  const projects: Project[] = projData ?? [];

  // Fetch files (separate query works regardless of FK setup)
  const { data: fileData, error: fErr } = await supabase
    .from("files")
    .select("id, project_id, kind, path, mime, size, uploaded_by, uploaded_at");

  if (fErr) {
    console.error(fErr);
  }

  // Group files by project_id
  const filesByProject = new Map<number, FileRow[]>();
  (fileData ?? []).forEach((f) => {
    if (typeof f.project_id === "number") {
      const arr = filesByProject.get(f.project_id) ?? [];
      arr.push(f);
      filesByProject.set(f.project_id, arr);
    }
  });

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ margin: 0 }}>Projects</h1>
      <p style={{ color: "#666", marginTop: 4 }}>
        {projects.length} record{projects.length === 1 ? "" : "s"}
      </p>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            fontSize: 14,
            border: "1px solid #e5e7eb",
          }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              {[
                "ID",
                "Year",
                "Project name",
                "Customer",
                "City",
                "Inspection date",
                "Audit status",
                "Certification type",
                "Notes",
                "Last updated",
                "Files",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderBottom: "1px solid #e5e7eb",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: 12, color: "#666" }}>
                  No data yet.
                </td>
              </tr>
            ) : (
              projects.map((p) => {
                const files = filesByProject.get(p.id) ?? [];
                return (
                  <tr key={p.id} style={{ background: "white" }}>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{p.id}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{p.year ?? ""}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{p.project_name ?? ""}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{p.customer ?? ""}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{p.city ?? ""}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{fmtDate(p.inspection_date)}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{p.audit_status ?? ""}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{p.certification_type ?? ""}</td>
                    <td
                      style={{
                        padding: "8px 10px",
                        borderBottom: "1px solid #f1f5f9",
                        maxWidth: 360,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={p.notes ?? ""}
                    >
                      {p.notes ?? ""}
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{fmtDate(p.last_updated)}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>
                      {files.length === 0 ? (
                        <span style={{ color: "#64748b" }}>0</span>
                      ) : (
                        <details>
                          <summary>{files.length} file{files.length === 1 ? "" : "s"}</summary>
                          <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                            {files.map((f) => (
                              <li key={f.id} style={{ listStyle: "disc" }}>
                                {f.kind ?? "file"}{" "}
                                <span style={{ color: "#64748b" }}>
                                  {f.mime ?? ""} {f.size ? `(${f.size} B)` : ""}
                                </span>
                                {f.path ? (
                                  <>
                                    {" "}
                                    — <code style={{ background: "#f1f5f9", padding: "0 4px" }}>{f.path}</code>
                                  </>
                                ) : null}
                                {f.uploaded_at ? ` • ${fmtDate(f.uploaded_at)}` : ""}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
