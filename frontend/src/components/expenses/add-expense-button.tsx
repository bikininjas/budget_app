'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ExpenseFormModal } from './expense-form-modal';

export function AddExpenseButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Ajouter une dépense
      </button>
      <ExpenseFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
