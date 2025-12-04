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
  '50_50': '50/50',
  '33_67': '1/3 - 2/3',
  '67_33': '2/3 - 1/3',
  '100_marie': '100% Marie',
  '100_seb': '100% Seb',
};

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
