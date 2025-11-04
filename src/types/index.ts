export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  due_date: string;
  status: 'paid' | 'pending';
  notes?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: number;
  year: number;
  limit_amount: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

export const CATEGORIES = [
  'Aluguel',
  'Luz',
  'Água',
  'Internet',
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Outros',
] as const;

export type Category = typeof CATEGORIES[number];