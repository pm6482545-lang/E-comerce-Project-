import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/CartProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { store } from '@/lib/config'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const serifFont = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: { default: `${store.name} | ${store.tagline}`, template: `%s | ${store.name}` },
  description: `${store.tagline}. Shop premium pieces with M-Pesa and card checkout.`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serifFont.variable}`}>
      <body className="bg-stone-50 text-stone-900 antialiased" style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
