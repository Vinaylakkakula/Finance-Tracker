'use strict';

import { Customer, Loan, Installment, Payment } from '@/types/database';

export const exportToCSV = (filename: string, headers: string[], rows: string[][]) => {
  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateCollectionsCSV = (payments: Payment[], loans: Loan[], customers: Customer[]) => {
  const headers = ['Payment Date', 'Loan ID', 'Borrower Name', 'Paid Amount (INR)', 'Principal Portion', 'Interest Portion', 'Payment Method', 'Notes'];
  const rows = payments.map(pay => {
    const loan = loans.find(l => l.id === pay.loan_id);
    const cust = customers.find(c => c.id === loan?.customer_id);
    return [
      pay.payment_date,
      pay.loan_id,
      cust?.name || 'Unknown',
      pay.amount.toString(),
      pay.principal_paid.toString(),
      pay.interest_paid.toString(),
      pay.payment_method,
      pay.notes || ''
    ];
  });
  exportToCSV('Collections_Report', headers, rows);
};

export const generateLoansCSV = (loans: Loan[], customers: Customer[]) => {
  const headers = ['Loan ID', 'Borrower Name', 'Principal (INR)', 'Interest Rate (%)', 'Interest Type', 'Loan Date', 'Due Date', 'Status'];
  const rows = loans.map(loan => {
    const cust = customers.find(c => c.id === loan.customer_id);
    return [
      loan.id,
      cust?.name || 'Unknown',
      loan.principal.toString(),
      loan.interest_rate.toString(),
      loan.interest_type,
      loan.loan_date,
      loan.due_date,
      loan.status
    ];
  });
  exportToCSV('Loans_Summary_Report', headers, rows);
};
