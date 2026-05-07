import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BrewMaster — Craft Brewery OS',
  description: 'Система управления крафтовой пивоварней',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-brewery min-h-screen">
        <div style={{ display: 'grid', gridTemplateColumns: '16rem 1fr', minHeight: '100vh' }}>
          <Sidebar />
          <div className="flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 p-6 min-w-0">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
