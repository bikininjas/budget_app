'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ProjectFormModal } from './project-form-modal';

export function AddProjectButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Ajouter un projet
      </button>
      <ProjectFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
