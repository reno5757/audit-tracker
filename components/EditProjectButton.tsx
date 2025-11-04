'use client';

import * as React from 'react';
import EditProjectDialog from './EditProjectDialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';  

type Project = {
  id: number;
  reference: string;
  customer: string;
  certification_type: string;
  city: string;
  inspection_date: string | null;
  audit_status: string;
  notes: string | null;
};

export default function EditProjectButton({ project }: { project: Project }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        size="icon"
        variant="ghost"           // clean, light gray hover
        className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Modifier</span> {/* accessibility */}
      </Button>

      <EditProjectDialog open={open} onOpenChange={setOpen} project={project} />
    </>
  );
}
