// app/actions/projects.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

const BUCKET = 'audit-files';

const ProjectInsertSchema = z.object({
  reference: z.string().min(1).transform(s => s.trim()),
  customer: z.string().min(1).transform(s => s.trim()),
  certification_type: z.string().min(1).transform(s => s.trim()),
  city: z.string().min(1).transform(s => s.trim()),
  inspection_date: z.string().optional().or(z.literal('')), // YYYY-MM-DD or ''
  status: z.string().min(1).transform(s => s.trim()),
  notes: z.string().optional().default(''),
});

// Accepted files (server-side guardrails)
const FileSlots = [
  { name: 'inspectionPlanPDF', kind: 'pdf', accept: ['application/pdf'], maxMB: 25 },
  { name: 'auditReportPDF',    kind: 'pdf',    accept: ['application/pdf'], maxMB: 25 },
  { name: 'auditReportWord',   kind: 'doc',    accept: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ], maxMB: 20 },
  { name: 'invoicePDF',        kind: 'pdf',         accept: ['application/pdf'], maxMB: 15 },
  { name: 'travelFeesZIP',     kind: 'zip',     accept: ['application/zip', 'application/x-zip-compressed'], maxMB: 50 },
] as const;

function slugifyFilename(name: string) {
  const i = name.lastIndexOf('.');
  const base = (i >= 0 ? name.slice(0, i) : name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ext  = i >= 0 ? name.slice(i).toLowerCase() : '';
  const stamp = Date.now();
  return `${base || 'file'}-${stamp}${ext}`;
}

export type CreateProjectResult =
  | { ok: true; project: { id: number } }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createProjectWithFiles(
  _prev: CreateProjectResult | null,
  formData: FormData
): Promise<CreateProjectResult> {
  // 1) Parse fields
  const raw = Object.fromEntries(formData.entries());
  const parsed = ProjectInsertSchema.safeParse({
    reference: raw.reference ?? '',
    customer: raw.customer ?? '',
    certification_type: raw.certification_type ?? '',
    city: raw.city ?? '',
    inspection_date: raw.inspection_date ?? '',
    status: raw.status ?? '',
    notes: raw.notes ?? '',
  });

  if (!parsed.success) {
    return { ok: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { reference, customer, certification_type, city, inspection_date, status, notes } = parsed.data;
  const year =
    inspection_date && /^\d{4}-\d{2}-\d{2}$/.test(inspection_date)
      ? Number(inspection_date.slice(0, 4))
      : new Date().getFullYear();

  const supabase = await createClient();

  // Get user for uploaded_by (optional; you can leave null if not needed)
  const { data: userRes } = await supabase.auth.getUser();
  const uploaded_by = userRes?.user?.id ?? null;

  // 2) Insert project
  const { data: proj, error: projErr } = await supabase
    .from('projects')
    .insert({
      reference,
      customer,
      certification_type,
      city,
      inspection_date: inspection_date || null,
      audit_status: status,
      notes: notes ?? null,
      year,
    })
    .select('id')
    .single();

  if (projErr || !proj) {
    return { ok: false, error: projErr?.message || 'Failed to create project' };
  }

  const projectId = proj.id as number;

  // 3) Collect files from FormData
  type PendingUpload = {
    slotName: string;
    kind: string;
    file: File;
    path: string; // storage path (bucket-relative)
    mime: string;
    size: number;
  };

  const pending: PendingUpload[] = [];

  for (const slot of FileSlots) {
    const f = formData.get(slot.name);
    if (f && f instanceof File && f.size > 0) {
      // Validate type
      const mime = f.type || 'application/octet-stream';
      const okType = slot.accept.length === 0 || slot.accept.includes(mime);
      if (!okType) {
        // Rollback project immediately
        await supabase.from('projects').delete().eq('id', projectId);
        return { ok: false, error: `Invalid file type for ${slot.name}` };
      }
      // Validate size
      const maxBytes = slot.maxMB * 1024 * 1024;
      if (f.size > maxBytes) {
        await supabase.from('projects').delete().eq('id', projectId);
        return { ok: false, error: `File too large for ${slot.name} (max ${slot.maxMB} MB)` };
      }
      const safeName = slugifyFilename((f as any).name || `${slot.name}.bin`);
      const path = `projects/${projectId}/${slot.kind}/${safeName}`;
      pending.push({ slotName: slot.name, kind: slot.kind, file: f, path, mime, size: f.size });
    }
  }

  const uploadedPaths: string[] = [];
  const insertedFileIds: number[] = [];

  try {
    // 4) Upload each file to Storage
    for (const item of pending) {
      const up = await supabase.storage.from(BUCKET).upload(item.path, item.file, {
        contentType: item.mime,
        cacheControl: '3600',
        upsert: false, // avoid accidental overwrite
      });
      if (up.error) throw new Error(`Upload failed for ${item.slotName}: ${up.error.message}`);
      uploadedPaths.push(item.path);

      // 5) Insert files metadata
      const metaIns = await supabase
        .from('files')
        .insert({
          project_id: projectId,
          kind: item.kind,
          path: item.path,
          mime: item.mime,
          size: item.size,
          uploaded_by,
          // uploaded_at handled by default now() if your schema sets it, else set new Date().toISOString()
        })
        .select('id')
        .single();

      if (metaIns.error || !metaIns.data) {
        throw new Error(`Metadata insert failed for ${item.slotName}: ${metaIns.error?.message || 'unknown error'}`);
      }
      insertedFileIds.push(metaIns.data.id as number);
    }
  } catch (e: any) {
    // 6) Rollback: delete any uploaded objects, file rows, and the project
    if (uploadedPaths.length) {
      await supabase.storage.from(BUCKET).remove(uploadedPaths.map(p => p));
    }
    if (insertedFileIds.length) {
      await supabase.from('files').delete().in('id', insertedFileIds);
    }
    await supabase.from('projects').delete().eq('id', projectId);
    return { ok: false, error: e?.message || 'Upload pipeline failed' };
  }

  // 7) Success
  revalidatePath('/'); // or '/projects' depending on where your list is
  return { ok: true, project: { id: projectId } };
}
