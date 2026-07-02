import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/ui/BottomNav';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
});

export const viewport = {
  themeColor: '#090b11',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'LendTracker Premium',
  description: 'Personal Loan & Interest Finance Tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LendTracker',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} dark h-full antialiased`}>
      <body className="h-full bg-[#030712] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="min-h-screen max-w-md mx-auto bg-gradient-to-b from-[#111827] to-[#090b11] shadow-2xl relative flex flex-col pb-24 border-x border-white/5">
          
          {/* Global Header Banner */}
          <header className="px-6 pt-5 pb-4 flex justify-between items-center border-b border-white/5">
            <div>
              <span className="text-xs text-cyan-400 font-semibold tracking-wider uppercase">LENDTRACKER</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                My Finance Hub
              </h1>
            </div>
            
            {/* Quick Profile Image */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 p-[1.5px] cursor-pointer">
              <div className="w-full h-full bg-[#0d111c] rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-cyan-300">ADMIN</span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pt-4 overflow-y-auto no-scrollbar">
            {children}
          </main>

          <BottomNav />
        </div>
      </body>
    </html>
  );
}
