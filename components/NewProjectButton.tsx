'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react'; // ➕ icon
import NewProjectDialog from './NewProjectDialog';

export default function NewProjectButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="default"
        className="
          flex items-center gap-2
          bg-blue-600 hover:bg-blue-700
          text-white font-medium
          px-4 py-2
          rounded-lg shadow-sm
          transition-all duration-150
          hover:shadow-md
        "
      >
        <Plus className="h-4 w-4" />
        New Project
      </Button>

      <NewProjectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
