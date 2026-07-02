'use client';

import { useState, useEffect, use } from 'react';
import { dbService } from '@/services/db';
import { Customer, Loan, CustomerDocument, Installment, Payment } from '@/types/database';
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Plus, 
  FileText, 
  Trash2, 
  Download, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerProfilePage({ params }: PageProps) {
  const { id: customerId } = use(params);
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'loans' | 'documents' | 'notes'>('loans');
  const [notes, setNotes] = useState('');
  
  // Document uploading states
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Aadhaar Card');

  useEffect(() => {
    loadProfileData();
  }, [customerId]);

  const loadProfileData = async () => {
    const custs = await dbService.getCustomers();
    const found = custs.find(c => c.id === customerId);
    if (found) {
      setCustomer(found);
      setNotes(found.notes || '');
    }

    const allLoans = await dbService.getLoans();
    setLoans(allLoans.filter(l => l.customer_id === customerId));

    const docs = await dbService.getDocuments(customerId);
    setDocuments(docs);
  };

  const handleUpdateNotes = async () => {
    if (!customer) return;
    const updated = { ...customer, notes };
    await dbService.saveCustomer(updated);
    setCustomer(updated);
    alert('Notes saved successfully!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && customer) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const doc: CustomerDocument = {
          id: `doc-${Date.now()}`,
          customer_id: customerId,
          file_name: docName || file.name,
          file_type: docType,
          file_url: reader.result as string,
          uploaded_at: new Date().toISOString()
        };
        await dbService.saveDocument(doc);
        setDocName('');
        // Reload documents
        const docs = await dbService.getDocuments(customerId);
        setDocuments(docs);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Delete this document?')) {
      await dbService.deleteDocument(id);
      const docs = await dbService.getDocuments(customerId);
      setDocuments(docs);
    }
  };

  const downloadPDFReport = () => {
    // Basic browser print option or alert explaining download. 
    // In our actual implementation, we will have a unified report generator.
    window.print();
  };

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
        <span>Loading customer profile...</span>
      </div>
    );
  }

  // Calculate quick metrics for this customer
  const activeLoansList = loans.filter(l => l.status === 'Active');
  const overdueLoansList = loans.filter(l => l.status === 'Overdue');
  const totalLent = loans.reduce((sum, l) => sum + l.principal, 0);

  return (
    <div className="space-y-6 pb-6">
      
      {/* Back Button & PDF Export */}
      <div className="flex justify-between items-center">
        <Link href="/customers" className="flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
        
        <button
          onClick={downloadPDFReport}
          className="flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 text-xs px-3 py-1.5 rounded-xl border border-white/10 transition"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Profile Info Header */}
      <div className="glass-card rounded-3xl p-5 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 flex space-x-2">
          <a href={`tel:${customer.phone}`} className="p-2 bg-white/5 hover:bg-cyan-500/10 text-cyan-400 rounded-xl transition">
            <Phone className="w-4 h-4" />
          </a>
          <a href={`https://wa.me/91${customer.whatsapp}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-emerald-500/10 text-emerald-400 rounded-xl transition">
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>

        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 p-[1.5px] mb-3">
          <div className="w-full h-full bg-[#0d111c] rounded-2xl flex items-center justify-center overflow-hidden">
            {customer.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-extrabold text-cyan-400">{customer.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-100">{customer.name}</h2>
        <span className="text-xs text-slate-400 mt-1 block">{customer.phone}</span>

        {customer.address && (
          <div className="flex items-start justify-center space-x-1.5 mt-3 text-xs text-slate-400 max-w-xs">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{customer.address}</span>
          </div>
        )}
      </div>

      {/* Customer summary banner */}
      <div className="grid grid-cols-3 gap-2 bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
        <div>
          <span className="text-[10px] text-slate-400 block">Total Borrowed</span>
          <span className="text-sm font-bold text-indigo-400">₹{totalLent.toLocaleString('en-IN')}</span>
        </div>
        <div className="w-[1px] bg-white/10 my-1 self-stretch" />
        <div>
          <span className="text-[10px] text-slate-400 block">Active Loans</span>
          <span className="text-sm font-bold text-emerald-400">{activeLoansList.length}</span>
        </div>
        <div className="w-[1px] bg-white/10 my-1 self-stretch" />
        <div>
          <span className="text-[10px] text-slate-400 block">Overdue Loans</span>
          <span className="text-sm font-bold text-rose-500">{overdueLoansList.length}</span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-[#111827]/80 rounded-xl p-1 border border-white/5">
        <button
          onClick={() => setActiveTab('loans')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'loans' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Loans ({loans.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'documents' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'notes' ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Notes
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[200px]">
        {activeTab === 'loans' && (
          <div className="space-y-4">
            {loans.map(loan => (
              <Link href={`/loans?id=${loan.id}`} key={loan.id} className="block">
                <div className="glass-card rounded-2xl p-4 flex items-center justify-between hover:border-white/20 transition cursor-pointer">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold bg-white/10 text-slate-300 px-2 py-0.5 rounded-md">{loan.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        loan.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                        loan.status === 'Closed' ? 'bg-slate-500/10 text-slate-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {loan.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-200">
                      ₹{loan.principal.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">@ {loan.interest_rate}% ({loan.interest_type})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Issued: {loan.loan_date} | Due: {loan.due_date}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </Link>
            ))}

            {loans.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs bg-white/5 rounded-2xl border border-white/5">
                No loans active for this customer.
                <Link href="/loans" className="block text-cyan-400 mt-2 font-semibold hover:underline">
                  Create Loan now &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Document Upload Widget */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200">Upload Document</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Custom Doc Name"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="bg-[#0f172a] border border-white/10 rounded-xl px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Cheque Image">Cheque Image</option>
                  <option value="Agreement Paper">Agreement Paper</option>
                  <option value="Promissory Note">Promissory Note</option>
                  <option value="House Papers">House Papers</option>
                  <option value="Land Papers">Land Papers</option>
                  <option value="Electricity Bill">Electricity Bill</option>
                  <option value="Passport">Passport</option>
                  <option value="Salary Slip">Salary Slip</option>
                  <option value="Other Documents">Other Documents</option>
                </select>
              </div>
              <label className="flex items-center justify-center border border-dashed border-white/20 rounded-xl py-3 hover:bg-white/5 transition cursor-pointer text-xs text-cyan-400 font-semibold">
                <Plus className="w-4 h-4 mr-1.5" />
                Select & Upload File
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{doc.file_name}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{doc.file_type} • {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <a 
                      href={doc.file_url} 
                      download={doc.file_name}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white/5 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {documents.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No documents uploaded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="glass-card rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-200">Edit Customer Notes</h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Store notes about trust, frequency, or references..."
              rows={6}
              className="w-full bg-[#111827]/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              onClick={handleUpdateNotes}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/10"
            >
              Save Notes
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
