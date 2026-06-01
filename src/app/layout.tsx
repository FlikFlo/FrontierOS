import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'
import { CrmShell } from '@/components/layout/crm-shell'
import { I18nProvider } from '@/i18n/provider'
import { getLocale } from '@/i18n/server'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'FrontierOS',
  description: 'CRM on the Croat design kit',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <I18nProvider initialLocale={locale}>
          <ToastProvider>
            <CrmShell>{children}</CrmShell>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
