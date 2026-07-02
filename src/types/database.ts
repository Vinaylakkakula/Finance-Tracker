export type InterestType = 'Simple' | 'Compound' | 'Flat' | 'Reducing';
export type PaymentFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'Custom';
export type LoanStatus = 'Active' | 'Closed' | 'Overdue';
export type InstallmentStatus = 'Paid' | 'Partial' | 'Pending' | 'Overdue';
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  photo?: string; // base64 or URL
  notes?: string;
  created_at: string;
}

export interface Loan {
  id: string; // Auto-generated e.g., LN-1001
  customer_id: string;
  principal: number;
  interest_rate: number; // percentage (annual or monthly, usually annual)
  interest_type: InterestType;
  loan_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  duration_months: number;
  frequency: PaymentFrequency;
  status: LoanStatus;
  notes?: string;
  created_at: string;
}

export interface Installment {
  id: string;
  loan_id: string;
  installment_no: number;
  due_date: string;
  principal: number;
  interest: number;
  total: number;
  paid_amount: number;
  status: InstallmentStatus;
  paid_date?: string;
}

export interface Payment {
  id: string;
  loan_id: string;
  installment_id: string;
  payment_date: string;
  amount: number;
  principal_paid: number;
  interest_paid: number;
  balance_remaining: number;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface CustomerDocument {
  id: string;
  customer_id: string;
  file_name: string;
  file_type: string; // e.g. 'Aadhaar Card', 'PAN Card', 'Cheque', etc.
  file_url: string; // base64 data URL or Supabase storage URL
  uploaded_at: string;
}

export interface AppSettings {
  currency: string; // Default: '₹'
  default_interest_rate: number; // Default interest rate for new loans
  theme: 'light' | 'dark';
  backup_frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Manual';
}
