// components/NewProjectDialog.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createProjectWithFiles, type CreateProjectResult } from '@/app/actions/projects';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Props = { open: boolean; onOpenChange: (v: boolean) => void };
const initialState: CreateProjectResult | null = null;

export default function NewProjectDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = React.useActionState(createProjectWithFiles, initialState);

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
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* Text fields */}
          <div>
            <label className="block text-sm mb-1">Reference *</label>
            <Input name="reference" required />
            {fieldError('reference') && <p className="text-sm text-red-600">{fieldError('reference')}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Customer *</label>
              <Input name="customer" required />
              {fieldError('customer') && <p className="text-sm text-red-600">{fieldError('customer')}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Certification Type *</label>
              <Input name="certification_type" required />
              {fieldError('certification_type') && <p className="text-sm text-red-600">{fieldError('certification_type')}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">City *</label>
              <Input name="city" required />
              {fieldError('city') && <p className="text-sm text-red-600">{fieldError('city')}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Inspection Date</label>
              <Input type="date" name="inspection_date" />
              {fieldError('inspection_date') && <p className="text-sm text-red-600">{fieldError('inspection_date')}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Status *</label>
            <Input name="status" required />
            {fieldError('status') && <p className="text-sm text-red-600">{fieldError('status')}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Notes</label>
            <Textarea name="notes" rows={3} />
          </div>

          {/* File inputs (simple drop-in; replace with your Dropzone UI if you want) */}
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
          {!state?.ok && state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
