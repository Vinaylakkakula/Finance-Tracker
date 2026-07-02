'use client';

import { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import { AppSettings } from '@/types/database';
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Moon, 
  Sun, 
  DollarSign, 
  TrendingUp, 
  Info,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [defaultRate, setDefaultRate] = useState(12);
  const [currency, setCurrency] = useState('₹');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [backupFreq, setBackupFreq] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Manual'>('Manual');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await dbService.getSettings();
    setSettings(s);
    setDefaultRate(s.default_interest_rate);
    setCurrency(s.currency);
    setTheme(s.theme);
    setBackupFreq(s.backup_frequency);
  };

  const handleSave = async () => {
    if (!settings) return;
    const updated: AppSettings = {
      currency,
      default_interest_rate: defaultRate,
      theme,
      backup_frequency: backupFreq
    };
    await dbService.saveSettings(updated);
    alert('Settings updated successfully!');
  };

  const handleExportBackup = async () => {
    const jsonStr = await dbService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LendTracker_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const success = await dbService.importBackup(reader.result as string);
        if (success) {
          alert('Database restored successfully! Reloading...');
          window.location.reload();
        } else {
          alert('Failed to restore backup. Check if file is valid JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearDatabase = async () => {
    if (confirm('CAUTION: Are you sure you want to clear the local database? This will delete all customers, loans, payments, and settings, and reset the app. We suggest downloading a backup first.')) {
      localStorage.clear();
      alert('Database cleared successfully. Reloading...');
      window.location.reload();
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 pb-6">
      
      {/* Title */}
      <h2 className="text-xl font-bold text-slate-100">Settings</h2>

      {/* General Settings Card */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>Preference Config</span>
        </h3>

        {/* Currency & Interest */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Default Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="₹">INR (₹)</option>
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Default Rate (% p.a.)</label>
            <input
              type="number"
              value={defaultRate}
              onChange={e => setDefaultRate(Number(e.target.value))}
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Theme & Backup freq */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">App Theme</label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value as any)}
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="dark">Premium Dark</option>
              <option value="light">Standard Light</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Backup Interval</label>
            <select
              value={backupFreq}
              onChange={e => setBackupFreq(e.target.value as any)}
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="Manual">Manual Backups</option>
              <option value="Daily">Daily Auto (Sync)</option>
              <option value="Weekly">Weekly Auto (Sync)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/10"
        >
          Save Preferences
        </button>
      </div>

      {/* Backup and Restore */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Backup & Sync</span>
        </h3>

        <div className="space-y-2.5">
          {/* Export JSON */}
          <button
            onClick={handleExportBackup}
            className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-semibold transition text-slate-200"
          >
            <span className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Local DB Backup</span>
            </span>
            <span className="text-[10px] text-slate-400">JSON Format</span>
          </button>

          {/* Import JSON */}
          <label className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-semibold transition text-slate-200 cursor-pointer">
            <span className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Restore DB from Backup</span>
            </span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            <span className="text-[10px] text-slate-400">Upload JSON</span>
          </label>
        </div>
      </div>

      {/* Clear Database (Safety first) */}
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-start space-x-3">
          <Trash2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-200 uppercase tracking-wider">Danger Zone</h4>
            <p className="text-[10px] text-rose-300 mt-1">
              Clearing the database deletes all customer records, payments, and histories permanently. There is no undo.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearDatabase}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/10"
        >
          Erase All Data
        </button>
      </div>

      {/* About App */}
      <div className="flex items-start space-x-2 bg-white/5 border border-white/5 rounded-2xl p-4 text-[10px] text-slate-400">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          LendTracker is designed as a secure personal utility dashboard. All data is stored locally in your browser using secure LocalStorage databases unless a Supabase connection has been established.
        </p>
      </div>

    </div>
  );
}
