'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import { formatPrice } from '@/lib/format'
import { store, serif } from '@/lib/config'

export default function Header() {
  const pathname = usePathname()
  const { count } = useCart()
  if (pathname?.startsWith('/admin')) return null

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-stone-950 text-stone-300 text-center text-xs tracking-wide py-2 px-4">
        Free delivery on orders over {formatPrice(store.freeDeliveryThreshold)} · Pay with M-Pesa or card
      </div>
      <div className="bg-stone-50/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl tracking-tight text-stone-900" style={serif}>
            {store.name}
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-stone-700">
            <Link href="/shop" className="hover:text-stone-950 transition">Shop</Link>
            <Link href="/cart" className="relative hover:text-stone-950 transition">
              Cart
              {count > 0 && (
                <span className="absolute -top-2.5 -right-4 bg-stone-900 text-white text-[10px] font-semibold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
