'use client';

import { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import { Customer } from '@/types/database';
import { Search, Plus, UserPlus, Phone, MessageCircle, MoreVertical, X, Trash2, Edit2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const list = await dbService.getCustomers();
    setCustomers(list);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setWhatsapp('');
    setAddress('');
    setNotes('');
    setPhoto('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setWhatsapp(c.whatsapp);
    setAddress(c.address);
    setNotes(c.notes || '');
    setPhoto(c.photo || '');
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const id = editingCustomer ? editingCustomer.id : `cust-${Date.now()}`;
    const newCustomer: Customer = {
      id,
      name,
      phone,
      whatsapp,
      address,
      notes,
      photo,
      created_at: editingCustomer ? editingCustomer.created_at : new Date().toISOString()
    };

    await dbService.saveCustomer(newCustomer);
    setIsModalOpen(false);
    loadCustomers();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer? All their loans, installments, and payments will be deleted permanently.')) {
      await dbService.deleteCustomer(id);
      loadCustomers();
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6 pb-6 relative">
      
      {/* Title & Action */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-100">Customers</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer</span>
        </motion.button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile number..."
          className="w-full bg-[#111827]/70 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              
              {/* Profile details */}
              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => window.location.href = `/customers/${c.id}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                  {c.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-cyan-400">{c.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm hover:underline">{c.name}</h3>
                  <span className="text-xs text-slate-400 block mt-0.5">{c.phone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-1">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/5 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Address */}
            {c.address && (
              <div className="flex items-start space-x-1.5 mt-3 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-500 shrink-0" />
                <span className="line-clamp-1">{c.address}</span>
              </div>
            )}

            {/* Quick Actions (Call, WhatsApp, Details) */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5">
              <a
                href={`tel:${c.phone}`}
                className="flex items-center justify-center space-x-1 bg-white/5 hover:bg-cyan-500/10 text-cyan-400 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
              <a
                href={`https://wa.me/91${c.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1 bg-white/5 hover:bg-emerald-500/10 text-emerald-400 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`/customers/${c.id}`}
                className="flex items-center justify-center bg-white/5 hover:bg-indigo-500/10 text-indigo-400 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <span>View Details</span>
              </a>
            </div>
          </motion.div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No customers found. Click &quot;Add Customer&quot; to register a new client.
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-3xl w-full max-w-sm p-6 overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10 shrink-0">
                <h3 className="text-base font-bold text-slate-100">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar space-y-4 py-4 pr-1">
                
                {/* Photo Selector */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-cyan-500/50 relative group">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-cyan-400">{name ? name.charAt(0).toUpperCase() : '?'}</span>
                    )}
                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] text-white font-semibold">
                      UPLOAD
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                    }}
                    placeholder="Enter customer name"
                    className="w-full bg-[#111827]/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (!whatsapp) setWhatsapp(e.target.value); // Sync automatically
                    }}
                    placeholder="Enter phone number"
                    className="w-full bg-[#111827]/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Enter WhatsApp number"
                    className="w-full bg-[#111827]/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter address details"
                    rows={2}
                    className="w-full bg-[#111827]/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Customer Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g. reference person details, payment preferences"
                    rows={2}
                    className="w-full bg-[#111827]/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/10"
                  >
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
