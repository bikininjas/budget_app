'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CategoryFormModal } from './category-form-modal';

export function AddCategoryButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Ajouter une catégorie
      </button>
      <CategoryFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
