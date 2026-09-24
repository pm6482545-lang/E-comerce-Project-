'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { store } from '@/lib/config'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/sales/new', label: 'Record sale' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/finance', label: 'Finance' },
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <aside className="md:w-64 md:min-h-screen bg-stone-950 text-white shrink-0">
      <div className="px-5 pt-5 pb-3 md:p-6">
        <h2 className="text-lg font-semibold">{store.name} Admin</h2>
      </div>
      <nav className="flex md:block gap-1 overflow-x-auto px-3 pb-3 md:px-4 md:space-y-1 text-sm whitespace-nowrap">
        {links.map((l) => {
          const active = l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block py-2.5 px-4 rounded-md transition ${active ? 'bg-white/10 font-medium' : 'text-stone-300 hover:bg-white/5'}`}
            >
              {l.label}
            </Link>
          )
        })}
        <Link href="/shop" target="_blank" className="block py-2.5 px-4 rounded-md text-stone-400 hover:bg-white/5 transition">
          View store ↗
        </Link>
      </nav>
    </aside>
  )
}
