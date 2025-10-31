// app/actions/projects-delete.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

const BUCKET = 'audit-files';

export type DeleteProjectResult = { ok: true } | { ok: false; error: string };

/**
 * Server Action: bind to a small <form> with hidden "id"
 */
export async function deleteProjectAction(formData: FormData): Promise<DeleteProjectResult> {
  const supabase = await createClient();
  const projectId = Number(formData.get('id') ?? 0);
  if (!Number.isFinite(projectId) || projectId <= 0) {
    return { ok: false, error: 'Invalid project id' };
  }

  const { data: files, error: filesErr } = await supabase
    .from('files')
    .select('id, path')
    .eq('project_id', projectId);
  if (filesErr) return { ok: false, error: filesErr.message };

  if (files?.length) {
    const ids = files.map(f => f.id);
    const paths = files.map(f => f.path);

    await supabase.storage.from(BUCKET).remove(paths);
    const { error: delFilesErr } = await supabase.from('files').delete().in('id', ids);
    if (delFilesErr) return { ok: false, error: delFilesErr.message };
  }

  const { error: projErr } = await supabase.from('projects').delete().eq('id', projectId);
  if (projErr) return { ok: false, error: projErr.message };

  revalidatePath('/projects'); // adjust
  return { ok: true };
}
