'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { store, serif } from '@/lib/config'

export default function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null

  return (
    <footer className="bg-stone-950 text-stone-400 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <p className="text-2xl text-white mb-3" style={serif}>{store.name}</p>
          <p className="text-sm leading-relaxed max-w-xs">{store.tagline}. Based in {store.city}.</p>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-stone-200 font-medium mb-3">Shop</p>
          <Link href="/shop" className="block hover:text-white transition">All products</Link>
          <Link href="/cart" className="block hover:text-white transition">Your cart</Link>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-stone-200 font-medium mb-3">Help</p>
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" className="block hover:text-white transition">
            Chat on WhatsApp
          </a>
          <a href={`mailto:${store.email}`} className="block hover:text-white transition">{store.email}</a>
          <p className="pt-2">We accept M-Pesa and cards.</p>
        </div>
      </div>
      <div className="border-t border-stone-800 text-center text-xs py-5">
        © {new Date().getFullYear()} {store.name}. All rights reserved.
      </div>
    </footer>
  )
}
