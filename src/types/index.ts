export type UserRole = 'MASTER' | 'OWNER' | 'ADMIN' | 'FINANCE' | 'OPERATIONAL' | 'SUPERVISOR' | 'VIEWER';

export type TenantStatus = 'active' | 'suspended' | 'blocked' | 'expired' | 'cancelled';

export interface Tenant {
  id: string;
  name: string;
  trade_name?: string;
  cnpj: string;
  segment: string;
  status: TenantStatus;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  expires_at: string;
  max_users: number;
  contact_email: string;
  whatsapp?: string;
  address?: string;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  tenant_id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  due_date: string;
  payment_date?: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  category_id?: string;
  category?: string; // Temporário para transição
  bank_account_id?: string;
  credit_card_id?: string;
  contact_id?: string;
  cost_center_id?: string;
  attachment_url?: string;
  is_recurring?: boolean;
  recurrence_period?: 'monthly' | 'weekly' | 'yearly';
  observations?: string;
}

export interface BankAccount {
  id: string;
  tenant_id: string;
  bank_name: string;
  agency: string;
  account_number: string;
  type: 'checking' | 'savings' | 'investment' | 'cash';
  initial_balance: number;
  balance: number;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  document?: string;
  type: 'client' | 'supplier' | 'both';
}

export interface Contract {
  id: string;
  tenant_id: string;
  contact_id: string;
  title: string;
  value: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'pending';
  file_url?: string;
}

// Church Module
export interface Member {
  id: string;
  tenant_id: string;
  name: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  ministry?: string;
  position?: string;
  joined_at: string;
}

// Legal Module
export interface LegalProcess {
  id: string;
  tenant_id: string;
  process_number: string;
  court: string;
  tribunal: string;
  status: string;
  client_id: string;
  honorary_value: number;
}

export interface CreditCard {
  id: string;
  tenant_id: string;
  card_name: string;
  bank_name: string;
  limit_amount: number;
  current_spent: number;
  due_day: number;
  closing_day: number;
  created_at: string;
}

