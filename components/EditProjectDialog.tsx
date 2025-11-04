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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: {
    id: number;
    reference: string;
    customer: string;
    certification_type: string;
    city: string;
    inspection_date: string | null; // "YYYY-MM-DD" ou null
    audit_status: string;
    notes: string | null;
  };
};

const initialState: UpdateProjectResult | null = null;

// Statuts disponibles (doivent correspondre au schéma côté serveur)
const STATUS_OPTIONS = [
  'A planifier',
  'Planifié',
  'En cours',
  'Rédaction rapport',
  'Terminé',
  'Annulé',
] as const;

// Petit helper : bouton de suppression avec état "en cours"
function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? 'Suppression…' : 'Supprimer'}
    </Button>
  );
}

export default function EditProjectDialog({ open, onOpenChange, project }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = React.useActionState(updateProjectWithFiles, initialState);

  // État local du sélecteur de statut
  const [status, setStatus] = React.useState<string>(project.audit_status ?? '');
  React.useEffect(() => {
    setStatus(project.audit_status ?? '');
  }, [project.audit_status]);

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
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>

        {/* FORMULAIRE DE MISE À JOUR */}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" defaultValue={project.id} />

          {/* Champs texte */}
          <div>
            <label className="block text-sm mb-1">Référence *</label>
            <Input name="reference" defaultValue={project.reference} required />
            {fieldError('reference') && <p className="text-sm text-red-600">{fieldError('reference')}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Client *</label>
              <Input name="customer" defaultValue={project.customer} required />
              {fieldError('customer') && <p className="text-sm text-red-600">{fieldError('customer')}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Type de certification *</label>
              <Input name="certification_type" defaultValue={project.certification_type} required />
              {fieldError('certification_type') && (
                <p className="text-sm text-red-600">{fieldError('certification_type')}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Ville *</label>
              <Input name="city" defaultValue={project.city} required />
              {fieldError('city') && <p className="text-sm text-red-600">{fieldError('city')}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Date d’inspection</label>
              <Input type="date" name="inspection_date" defaultValue={project.inspection_date ?? ''} />
              {fieldError('inspection_date') && <p className="text-sm text-red-600">{fieldError('inspection_date')}</p>}
            </div>
          </div>

          {/* Statut */}
          <div>
            <label htmlFor="status" className="block text-sm mb-1">
              Statut *
            </label>
            <input type="hidden" name="status" value={status} required />

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {fieldError('status') && <p className="text-sm text-red-600">{fieldError('status')}</p>}
          </div>

          <div>
            <label className="block text-sm mb-1">Notes</label>
            <Textarea name="notes" rows={3} defaultValue={project.notes ?? ''} placeholder="Commentaires ou remarques" />
          </div>

          {/* Remplacement de fichiers optionnels */}
          <div className="pt-2 space-y-3">
            <div>
              <label className="block text-sm mb-1">Plan d’inspection (PDF, ≤25 Mo)</label>
              <Input type="file" name="inspectionPlanPDF" accept="application/pdf" />
            </div>
            <div>
              <label className="block text-sm mb-1">Rapport d’audit (PDF, ≤25 Mo)</label>
              <Input type="file" name="auditReportPDF" accept="application/pdf" />
            </div>
            <div>
              <label className="block text-sm mb-1">Rapport d’audit (Word .doc/.docx, ≤20 Mo)</label>
              <Input
                type="file"
                name="auditReportWord"
                accept=".doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Facture (PDF, ≤15 Mo)</label>
              <Input type="file" name="invoicePDF" accept="application/pdf" />
            </div>
            <div>
              <label className="block text-sm mb-1">Frais de déplacement (ZIP, ≤50 Mo)</label>
              <Input type="file" name="travelFeesZIP" accept=".zip,application/zip,application/x-zip-compressed" />
            </div>
          </div>

          {/* Erreur globale */}
          {!state?.ok && state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          {/* Boutons d’action */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>

        {/* FORMULAIRE DE SUPPRESSION */}
        <form
          action={async (formData) => {
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
