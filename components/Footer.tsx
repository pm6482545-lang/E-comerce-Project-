'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { store, serif } from '@/lib/config'
import { formatPrice } from '@/lib/format'

export default function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null

  return (
    <footer className="bg-stone-950 text-stone-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-3xl text-white mb-3" style={serif}>{store.name}<span className="text-orange-500">.</span></p>
          <p className="text-sm leading-relaxed max-w-xs">{store.tagline}. Based in {store.city}, delivering across Kenya.</p>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-stone-100 font-semibold mb-3">Shop</p>
          <Link href="/shop" className="block hover:text-white">All products</Link>
          <Link href="/shop?deals=1" className="block hover:text-white">Hot deals</Link>
          <Link href="/cart" className="block hover:text-white">Your cart</Link>
        </div>
        <div className="text-sm space-y-2">
          <p className="text-stone-100 font-semibold mb-3">Customer care</p>
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" className="block hover:text-white">Chat on WhatsApp</a>
          <a href={`mailto:${store.email}`} className="block hover:text-white">{store.email}</a>
          <p>Free delivery over {formatPrice(store.freeDeliveryThreshold)}</p>
          <p>Pickup available in {store.city}</p>
        </div>
        <div className="text-sm">
          <p className="text-stone-100 font-semibold mb-3">We accept</p>
          <div className="flex flex-wrap gap-2">
            {['M-Pesa', 'Visa', 'Mastercard'].map((p) => (
              <span key={p} className="border border-stone-700 rounded px-3 py-1.5 text-xs text-stone-200">{p}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-stone-800 text-center text-xs py-5">
        © {new Date().getFullYear()} {store.name}. All rights reserved.
      </div>
    </footer>
  )
}
