'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import { formatPrice } from '@/lib/format'
import { store, serif } from '@/lib/config'

export default function Header({ categories }: { categories: { id: string; name: string }[] }) {
  const pathname = usePathname()
  const { count } = useCart()
  if (pathname?.startsWith('/admin')) return null

  const search = (
    <form action="/shop" method="get" className="flex w-full">
      <input
        type="search"
        name="q"
        placeholder="Search products, brands and categories"
        className="flex-1 min-w-0 border border-stone-300 border-r-0 rounded-l-md bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-orange-600"
      />
      <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-5 rounded-r-md transition">
        Search
      </button>
    </form>
  )

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="bg-stone-950 text-stone-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-8 flex items-center justify-between">
          <span>Free delivery over {formatPrice(store.freeDeliveryThreshold)} · M-Pesa and cards</span>
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hidden sm:block hover:text-white">
            Need help? Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4 md:gap-8">
        <Link href="/" className="text-2xl md:text-3xl tracking-tight text-stone-900 shrink-0" style={serif}>
          {store.name}<span className="text-orange-600">.</span>
        </Link>
        <div className="hidden md:block flex-1 max-w-2xl">{search}</div>
        <nav className="ml-auto flex items-center gap-5 text-sm font-medium text-stone-800">
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hidden lg:block hover:text-orange-600">Help</a>
          <Link href="/cart" className="relative flex items-center gap-2 hover:text-orange-600">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l1 13H5zM9 7a3 3 0 0 1 6 0" /></svg>
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -top-2 left-3 sm:left-4 bg-orange-600 text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">{count}</span>
            )}
          </Link>
        </nav>
      </div>

      <div className="md:hidden px-4 pb-3">{search}</div>

      <div className="border-t border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto no-scrollbar text-sm whitespace-nowrap">
          <Link href="/shop" className="px-3 py-2.5 font-semibold hover:text-orange-600">All products</Link>
          <Link href="/shop?deals=1" className="px-3 py-2.5 font-semibold text-orange-600 hover:text-orange-700">Hot deals</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${encodeURIComponent(c.name)}`} className="px-3 py-2.5 text-stone-700 hover:text-orange-600">
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
