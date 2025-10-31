'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { updateProjectWithFiles, type UpdateProjectResult } from '@/app/actions/projects-update';
import { deleteProjectAction } from '@/app/actions/projects-delete';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFormStatus } from 'react-dom';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: {
    id: number;
    reference: string;
    customer: string;
    certification_type: string;
    city: string;
    inspection_date: string | null; // "YYYY-MM-DD" or null
    audit_status: string;
    notes: string | null;
  };
};

const initialState: UpdateProjectResult | null = null;

// Small helper so the Delete button shows pending state using react-dom's useFormStatus
function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete'}
    </Button>
  );
}

export default function EditProjectDialog({ open, onOpenChange, project }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = React.useActionState(updateProjectWithFiles, initialState);

  React.useEffect(() => {
    if (state?.ok) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  const fieldError = (name: string) => state && !state.ok && state.fieldErrors?.[name]?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        {/* UPDATE FORM */}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" defaultValue={project.id} />

          {/* Text fields */}
          <div>
            <label className="block text-sm mb-1">Reference *</label>
            <Input name="reference" defaultValue={project.reference} required />
            {fieldError('reference') && <p className="text-sm text-red-600">{fieldError('reference')}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Customer *</label>
              <Input name="customer" defaultValue={project.customer} required />
              {fieldError('customer') && <p className="text-sm text-red-600">{fieldError('customer')}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Certification Type *</label>
              <Input name="certification_type" defaultValue={project.certification_type} required />
              {fieldError('certification_type') && (
                <p className="text-sm text-red-600">{fieldError('certification_type')}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">City *</label>
              <Input name="city" defaultValue={project.city} required />
              {fieldError('city') && <p className="text-sm text-red-600">{fieldError('city')}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Inspection Date</label>
              <Input type="date" name="inspection_date" defaultValue={project.inspection_date ?? ''} />
              {fieldError('inspection_date') && <p className="text-sm text-red-600">{fieldError('inspection_date')}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Status *</label>
            <Input name="status" defaultValue={project.audit_status} required />
            {fieldError('status') && <p className="text-sm text-red-600">{fieldError('status')}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Notes</label>
            <Textarea name="notes" rows={3} defaultValue={project.notes ?? ''} />
          </div>

          {/* Optional file replacements */}
          <div className="pt-2 space-y-3">
            <div>
              <label className="block text-sm mb-1">Inspection plan (PDF, ≤25 MB)</label>
              <Input type="file" name="inspectionPlanPDF" accept="application/pdf" />
            </div>
            <div>
              <label className="block text-sm mb-1">Audit report (PDF, ≤25 MB)</label>
              <Input type="file" name="auditReportPDF" accept="application/pdf" />
            </div>
            <div>
              <label className="block text-sm mb-1">Audit report (Word .doc/.docx, ≤20 MB)</label>
              <Input
                type="file"
                name="auditReportWord"
                accept=".doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Invoice (PDF, ≤15 MB)</label>
              <Input type="file" name="invoicePDF" accept="application/pdf" />
            </div>
            <div>
              <label className="block text-sm mb-1">Travel fees (ZIP, ≤50 MB)</label>
              <Input type="file" name="travelFeesZIP" accept=".zip,application/zip,application/x-zip-compressed" />
            </div>
          </div>

          {/* Global error */}
          {!state?.ok && state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          {/* Update footer (Save/Cancel only) */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>

        {/* DELETE FORM — sibling to the update form (no nesting) */}
        <form
          action={async (formData) => {
            // Server action call; on success, close dialog and refresh.
            const res = await deleteProjectAction(formData);
            if (res.ok) {
              onOpenChange(false);
              router.refresh();
            }
          }}
          className="mt-3"
        >
          <input type="hidden" name="id" value={project.id} />
          <DeleteSubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
