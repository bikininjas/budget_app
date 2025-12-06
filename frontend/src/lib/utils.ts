import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export const SPLIT_TYPE_LABELS: Record<string, string> = {
  '50_50': 'Commun (50/50)',
  '33_67': 'Commun (33% Seb / 67% Marie)',
  '67_33': 'Commun (67% Seb / 33% Marie)',
  '100_marie': 'Marie uniquement',
  '100_seb': 'Seb uniquement',
  '100_emeline': 'Emeline uniquement',
};

/**
 * Get a descriptive label for expense split showing who owes whom
 * @param splitType - The split type enum value
 * @param assignedUserName - Name of user who paid
 * @param amount - Expense amount
 * @returns Descriptive string like "Marie doit 15€ à Seb" or "Dépense commune (50/50)"
 */
export function getExpenseSplitDescription(
  splitType: string,
  assignedUserName: string,
  amount: number
): string {
  const paidBy = assignedUserName?.toLowerCase();
  
  // Full payment by one person (no split)
  if (splitType === '100_marie') {
    return 'Marie uniquement (100%)';
  }
  if (splitType === '100_seb') {
    return 'Seb uniquement (100%)';
  }
  if (splitType === '100_emeline') {
    return 'Emeline uniquement (100%)';
  }
  
  // Shared expenses - calculate who owes what
  if (splitType === '50_50') {
    const half = amount / 2;
    if (paidBy === 'seb') {
      return `Commun (50/50) - Marie doit ${formatCurrency(half)} à Seb`;
    } else if (paidBy === 'marie') {
      return `Commun (50/50) - Seb doit ${formatCurrency(half)} à Marie`;
    }
    return 'Dépense commune (50/50)';
  }
  
  if (splitType === '33_67') {
    const sebOwes = amount * 0.33;
    const marieOwes = amount * 0.67;
    if (paidBy === 'seb') {
      return `Commun (33/67) - Marie doit ${formatCurrency(marieOwes)} à Seb`;
    } else if (paidBy === 'marie') {
      return `Commun (33/67) - Seb doit ${formatCurrency(sebOwes)} à Marie`;
    }
    return 'Dépense commune (33% Seb / 67% Marie)';
  }
  
  if (splitType === '67_33') {
    const sebOwes = amount * 0.67;
    const marieOwes = amount * 0.33;
    if (paidBy === 'seb') {
      return `Commun (67/33) - Marie doit ${formatCurrency(marieOwes)} à Seb`;
    } else if (paidBy === 'marie') {
      return `Commun (67/33) - Seb doit ${formatCurrency(sebOwes)} à Marie`;
    }
    return 'Dépense commune (67% Seb / 33% Marie)';
  }
  
  return SPLIT_TYPE_LABELS[splitType] || splitType;
}

export const FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'Ponctuelle',
  monthly: 'Mensuelle',
  quarterly: 'Trimestrielle',
  annual: 'Annuelle',
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  caisse_epargne_joint: 'Caisse d\'Épargne Joint',
  caisse_epargne_seb: 'Caisse d\'Épargne Seb',
  caisse_epargne_marie: 'Caisse d\'Épargne Marie',
  n26_seb: 'N26 Seb',
};
// Force rebuild Fri Dec  5 11:30:58 CET 2025
