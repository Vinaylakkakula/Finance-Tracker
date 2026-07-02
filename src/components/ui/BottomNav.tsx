'use strict';
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, IndianRupee, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Loans', icon: IndianRupee, href: '/loans' },
  { label: 'Reports', icon: BarChart3, href: '/reports' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav py-2 px-4 shadow-lg border-t border-white/5 md:max-w-md md:mx-auto md:bottom-4 md:rounded-2xl md:border">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center flex-1 py-1 group">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`relative z-10 flex flex-col items-center justify-center transition-colors duration-200 ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </motion.div>

              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 bg-cyan-500/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
