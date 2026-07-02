import { createClient } from '@supabase/supabase-js';
import { Customer, Loan, Installment, Payment, CustomerDocument, AppSettings } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;
export const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Initial Mock Data
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Aditya Verma',
    phone: '9876543210',
    whatsapp: '9876543210',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, KA - 560103',
    notes: 'Frequent borrower. Prefers UPI transfers.',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    photo: '',
  },
  {
    id: 'cust-2',
    name: 'Priya Sharma',
    phone: '8765432109',
    whatsapp: '8765432109',
    address: 'No. 12, 4th Main, HSR Layout Sector 3, Bengaluru, KA - 560102',
    notes: 'Always pays on time. Working at Infosys.',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    photo: '',
  },
  {
    id: 'cust-3',
    name: 'Rohan Das',
    phone: '7654321098',
    whatsapp: '7654321098',
    address: 'Sree Nilaya, Electronic City Phase 1, Bengaluru, KA - 560100',
    notes: 'Small business owner (Grocery Store). Needs follow up.',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    photo: '',
  }
];

const INITIAL_LOANS: Loan[] = [
  {
    id: 'LN-1001',
    customer_id: 'cust-1',
    principal: 100000,
    interest_rate: 12,
    interest_type: 'Simple',
    loan_date: '2026-05-01',
    due_date: '2026-10-31',
    duration_months: 6,
    frequency: 'Monthly',
    status: 'Active',
    notes: 'Personal loan for home renovation.',
    created_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 'LN-1002',
    customer_id: 'cust-2',
    principal: 50000,
    interest_rate: 15,
    interest_type: 'Flat',
    loan_date: '2026-06-01',
    due_date: '2026-08-31',
    duration_months: 3,
    frequency: 'Monthly',
    status: 'Active',
    notes: 'Salary advance for medical urgency.',
    created_at: '2026-06-01T11:00:00Z',
  },
  {
    id: 'LN-1003',
    customer_id: 'cust-3',
    principal: 150000,
    interest_rate: 18,
    interest_type: 'Reducing',
    loan_date: '2026-03-01',
    due_date: '2026-08-31',
    duration_months: 6,
    frequency: 'Monthly',
    status: 'Overdue',
    notes: 'Business expansion loan.',
    created_at: '2026-03-01T09:00:00Z',
  }
];

// Generate simple mock installments
const generateMockInstallments = (): Installment[] => {
  const installments: Installment[] = [];
  
  // LN-1001: 6 Months, Simple Interest (12% per year = 1% per month)
  // Principal: 100000, Monthly Simple: Principal/6 + Principal * 0.01 = 16,666.67 + 1000 = 17,666.67
  // Paid: May, June. Pending: July, Aug, Sept, Oct.
  for (let i = 1; i <= 6; i++) {
    const isPaid = i <= 2;
    installments.push({
      id: `inst-1-${i}`,
      loan_id: 'LN-1001',
      installment_no: i,
      due_date: `2026-0${5 + i}-01`,
      principal: Math.round(100000 / 6),
      interest: 1000,
      total: Math.round(100000 / 6) + 1000,
      paid_amount: isPaid ? Math.round(100000 / 6) + 1000 : 0,
      status: isPaid ? 'Paid' : 'Pending',
      paid_date: isPaid ? `2026-0${5 + i}-01` : undefined,
    });
  }

  // LN-1002: 3 Months, Flat Interest (15% flat per year = 1.25% per month)
  // Principal: 50000, Interest: 50000 * 0.15 * (3/12) = 1875. Total: 51875. EMI: 17291.67
  // Paid: June. Pending: July, August.
  for (let i = 1; i <= 3; i++) {
    const isPaid = i <= 1;
    installments.push({
      id: `inst-2-${i}`,
      loan_id: 'LN-1002',
      installment_no: i,
      due_date: `2026-0${6 + i}-01`,
      principal: Math.round(50000 / 3),
      interest: Math.round(1875 / 3),
      total: Math.round(51875 / 3),
      paid_amount: isPaid ? Math.round(51875 / 3) : 0,
      status: isPaid ? 'Paid' : 'Pending',
      paid_date: isPaid ? `2026-06-30` : undefined,
    });
  }

  // LN-1003: 6 Months, Reducing Balance (18% annual = 1.5% monthly)
  // Principal: 150000.
  // Overdue status: paid March, April. May, June overdue.
  const r = 0.015;
  let balance = 150000;
  // EMI standard formula: P * r * (1+r)^n / ((1+r)^n - 1) = 150000 * 0.015 * (1.015)^6 / ((1.015)^6 - 1) = 26339
  const emi = 26339;
  for (let i = 1; i <= 6; i++) {
    const interest = Math.round(balance * r);
    const principal = emi - interest;
    balance -= principal;
    const isPaid = i <= 2;
    const isOverdue = i > 2 && new Date(`2026-0${3 + i}-01`) < new Date('2026-07-01');
    installments.push({
      id: `inst-3-${i}`,
      loan_id: 'LN-1003',
      installment_no: i,
      due_date: `2026-0${3 + i}-01`,
      principal: Math.round(principal),
      interest: Math.round(interest),
      total: emi,
      paid_amount: isPaid ? emi : 0,
      status: isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending',
      paid_date: isPaid ? `2026-0${3 + i}-01` : undefined,
    });
  }

  return installments;
};

