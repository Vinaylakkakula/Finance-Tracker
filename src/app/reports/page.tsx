'use client';

import { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import { Customer, Loan, Payment, Installment } from '@/types/database';
import { generateCollectionsCSV, generateLoansCSV } from '@/utils/reports';
import { 
  FileSpreadsheet, 
  Printer, 
  Share2, 
  Mail, 
  MessageSquare,
  Calendar,
  IndianRupee,
  ChevronDown,
  Clock,
  CheckCircle,
  BarChart,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  
  // Filter settings
  const [range, setRange] = useState<'daily' | 'monthly' | '3months' | '6months' | 'yearly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoans(await dbService.getLoans());
      setPayments(await dbService.getPayments());
      setCustomers(await dbService.getCustomers());
      setInstallments(await dbService.getAllInstallments());
    };
    load();
  }, []);

  // Compute filter dates
  const getFilterRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'daily') {
      start.setHours(0, 0, 0, 0);
    } else if (range === 'monthly') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (range === '3months') {
      start.setMonth(now.getMonth() - 3);
    } else if (range === '6months') {
      start.setMonth(now.getMonth() - 6);
    } else if (range === 'yearly') {
      start.setMonth(0);
      start.setDate(1);
    } else if (range === 'custom') {
      if (startDate) start = new Date(startDate);
      if (endDate) end = new Date(endDate);
    }

    return { start, end };
  };

  const { start, end } = getFilterRange();

  // Filtered lists
  const filteredPayments = payments.filter(p => {
    const date = new Date(p.payment_date);
    if (range === 'custom') {
      return (!startDate || date >= start) && (!endDate || date <= end);
    }
    return date >= start;
  });

  const filteredLoans = loans.filter(l => {
    const date = new Date(l.loan_date);
    if (range === 'custom') {
      return (!startDate || date >= start) && (!endDate || date <= end);
    }
    return date >= start;
  });

  // Financial Metrics for the range
  const totalDisbursed = filteredLoans.reduce((sum, l) => sum + l.principal, 0);
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const interestCollected = filteredPayments.reduce((sum, p) => sum + p.interest_paid, 0);
  const principalCollected = filteredPayments.reduce((sum, p) => sum + p.principal_paid, 0);

  const handleWhatsAppShare = () => {
    const text = `*Financial Report Summary*\nRange: ${range.toUpperCase()}\nTotal Disbursed: ₹${totalDisbursed.toLocaleString('en-IN')}\nTotal Collected: ₹${totalCollected.toLocaleString('en-IN')}\nInterest Realized: ₹${interestCollected.toLocaleString('en-IN')}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = `Financial Report Summary - ${new Date().toLocaleDateString()}`;
    const body = `Hi,\n\nHere is the financial summary for ${range}:\n\nTotal Disbursed: INR ${totalDisbursed}\nTotal Collected: INR ${totalCollected}\nInterest Realized: INR ${interestCollected}\n\nRegards.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-6 pb-6 print:p-0 print:bg-white print:text-black">
      
      {/* Title */}
      <h2 className="text-xl font-bold text-slate-100 print:hidden">Reports & Exports</h2>

      {/* Filter Options */}
      <div className="glass-card rounded-2xl p-4 space-y-3 print:hidden">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium">Select Time Range</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1"
          >
            <option value="daily">Today / Daily</option>
            <option value="monthly">This Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="yearly">This Year (Jan-Dec)</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 space-y-1 print:border print:border-black/20">
          <span className="text-[10px] text-slate-400 font-medium block">LOANS DISBURSED</span>
          <span className="text-sm font-bold text-slate-200">₹{totalDisbursed.toLocaleString('en-IN')}</span>
          <span className="text-[9px] text-slate-400 block">{filteredLoans.length} new contracts</span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-1 print:border print:border-black/20">
          <span className="text-[10px] text-slate-400 font-medium block">TOTAL COLLECTED</span>
          <span className="text-sm font-bold text-emerald-400">₹{totalCollected.toLocaleString('en-IN')}</span>
          <span className="text-[9px] text-slate-400 block">{filteredPayments.length} transactions</span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-1 print:border print:border-black/20">
          <span className="text-[10px] text-slate-400 font-medium block">INTEREST REALIZED</span>
          <span className="text-sm font-bold text-amber-400">₹{interestCollected.toLocaleString('en-IN')}</span>
          <span className="text-[9px] text-slate-400 block">Clean revenue</span>
        </div>

        <div className="glass-card rounded-2xl p-4 space-y-1 print:border print:border-black/20">
          <span className="text-[10px] text-slate-400 font-medium block">PRINCIPAL REALIZED</span>
          <span className="text-sm font-bold text-cyan-400">₹{principalCollected.toLocaleString('en-IN')}</span>
          <span className="text-[9px] text-slate-400 block">Capital recovery</span>
        </div>
      </div>

      {/* Export / Share Toolbar */}
      <div className="glass-card rounded-2xl p-4 space-y-3 print:hidden">
        <h4 className="text-xs font-bold text-slate-200">Export & Share Report</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => generateCollectionsCSV(filteredPayments, loans, customers)}
            className="flex items-center justify-center space-x-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 py-2 rounded-xl text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center space-x-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded-xl text-xs font-semibold transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleEmailShare}
            className="flex items-center justify-center space-x-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 py-2 rounded-xl text-xs font-semibold transition"
          >
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </button>
        </div>
      </div>

      {/* Payment Collections Timeline/List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider print:text-black">Recent Collections</h4>
        
        <div className="space-y-2">
          {filteredPayments.map(p => {
            const l = loans.find(item => item.id === p.loan_id);
            const c = customers.find(item => item.id === l?.customer_id);
            return (
              <div key={p.id} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex justify-between items-center print:border-black/10 print:text-black">
                <div>
                  <h5 className="text-xs font-semibold text-slate-200 print:text-black">{c?.name || 'Unknown'}</h5>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{p.payment_date} • {p.payment_method}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">Loan ID: {p.loan_id}</span>
                </div>
              </div>
            );
          })}

          {filteredPayments.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs bg-white/5 rounded-2xl">
              No transactions recorded in this range.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
