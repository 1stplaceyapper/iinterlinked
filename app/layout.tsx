'use client'

import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Sembunyikan navbar jika berada di halaman login
  const isLoginPage = pathname === '/login'

  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#FAF8F5] text-slate-800 min-h-screen relative pb-28 selection:bg-[#E29578] selection:text-white`}>
        {/* Background Blur Pastel */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#83C5BE]/25 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-[#E29578]/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-[#A2D2FF]/25 rounded-full blur-3xl"></div>
        </div>

        {children}

        {/* Floating Bottom Nav (Chic Glassmorphism) - Otomatis hilang di /login */}
        {!isLoginPage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <nav className="flex items-center gap-1.5 p-2 bg-white/80 backdrop-blur-xl border border-stone-200/80 rounded-full shadow-xl shadow-stone-300/30">
              <a
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-slate-700 hover:bg-stone-100/80 transition active:scale-95 font-mono"
              >
                <span>[</span>feed<span>]</span>
              </a>
              <a
                href="/profile"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-slate-700 hover:bg-stone-100/80 transition active:scale-95 font-mono"
              >
                <span>[</span>shelf<span>]</span>
              </a>
            </nav>
          </div>
        )}
      </body>
    </html>
  )
}