const INITIAL_INSTALLMENTS = generateMockInstallments();

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    loan_id: 'LN-1001',
    installment_id: 'inst-1-1',
    payment_date: '2026-06-01',
    amount: 17667,
    principal_paid: 16667,
    interest_paid: 1000,
    balance_remaining: 83333,
    payment_method: 'UPI',
    notes: 'First installment paid via GPay',
  },
  {
    id: 'pay-2',
    loan_id: 'LN-1001',
    installment_id: 'inst-1-2',
    payment_date: '2026-07-01',
    amount: 17667,
    principal_paid: 16667,
    interest_paid: 1000,
    balance_remaining: 66666,
    payment_method: 'UPI',
    notes: 'Second installment paid',
  },
  {
    id: 'pay-3',
    loan_id: 'LN-1002',
    installment_id: 'inst-2-1',
    payment_date: '2026-06-30',
    amount: 17292,
    principal_paid: 16667,
    interest_paid: 625,
    balance_remaining: 33333,
    payment_method: 'Bank Transfer',
    notes: 'First installment salary advance',
  },
  {
    id: 'pay-4',
    loan_id: 'LN-1003',
    installment_id: 'inst-3-1',
    payment_date: '2026-04-01',
    amount: 26339,
    principal_paid: 24089,
    interest_paid: 2250,
    balance_remaining: 125911,
    payment_method: 'Cash',
    notes: 'Paid in cash at shop',
  },
  {
    id: 'pay-5',
    loan_id: 'LN-1003',
    installment_id: 'inst-3-2',
    payment_date: '2026-05-01',
    amount: 26339,
    principal_paid: 24450,
    interest_paid: 1889,
    balance_remaining: 101461,
    payment_method: 'Cash',
    notes: 'Paid in cash',
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  currency: '₹',
  default_interest_rate: 12,
  theme: 'dark',
  backup_frequency: 'Manual',
};

// LocalStorage helpers
const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
};

