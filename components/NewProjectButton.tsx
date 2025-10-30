// components/NewProjectButton.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import NewProjectDialog from './NewProjectDialog';

export default function NewProjectButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New Project</Button>
      <NewProjectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
