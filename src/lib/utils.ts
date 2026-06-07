import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount || 0);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'active':
    case 'completed':
      return 'text-emerald-500 bg-emerald-500/10';
    case 'pending':
    case 'scheduled':
      return 'text-amber-500 bg-amber-500/10';
    case 'overdue':
    case 'banned':
    case 'suspended':
      return 'text-rose-500 bg-rose-500/10';
    default:
      return 'text-slate-500 bg-slate-500/10';
  }
};
