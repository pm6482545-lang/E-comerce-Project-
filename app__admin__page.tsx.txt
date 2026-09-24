import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { formatPrice } from '@/lib/format'
import { store } from '@/lib/config'
import type { Product } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } }

type Order = {
  id: string | number
  status?: string | null
  total?: number | string | null
  total_amount?: number | string | null
  created_at?: string | null
}

const orderTotal = (o: Order) => Number(o.total ?? o.total_amount ?? 0)

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-stone-200 text-stone-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-red-100 text-red-800',
}

async function getAdminData() {
  const [products, orders, customers, allOrders, latestOrders, latestProducts] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select('*').order('created_at', { ascending: false }).limit(6),
  ])

  const orderRows = (allOrders.data ?? []) as Order[]
  const revenue = orderRows
    .filter((o) => ['paid', 'processing', 'shipped', 'completed'].includes((o.status ?? '').toLowerCase()))
    .reduce((sum, o) => sum + orderTotal(o), 0)

  return {
    productCount: products.count ?? 0,
    orderCount: orders.count ?? 0,
    customerCount: customers.count ?? 0,
    pending: orderRows.filter((o) => (o.status ?? '').toLowerCase() === 'pending').length,
    revenue,
    latestOrders: (latestOrders.data ?? []) as Order[],
    latestProducts: (latestProducts.data ?? []) as Product[],
  }
}

export default async function AdminDashboard() {
  const d = await getAdminData()

  const metrics = [
    { label: 'Revenue', value: formatPrice(d.revenue), hint: 'Paid and fulfilled orders' },
    { label: 'Orders', value: d.orderCount, hint: `${d.pending} pending` },
    { label: 'Products', value: d.productCount, hint: 'In catalog' },
    { label: 'Customers', value: d.customerCount, hint: 'Registered' },
  ]

  return (
    <div className="min-h-screen bg-stone-100 md:flex">
      <aside className="md:w-64 bg-stone-950 text-white p-6 md:min-h-screen">
        <h2 className="text-xl font-semibold mb-8">{store.name} Admin</h2>
        <nav className="flex md:block gap-2 md:space-y-2 text-sm">
          <Link href="/admin" className="block py-2.5 px-4 rounded bg-white/10 font-medium">Dashboard</Link>
          <Link href="/shop" target="_blank" className="block py-2.5 px-4 rounded text-stone-300 hover:bg-white/5 transition">View storefront</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-stone-900">Overview</h1>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">Store active</span>
        </header>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white p-5 rounded-lg border border-stone-200">
              <p className="text-sm text-stone-500 mb-1">{m.label}</p>
              <p className="text-2xl font-semibold text-stone-900">{m.value}</p>
              <p className="text-xs text-stone-400 mt-1">{m.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white rounded-lg border border-stone-200 overflow-hidden">
            <h2 className="px-5 py-4 font-semibold text-stone-900 border-b border-stone-200">Recent orders</h2>
            {d.latestOrders.length === 0 ? (
              <p className="p-5 text-sm text-stone-500">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-stone-500 bg-stone-50">
                    <tr>
                      <th className="px-5 py-3 font-medium">Order</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {d.latestOrders.map((o) => {
                      const status = (o.status ?? 'pending').toLowerCase()
                      return (
                        <tr key={o.id}>
                          <td className="px-5 py-3 font-medium">#{String(o.id).slice(0, 8)}</td>
                          <td className="px-5 py-3 text-stone-500">{o.created_at ? new Date(o.created_at).toLocaleDateString(store.locale) : '-'}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[status] ?? 'bg-stone-200 text-stone-800'}`}>{status}</span>
                          </td>
                          <td className="px-5 py-3 text-right">{formatPrice(orderTotal(o))}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="bg-white rounded-lg border border-stone-200 overflow-hidden">
            <h2 className="px-5 py-4 font-semibold text-stone-900 border-b border-stone-200">Latest products</h2>
            {d.latestProducts.length === 0 ? (
              <p className="p-5 text-sm text-stone-500">No products yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {d.latestProducts.map((p) => (
                  <li key={p.id} className="px-5 py-3 flex justify-between gap-3 text-sm">
                    <Link href={`/products/${p.slug}`} target="_blank" className="hover:underline underline-offset-4">{p.name}</Link>
                    <span className="text-stone-500">{formatPrice(p.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
