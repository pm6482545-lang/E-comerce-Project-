'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/components/CartProvider'
import { store } from '@/lib/config'

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

export default function BottomNav() {
  const pathname = usePathname()
  const { count } = useCart()
  if (pathname?.startsWith('/admin')) return null

  const item = (href: string, label: string, d: string, active: boolean, badge?: number) => (
    <Link href={href} className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? 'text-orange-600' : 'text-stone-600'}`}>
      {icon(d)}
      {label}
      {badge ? <span className="absolute top-1 left-1/2 ml-2 bg-orange-600 text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">{badge}</span> : null}
    </Link>
  )

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 flex">
      {item('/', 'Home', 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', pathname === '/')}
      {item('/shop', 'Shop', 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', pathname.startsWith('/shop'))}
      {item('/cart', 'Cart', 'M6 7h12l1 13H5zM9 7a3 3 0 0 1 6 0', pathname.startsWith('/cart'), count)}
      <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-stone-600">
        {icon('M4 5h16v11H9l-5 4z')}
        Chat
      </a>
    </nav>
  )
}
