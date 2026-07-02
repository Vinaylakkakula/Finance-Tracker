'use client';

import { useState, useEffect, use } from 'react';
import { dbService } from '@/services/db';
import { Customer, Loan, Installment, Payment, InterestType, PaymentFrequency, LoanStatus, PaymentMethod } from '@/types/database';
import { 
  Plus, 
  Search, 
  Calculator, 
  Sparkles, 
  Calendar, 
  Check, 
  AlertTriangle, 
  Clock, 
  X, 
  ChevronRight, 
  PlusCircle, 
  QrCode,
  Smartphone,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function LoansPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'calculator'>('list');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanInstallments, setLoanInstallments] = useState<Installment[]>([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Calculator Form State
  const [calcCustomer, setCalcCustomer] = useState('');
  const [calcPrincipal, setCalcPrincipal] = useState<number>(50000);
  const [calcInterestRate, setCalcInterestRate] = useState<number>(12);
  const [calcInterestType, setCalcInterestType] = useState<InterestType>('Simple');
  const [calcDuration, setCalcDuration] = useState<number>(6);
  const [calcFrequency, setCalcFrequency] = useState<PaymentFrequency>('Monthly');
  const [calcLoanDate, setCalcLoanDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calcNotes, setCalcNotes] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('UPI');
  const [payNotes, setPayNotes] = useState('');
  
  // QR Code Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const custs = await dbService.getCustomers();
    setCustomers(custs);
    const l = await dbService.getLoans();
    setLoans(l);

    // Auto-select loan from query parameters if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const loanId = params.get('id');
      if (loanId) {
        const found = l.find(item => item.id === loanId);
        if (found) {
          setSelectedLoan(found);
          const insts = await dbService.getLoanInstallments(found.id);
          setLoanInstallments(insts);
        }
      }
    }
  };

  // ----------------------------------------------------
  // Live Loan Calculation Logic
  // ----------------------------------------------------
  const calculateLoanSchedule = (
    principal: number,
    ratePct: number,
    type: InterestType,
    duration: number,
    frequency: PaymentFrequency,
    startDateStr: string
  ) => {
    const installments: Omit<Installment, 'id' | 'loan_id'>[] = [];
    const startDate = new Date(startDateStr);
    
    // Adjust frequency multiplier
    let stepMonths = 1;
    if (frequency === 'Quarterly') stepMonths = 3;
    else if (frequency === 'Half-Yearly') stepMonths = 6;
    else if (frequency === 'Yearly') stepMonths = 12;

    const monthlyRate = (ratePct / 12) / 100;

    if (type === 'Simple' || type === 'Flat') {
      // Total simple interest: P * r * t (years)
      const interestRatePerMonth = (ratePct / 12) / 100;
      const totalInterest = Math.round(principal * interestRatePerMonth * duration);
      const totalAmount = principal + totalInterest;
      
      const emi = Math.round(totalAmount / duration);
      const principalStep = Math.round(principal / duration);
      const interestStep = Math.round(totalInterest / duration);

      for (let i = 1; i <= duration; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + i * stepMonths);
        
        installments.push({
          installment_no: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal: i === duration ? (principal - (principalStep * (duration - 1))) : principalStep,
          interest: i === duration ? (totalInterest - (interestStep * (duration - 1))) : interestStep,
          total: emi,
          paid_amount: 0,
          status: 'Pending',
        });
      }
    } else if (type === 'Compound') {
      // Compound Monthly
      const totalAmount = Math.round(principal * Math.pow(1 + monthlyRate, duration));
      const totalInterest = totalAmount - principal;
      const emi = Math.round(totalAmount / duration);
      const principalStep = Math.round(principal / duration);
      const interestStep = Math.round(totalInterest / duration);

      for (let i = 1; i <= duration; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + i * stepMonths);
        
        installments.push({
          installment_no: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal: i === duration ? (principal - (principalStep * (duration - 1))) : principalStep,
          interest: i === duration ? (totalInterest - (interestStep * (duration - 1))) : interestStep,
          total: emi,
          paid_amount: 0,
          status: 'Pending',
        });
      }
    } else if (type === 'Reducing') {
      // Standard reducing balance amortization
      // EMI = [P * r * (1+r)^n] / [(1+r)^n - 1]
      let emi = 0;
      if (monthlyRate > 0) {
        emi = Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1));
      } else {
        emi = Math.round(principal / duration);
      }

      let remainingBal = principal;
      for (let i = 1; i <= duration; i++) {
        const interest = Math.round(remainingBal * monthlyRate);
        const principalPaid = i === duration ? remainingBal : Math.round(emi - interest);
        
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + i * stepMonths);
        
        installments.push({
          installment_no: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal: principalPaid,
          interest,
          total: principalPaid + interest,
          paid_amount: 0,
          status: 'Pending',
        });
        remainingBal -= principalPaid;
      }
    }

    const totalInterest = installments.reduce((sum, item) => sum + item.interest, 0);
    const totalAmount = principal + totalInterest;
    const emi = installments[0] ? installments[0].total : 0;

    return {
      installments,
      emi,
      totalInterest,
      totalAmount
    };
  };

  const schedulePreview = calculateLoanSchedule(
    calcPrincipal,
    calcInterestRate,
    calcInterestType,
    calcDuration,
    calcFrequency,
    calcLoanDate
  );

  const handleIssueLoan = async () => {
    if (!calcCustomer) {
      alert('Please select a customer first!');
      return;
    }

    const loanId = `LN-${1000 + loans.length + 1}`;
    
    // Generate full due date (final installment date)
    const finalInstDate = schedulePreview.installments[schedulePreview.installments.length - 1].due_date;

    const newLoan: Loan = {
      id: loanId,
      customer_id: calcCustomer,
      principal: calcPrincipal,
      interest_rate: calcInterestRate,
      interest_type: calcInterestType,
      loan_date: calcLoanDate,
      due_date: finalInstDate,
      duration_months: calcDuration,
      frequency: calcFrequency,
      status: 'Active',
      notes: calcNotes,
      created_at: new Date().toISOString(),
    };

    const finalInstallments: Installment[] = schedulePreview.installments.map((inst, index) => ({
      ...inst,
      id: `inst-${loanId}-${index + 1}`,
      loan_id: loanId,
    }));

    await dbService.saveLoan(newLoan, finalInstallments);
    alert(`Loan ${loanId} created successfully!`);
    loadData();
    setActiveTab('list');
  };

  // ----------------------------------------------------
  // Installment Management / Actions
  // ----------------------------------------------------
  const handleSelectLoan = async (loan: Loan) => {
    setSelectedLoan(loan);
    const insts = await dbService.getLoanInstallments(loan.id);
    setLoanInstallments(insts);
  };

  const openPayModal = (inst: Installment) => {
    setSelectedInstallment(inst);
    setPayAmount(inst.total - inst.paid_amount);
    setPayNotes('');
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedInstallment || !selectedLoan) return;

    const amountPaid = payAmount;
    const isFull = amountPaid >= (selectedInstallment.total - selectedInstallment.paid_amount);
    
    // Calculate principal and interest ratio paid
    const remainingToPay = selectedInstallment.total - selectedInstallment.paid_amount;
    const ratio = Math.min(1, amountPaid / remainingToPay);
    
    const principalPaid = Math.round(selectedInstallment.principal * ratio);
    const interestPaid = Math.round(selectedInstallment.interest * ratio);

    const updatedInstallment: Installment = {
      ...selectedInstallment,
      paid_amount: selectedInstallment.paid_amount + amountPaid,
      status: isFull ? 'Paid' : 'Partial',
      paid_date: new Date().toISOString().split('T')[0]
    };

    // Calculate loan new balance
    const paymentsList = await dbService.getLoanPayments(selectedLoan.id);
    const totalPrincipalAlreadyPaid = paymentsList.reduce((sum, p) => sum + p.principal_paid, 0);
    const balanceRemaining = selectedLoan.principal - totalPrincipalAlreadyPaid - principalPaid;

    const paymentRecord: Payment = {
      id: `pay-${Date.now()}`,
      loan_id: selectedLoan.id,
      installment_id: selectedInstallment.id,
      payment_date: new Date().toISOString().split('T')[0],
      amount: amountPaid,
      principal_paid: principalPaid,
      interest_paid: interestPaid,
      balance_remaining: Math.max(0, balanceRemaining),
      payment_method: payMethod,
      notes: payNotes
    };

    await dbService.saveInstallment(updatedInstallment);
    await dbService.addPayment(paymentRecord);

    // Launch celebration confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });

    setIsPayModalOpen(false);
    
    // Reload installments & details
    const insts = await dbService.getLoanInstallments(selectedLoan.id);
    setLoanInstallments(insts);
    
    // Check if all installments are paid -> Close loan
    const allPaid = insts.every(i => i.status === 'Paid');
    if (allPaid) {
      const updatedLoan = { ...selectedLoan, status: 'Closed' as LoanStatus };
      await dbService.saveLoan(updatedLoan);
      setSelectedLoan(updatedLoan);
    }
    
    loadData();
  };

  const handleMarkPending = async (inst: Installment) => {
    if (!selectedLoan) return;
    const updated = { ...inst, status: 'Pending' as const, paid_amount: 0, paid_date: undefined };
    await dbService.saveInstallment(updated);
    
    // Refresh
    const insts = await dbService.getLoanInstallments(selectedLoan.id);
    setLoanInstallments(insts);
    loadData();
  };

  // Search & Filter List
  const filteredLoans = loans.filter(l => {
    const cust = customers.find(c => c.id === l.customer_id);
    const nameMatch = cust?.name.toLowerCase().includes(search.toLowerCase()) || false;
    const phoneMatch = cust?.phone.includes(search) || false;
    const loanIdMatch = l.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesSearch = nameMatch || phoneMatch || loanIdMatch;
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-6 relative">
      
      {/* Tab Selector */}
      <div className="flex bg-[#111827]/80 rounded-xl p-1 border border-white/5">
        <button
          onClick={() => { setActiveTab('list'); setSelectedLoan(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'list' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Loans
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'calculator' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Calculator / Issue
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Active Loans View */}
          {!selectedLoan ? (
            <div className="space-y-4">
              
              {/* Search / Filters */}
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search customer, ID..."
                    className="w-full bg-[#111827]/70 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0f172a] border border-white/10 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Loan Cards */}
              <div className="space-y-3">
                {filteredLoans.map(loan => {
                  const cust = customers.find(c => c.id === loan.customer_id);
                  return (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleSelectLoan(loan)}
                      className="glass-card rounded-2xl p-4 cursor-pointer hover:border-white/20 transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-md text-slate-300">{loan.id}</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                            loan.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                            loan.status === 'Closed' ? 'bg-slate-500/10 text-slate-400' :
                            'bg-rose-500/10 text-rose-400'
                          }`}>
                            {loan.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200">{cust?.name || 'Unknown'}</h4>
                        <div className="text-xs font-bold text-slate-300">
                          ₹{loan.principal.toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] font-normal text-slate-400">@ {loan.interest_rate}% ({loan.interest_type})</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </motion.div>
                  );
                })}

                {filteredLoans.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No loans match your search/filter.
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Loan Details view (interactive installment tracker)
            <div className="space-y-4">
              
              {/* Back to Loan list */}
              <button
                onClick={() => setSelectedLoan(null)}
                className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
                <span>Back to All Loans</span>
              </button>

              {/* Loan Details Banner */}
              <div className="glass-card rounded-3xl p-5 relative overflow-hidden">
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button 
                    onClick={() => setIsQrModalOpen(true)}
                    className="p-2 bg-white/5 hover:bg-cyan-500/10 text-cyan-400 rounded-xl transition"
                    title="Generate Payment QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-md text-slate-300">{selectedLoan.id}</span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">
                  {customers.find(c => c.id === selectedLoan.customer_id)?.name}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Principal</span>
                    <span className="font-bold text-sm text-slate-200">₹{selectedLoan.principal.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Interest Rate</span>
                    <span className="font-bold text-sm text-slate-200">{selectedLoan.interest_rate}% ({selectedLoan.interest_type})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Start Date</span>
                    <span className="font-medium text-slate-300">{selectedLoan.loan_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Due Date</span>
                    <span className="font-medium text-slate-300">{selectedLoan.due_date}</span>
                  </div>
                </div>
              </div>

              {/* Installment checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Installments Schedule</h4>
                
                <div className="space-y-2">
                  {loanInstallments.map((inst) => (
                    <div key={inst.id} className="bg-white/5 border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-400">#{inst.installment_no}</span>
                          <span className="text-[11px] text-slate-400">{inst.due_date}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          inst.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' :
                          inst.status === 'Partial' ? 'bg-amber-500/10 text-amber-400' :
                          inst.status === 'Overdue' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {inst.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-slate-400">Total Due: </span>
                          <span className="font-bold text-slate-200">₹{inst.total.toLocaleString('en-IN')}</span>
                        </div>
                        {inst.paid_amount > 0 && (
                          <div>
                            <span className="text-slate-400">Paid: </span>
                            <span className="font-bold text-emerald-400">₹{inst.paid_amount.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex space-x-2 pt-1">
                        {inst.status !== 'Paid' ? (
                          <>
                            <button
                              onClick={() => openPayModal(inst)}
                              className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-1 rounded-xl text-[10px] font-bold transition flex items-center justify-center space-x-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Collect Payment</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleMarkPending(inst)}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-1 rounded-xl text-[10px] font-bold transition"
                          >
                            Reset to Pending
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Live Loan Calculator Tab */
        <div className="space-y-6">
          
          <div className="glass-card rounded-2xl p-5 space-y-4">
            
            {/* Customer selector */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Select Borrower</label>
              <select
                value={calcCustomer}
                onChange={e => setCalcCustomer(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            {/* Principal and Interest rate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Loan Amount (₹)</label>
                <input
                  type="number"
                  value={calcPrincipal}
                  onChange={e => setCalcPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  value={calcInterestRate}
                  onChange={e => setCalcInterestRate(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Interest type and duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Interest Type</label>
                <select
                  value={calcInterestType}
                  onChange={e => setCalcInterestType(e.target.value as InterestType)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Simple">Simple Interest</option>
                  <option value="Compound">Compound Interest</option>
                  <option value="Flat">Flat Interest</option>
                  <option value="Reducing">Reducing Balance</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Duration (Months)</label>
                <input
                  type="number"
                  value={calcDuration}
                  onChange={e => setCalcDuration(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Freq and Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Payment Frequency</label>
                <select
                  value={calcFrequency}
                  onChange={e => setCalcFrequency(e.target.value as PaymentFrequency)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Every 3 Months</option>
                  <option value="Half-Yearly">Every 6 Months</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Start Date</label>
                <input
                  type="date"
                  value={calcLoanDate}
                  onChange={e => setCalcLoanDate(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Loan Notes</label>
              <textarea
                value={calcNotes}
                onChange={e => setCalcNotes(e.target.value)}
                placeholder="E.g. collateral notes, backup contact"
                rows={2}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Automatic Calculator Breakdown Live Preview */}
          <div className="bg-gradient-to-br from-cyan-900/30 to-indigo-900/30 border border-cyan-500/20 rounded-3xl p-5 space-y-4">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wide">Live Breakdown</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block">EMI / Installment</span>
                <span className="text-base font-extrabold text-cyan-300">₹{schedulePreview.emi.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Interest Amount</span>
                <span className="text-base font-extrabold text-amber-400">₹{schedulePreview.totalInterest.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Total Amount</span>
                <span className="text-base font-extrabold text-slate-200">₹{schedulePreview.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Final Due Date</span>
                <span className="text-sm font-semibold text-slate-300">
                  {schedulePreview.installments[schedulePreview.installments.length - 1]?.due_date || '-'}
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={handleIssueLoan}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Issue Loan & Create Schedule</span>
            </button>
          </div>

        </div>
      )}

      {/* Collect Payment Dialog */}
      <AnimatePresence>
        {isPayModalOpen && selectedInstallment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-3xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h3 className="text-sm font-bold text-slate-100">Collect Installment #{selectedInstallment.installment_no}</h3>
                <button onClick={() => setIsPayModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Payment Amount (₹)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1"
                  >
                    <option value="UPI">UPI (GPay/PhonePe)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Payment Notes</label>
                  <textarea
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    placeholder="Reference ID or cash handover person"
                    rows={2}
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleProcessPayment}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg"
              >
                Confirm Payment Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {isQrModalOpen && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-3xl w-full max-w-sm p-6 text-center space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h3 className="text-sm font-bold text-slate-100">Scan & Pay</h3>
                <button onClick={() => setIsQrModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block mx-auto">
                {/* Visual Representation of standard payment QR code */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=lender@upi%26pn=LendTracker%26am=0%26cu=INR`} 
                  alt="UPI QR Code" 
                  className="w-40 h-40"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Scan using Google Pay, PhonePe, or BHIM UPI.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
