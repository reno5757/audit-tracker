// app/actions/projects-update.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

const BUCKET = 'audit-files';

const FileSlots = [
  { name: 'inspectionPlanPDF', kind: 'pdf', accept: ['application/pdf'], maxMB: 25 },
  { name: 'auditReportPDF',    kind: 'pdf', accept: ['application/pdf'], maxMB: 25 },
  { name: 'auditReportWord',   kind: 'doc', accept: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ], maxMB: 20 },
  { name: 'invoicePDF',        kind: 'pdf', accept: ['application/pdf'], maxMB: 15 },
  { name: 'travelFeesZIP',     kind: 'zip', accept: ['application/zip', 'application/x-zip-compressed'], maxMB: 50 },
] as const;

function slugifyFilename(name: string) {
  const i = name.lastIndexOf('.');
  const base = (i >= 0 ? name.slice(0, i) : name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const ext  = i >= 0 ? name.slice(i).toLowerCase() : '';
  const stamp = Date.now();
  return `${base || 'file'}-${stamp}${ext}`;
}

const ProjectUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  reference: z.string().min(1).transform(s => s.trim()),
  customer: z.string().min(1).transform(s => s.trim()),
  certification_type: z.string().min(1).transform(s => s.trim()),
  city: z.string().min(1).transform(s => s.trim()),
  inspection_date: z.string().optional().or(z.literal('')), // YYYY-MM-DD or ''
  status: z.string().min(1).transform(s => s.trim()),
  notes: z.string().optional().default(''),
});

export type UpdateProjectResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Server Action: bind to a <form action={updateProjectWithFiles}>
 */
export async function updateProjectWithFiles(
  _prev: UpdateProjectResult | null,
  formData: FormData
): Promise<UpdateProjectResult> {
  const supabase = await createClient();

  // Parse
  const raw = Object.fromEntries(formData.entries());
  const parsed = ProjectUpdateSchema.safeParse({
    id: raw.id ?? '',
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
  const { id, reference, customer, certification_type, city, inspection_date, status, notes } = parsed.data;

  // Update project fields
  const year =
    inspection_date && /^\d{4}-\d{2}-\d{2}$/.test(inspection_date)
      ? Number(inspection_date.slice(0, 4))
      : new Date().getFullYear();

  const { error: updErr } = await supabase
    .from('projects')
    .update({
      reference,
      customer,
      certification_type,
      city,
      inspection_date: inspection_date || null,
      audit_status: status,
      notes: notes ?? null,
      year,
      last_updated: new Date().toISOString(),
    })
    .eq('id', id);

  if (updErr) return { ok: false, error: updErr.message };

  // File replacements (optional; only if user selected a new file)
  const { data: userRes } = await supabase.auth.getUser();
  const uploaded_by = userRes?.user?.id ?? null;

  const refSlug = reference.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const uploadedPaths: string[] = [];
  const newFileIds: number[] = [];
  const toDeletePaths: string[] = [];

  try {
    for (const slot of FileSlots) {
      const f = formData.get(slot.name);
      if (!f || !(f instanceof File) || f.size === 0) continue;

      const mime = f.type || 'application/octet-stream';
      if (slot.accept.length && !slot.accept.includes(mime)) {
        throw new Error(`Invalid file type for ${slot.name}`);
      }
      const maxBytes = slot.maxMB * 1024 * 1024;
      if (f.size > maxBytes) {
        throw new Error(`File too large for ${slot.name} (max ${slot.maxMB} MB)`);
      }

      const safeName = slugifyFilename((f as any).name || `${slot.name}.bin`);
      const path = `audits/${refSlug}/${slot.kind}/${safeName}`;
      const up = await supabase.storage.from(BUCKET).upload(path, f, {
        contentType: mime,
        cacheControl: '3600',
        upsert: false,
      });
      if (up.error) throw new Error(`Upload failed for ${slot.name}: ${up.error.message}`);
      uploadedPaths.push(path);

      const metaIns = await supabase
        .from('files')
        .insert({
          project_id: id,
          slot: slot.name,
          kind: slot.kind,
          path,
          mime,
          size: f.size,
          uploaded_by,
        })
        .select('id')
        .single();
      if (metaIns.error || !metaIns.data) {
        throw new Error(`Metadata insert failed for ${slot.name}: ${metaIns.error?.message || 'unknown error'}`);
      }
      newFileIds.push(metaIns.data.id as number);

      // Remove previous rows for this slot (skip if you want history)
      const { data: oldFiles, error: oldErr } = await supabase
        .from('files')
        .select('id, path')
        .eq('project_id', id)
        .eq('slot', slot.name)
        .lt('id', metaIns.data.id);

      if (!oldErr && oldFiles?.length) {
        toDeletePaths.push(...oldFiles.map(f => f.path));
        await supabase.from('files').delete().in('id', oldFiles.map(f => f.id));
      }
    }
  } catch (e: any) {
    if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths);
    if (newFileIds.length) await supabase.from('files').delete().in('id', newFileIds);
    return { ok: false, error: e?.message || 'Update pipeline failed' };
  }

  if (toDeletePaths.length) {
    await supabase.storage.from(BUCKET).remove(toDeletePaths);
  }

  revalidatePath('/projects'); // adjust to your listing route
  return { ok: true };
}
