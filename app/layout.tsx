import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/CartProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabaseClient'
import { store } from '@/lib/config'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const serifFont = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })

export const revalidate = 300

export const metadata: Metadata = {
  title: { default: `${store.name} | ${store.tagline}`, template: `%s | ${store.name}` },
  description: `${store.tagline}. Shop with M-Pesa and card checkout.`,
}

async function getCategories() {
  try {
    const { data } = await supabase.from('categories').select('id,name').order('name')
    return (data ?? []) as { id: string; name: string }[]
  } catch {
    return []
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories()
  return (
    <html lang="en" className={`${sans.variable} ${serifFont.variable}`}>
      <body className="bg-stone-100 text-stone-900 antialiased" style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
        <CartProvider>
          <Header categories={categories} />
          <main className="pb-20 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  )
}
