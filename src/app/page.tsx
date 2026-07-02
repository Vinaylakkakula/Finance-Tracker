'use client';

import { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import { Customer, Loan, Installment, Payment } from '@/types/database';
import { 
  TrendingUp, 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  CalendarDays,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  useEffect(() => {
    setIsMounted(true);
    const loadData = async () => {
      const l = await dbService.getLoans();
      const insts = await dbService.getAllInstallments();
      const p = await dbService.getPayments();
      const c = await dbService.getCustomers();
      
      setLoans(l);
      setInstallments(insts);
      setPayments(p);
      setCustomers(c);
    };
    loadData();
  }, []);

  if (!isMounted) return null;

  // Compute metrics
  const totalLent = loans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);
  const totalInterestEarned = payments.reduce((sum, pay) => sum + pay.interest_paid, 0);
  
  // Outstanding pending calculation
  const totalInstallmentTotal = installments.reduce((sum, inst) => sum + inst.total, 0);
  const totalPaidInstallments = installments.reduce((sum, inst) => sum + inst.paid_amount, 0);
  const pendingAmount = Math.max(0, totalInstallmentTotal - totalPaidInstallments);

  // Loan statuses
  const activeLoans = loans.filter(l => l.status === 'Active');
  const closedLoans = loans.filter(l => l.status === 'Closed');
  const overdueLoans = loans.filter(l => l.status === 'Overdue');

  // Reminders / Dues
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM

  const dueTodayList = installments.filter(inst => inst.due_date === todayStr && inst.status !== 'Paid');
  const dueThisMonthList = installments.filter(inst => inst.due_date.startsWith(thisMonthStr) && inst.status !== 'Paid');

  const dueTodaySum = dueTodayList.reduce((sum, inst) => sum + (inst.total - inst.paid_amount), 0);
  const dueThisMonthSum = dueThisMonthList.reduce((sum, inst) => sum + (inst.total - inst.paid_amount), 0);

  // Chart 1: Monthly Collections & Interest (Area Chart)
  // Let's aggregate payments by month for last 6 months
  const monthlyDataMap: Record<string, { month: string; collected: number; interest: number }> = {};
  
  // Pre-populate last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mStr = d.toISOString().substring(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    monthlyDataMap[mStr] = { month: label, collected: 0, interest: 0 };
  }

  payments.forEach(pay => {
    const mStr = pay.payment_date.substring(0, 7);
    if (monthlyDataMap[mStr]) {
      monthlyDataMap[mStr].collected += pay.amount;
      monthlyDataMap[mStr].interest += pay.interest_paid;
    }
  });

  const chartData = Object.values(monthlyDataMap);

  // Chart 2: Paid vs Pending (Pie Chart)
  const paidPendingData = [
    { name: 'Collected', value: totalCollected, color: '#10b981' },
    { name: 'Pending', value: pendingAmount, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6 pb-6">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Total Lent Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 flex flex-col justify-between glow-indigo"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-indigo-400 font-medium">TOTAL LENT</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">₹{totalLent.toLocaleString('en-IN')}</h2>
            <span className="text-[10px] text-slate-400">{loans.length} Loans issued</span>
          </div>
        </motion.div>

        {/* Total Collected Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4 flex flex-col justify-between glow-emerald"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-emerald-400 font-medium">COLLECTED</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">₹{totalCollected.toLocaleString('en-IN')}</h2>
            <span className="text-[10px] text-slate-400">₹{totalInterestEarned.toLocaleString('en-IN')} Interest</span>
          </div>
        </motion.div>

        {/* Outstanding Pending Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4 flex flex-col justify-between glow-cyan"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-cyan-400 font-medium">PENDING AMOUNT</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">₹{pendingAmount.toLocaleString('en-IN')}</h2>
            <span className="text-[10px] text-slate-400">Total remaining balance</span>
          </div>
        </motion.div>

        {/* Total Interest Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-4 flex flex-col justify-between glow-cyan"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-amber-400 font-medium">INTEREST REVENUE</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">₹{totalInterestEarned.toLocaleString('en-IN')}</h2>
            <span className="text-[10px] text-slate-400">Earned and processed</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Status Pill Info */}
      <div className="flex justify-between items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/5">
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-slate-400">Active</span>
          <span className="text-sm font-bold text-emerald-400">{activeLoans.length}</span>
        </div>
        <div className="w-[1px] h-6 bg-white/10" />
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-slate-400">Closed</span>
          <span className="text-sm font-bold text-slate-400">{closedLoans.length}</span>
        </div>
        <div className="w-[1px] h-6 bg-white/10" />
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-slate-400">Overdue</span>
          <span className="text-sm font-bold text-rose-500">{overdueLoans.length}</span>
        </div>
      </div>

      {/* Due Alert Reminder Banner */}
      {(dueTodaySum > 0 || dueThisMonthSum > 0) && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col space-y-3"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-amber-200 text-sm">Payment Dues Alert</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-0.5">Due Today</span>
              <span className="font-bold text-sm text-rose-400">₹{dueTodaySum.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{dueTodayList.length} Installments</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-0.5">Due This Month</span>
              <span className="font-bold text-sm text-amber-400">₹{dueThisMonthSum.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{dueThisMonthList.length} Installments</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Monthly Collection Chart */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-4 text-slate-200">Monthly Collections & Interest</h3>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="collected" name="Total Collected" stroke="#06b6d4" fillOpacity={1} fill="url(#colGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="interest" name="Interest Collected" stroke="#f59e0b" fillOpacity={1} fill="url(#intGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Paid vs Pending Pie Chart & Distribution */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-slate-300">Paid vs Pending Ratio</h3>
          <div className="h-28 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paidPendingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={38}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paidPendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] text-slate-400">Paid</span>
              <span className="text-xs font-bold text-emerald-400">
                {totalCollected + pendingAmount > 0 
                  ? `${Math.round((totalCollected / (totalCollected + pendingAmount)) * 100)}%` 
                  : '0%'
                }
              </span>
            </div>
          </div>
          <div className="flex justify-between text-[10px]">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 block" />
              <span className="text-slate-400">Paid</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 block" />
              <span className="text-slate-400">Pending</span>
            </div>
          </div>
        </div>

        {/* Loan Type Distribution List */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-slate-300">Interest Type Mix</h3>
          <div className="space-y-2 py-1">
            {['Simple', 'Compound', 'Flat', 'Reducing'].map(type => {
              const count = loans.filter(l => l.interest_type === type).length;
              const pct = loans.length > 0 ? Math.round((count / loans.length) * 100) : 0;
              return (
                <div key={type} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-12 bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-semibold text-slate-200">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
    </div>
  );
}