const setLocalStorageData = <T>(key: string, data: T) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// Database Service Implementation
export const dbService = {
  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('customers').select('*').order('name');
      if (!error && data) return data;
    }
    return getLocalStorageData<Customer[]>('tracker_customers', INITIAL_CUSTOMERS);
  },

  async saveCustomer(customer: Customer): Promise<Customer> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('customers').upsert(customer).select().single();
      if (!error && data) return data;
    }
    const list = await this.getCustomers();
    const index = list.findIndex(c => c.id === customer.id);
    if (index > -1) {
      list[index] = customer;
    } else {
      list.push(customer);
    }
    setLocalStorageData('tracker_customers', list);
    return customer;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) return true;
    }
    const list = await this.getCustomers();
    const filtered = list.filter(c => c.id !== id);
    setLocalStorageData('tracker_customers', filtered);

    // Clean up related loans
    const loans = await this.getLoans();
    for (const loan of loans) {
      if (loan.customer_id === id) {
        await this.deleteLoan(loan.id);
      }
    }
    return true;
  },

  // --- Loans ---
  async getLoans(): Promise<Loan[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('loans').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalStorageData<Loan[]>('tracker_loans', INITIAL_LOANS);
  },

  async saveLoan(loan: Loan, installments?: Installment[]): Promise<Loan> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('loans').upsert(loan).select().single();
      if (!error && data) {
        if (installments && installments.length > 0) {
          await supabase.from('installments').delete().eq('loan_id', loan.id);
          await supabase.from('installments').insert(installments);
        }
        return data;
      }
    }
    const list = await this.getLoans();
    const index = list.findIndex(l => l.id === loan.id);
    if (index > -1) {
      list[index] = loan;
    } else {
      list.push(loan);
    }
    setLocalStorageData('tracker_loans', list);

    if (installments && installments.length > 0) {
      const allInst = await this.getAllInstallments();
      const filteredInst = allInst.filter(i => i.loan_id !== loan.id);
      setLocalStorageData('tracker_installments', [...filteredInst, ...installments]);
    }
    return loan;
  },

  async deleteLoan(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('loans').delete().eq('id', id);
      if (!error) return true;
    }
    const list = await this.getLoans();
    const filtered = list.filter(l => l.id !== id);
    setLocalStorageData('tracker_loans', filtered);

    // Clean up installments & payments
    const allInst = await this.getAllInstallments();
    setLocalStorageData('tracker_installments', allInst.filter(i => i.loan_id !== id));

    const allPayments = await this.getPayments();
    setLocalStorageData('tracker_payments', allPayments.filter(p => p.loan_id !== id));

    return true;
  },

  // --- Installments ---
  async getAllInstallments(): Promise<Installment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('installments').select('*').order('due_date');
      if (!error && data) return data;
    }
    return getLocalStorageData<Installment[]>('tracker_installments', INITIAL_INSTALLMENTS);
  },

  async getLoanInstallments(loanId: string): Promise<Installment[]> {
    const list = await this.getAllInstallments();
    return list.filter(i => i.loan_id === loanId).sort((a, b) => a.installment_no - b.installment_no);
  },

  async saveInstallment(installment: Installment): Promise<Installment> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('installments').upsert(installment).select().single();
      if (!error && data) return data;
    }
    const list = await this.getAllInstallments();
    const index = list.findIndex(i => i.id === installment.id);
    if (index > -1) {
      list[index] = installment;
    } else {
      list.push(installment);
    }
    setLocalStorageData('tracker_installments', list);
    return installment;
  },

  // --- Payments ---
  async getPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
      if (!error && data) return data;
    }
    return getLocalStorageData<Payment[]>('tracker_payments', INITIAL_PAYMENTS);
  },

  async getLoanPayments(loanId: string): Promise<Payment[]> {
    const list = await this.getPayments();
    return list.filter(p => p.loan_id === loanId);
  },

  async addPayment(payment: Payment): Promise<Payment> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('payments').insert(payment).select().single();
      if (!error && data) return data;
    }
    const list = await this.getPayments();
    list.unshift(payment);
    setLocalStorageData('tracker_payments', list);
    return payment;
  },

  // --- Documents ---
  async getDocuments(customerId: string): Promise<CustomerDocument[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('documents').select('*').eq('customer_id', customerId);
      if (!error && data) return data;
    }
    const allDocs = getLocalStorageData<CustomerDocument[]>('tracker_documents', []);
    return allDocs.filter(d => d.customer_id === customerId);
  },

  async saveDocument(doc: CustomerDocument): Promise<CustomerDocument> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('documents').insert(doc).select().single();
      if (!error && data) return data;
    }
    const allDocs = getLocalStorageData<CustomerDocument[]>('tracker_documents', []);
    allDocs.push(doc);
    setLocalStorageData('tracker_documents', allDocs);
    return doc;
  },

  async deleteDocument(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (!error) return true;
    }
    const allDocs = getLocalStorageData<CustomerDocument[]>('tracker_documents', []);
    const filtered = allDocs.filter(d => d.id !== id);
    setLocalStorageData('tracker_documents', filtered);
    return true;
  },

  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      if (!error && data) return data;
    }
    return getLocalStorageData<AppSettings>('tracker_settings', DEFAULT_SETTINGS);
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('settings').upsert(settings).select().single();
      if (!error && data) return data;
    }
    setLocalStorageData('tracker_settings', settings);
    return settings;
  },

  // --- Backup / Restore ---
  async exportBackup(): Promise<string> {
    const data = {
      customers: await this.getCustomers(),
      loans: await this.getLoans(),
      installments: await this.getAllInstallments(),
      payments: await this.getPayments(),
      documents: getLocalStorageData<CustomerDocument[]>('tracker_documents', []),
      settings: await this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  },

  async importBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (data.customers) setLocalStorageData('tracker_customers', data.customers);
      if (data.loans) setLocalStorageData('tracker_loans', data.loans);
      if (data.installments) setLocalStorageData('tracker_installments', data.installments);
      if (data.payments) setLocalStorageData('tracker_payments', data.payments);
      if (data.documents) setLocalStorageData('tracker_documents', data.documents);
      if (data.settings) setLocalStorageData('tracker_settings', data.settings);
      return true;
    } catch {
      return false;
    }
  }
};
