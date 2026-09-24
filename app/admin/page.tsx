import Link from 'next/link'
import { getAdmin } from '@/lib/supabaseAdmin'
import { getFinance, getInventory } from '@/lib/adminData'
import { formatPrice } from '@/lib/format'
import { store } from '@/lib/config'
import Kpi from '@/components/admin/Kpi'
import { card, th, td, btn, btnGhost } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

type RecentOrder = { id: string; order_ref: string | null; status: string; total: number; customer_name: string | null; source: string | null; created_at: string }

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  ready_for_pickup: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-stone-200 text-stone-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-red-100 text-red-800',
}

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(0)}% margin` : 'no sales yet')

export default async function Dashboard() {
  const db = getAdmin()
  const [fin, inv, pending, recent] = await Promise.all([
    getFinance(),
    getInventory(),
    db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('orders').select('id,order_ref,status,total,customer_name,source,created_at').order('created_at', { ascending: false }).limit(6),
  ])
  const m = fin.current
  const t = fin.total
  const orders = (recent.data ?? []) as RecentOrder[]

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap gap-3 justify-between items-center">
        <h1 className="text-3xl font-semibold text-stone-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/sales/new" className={btn}>Record sale</Link>
          <Link href="/admin/products/new" className={btnGhost}>Add product</Link>
        </div>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">This month</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi label="Sales" value={formatPrice(m.revenue)} hint={`${m.orders} orders`} />
          <Kpi label="Capital (cost of goods)" value={formatPrice(m.cost)} hint="What the sold items cost you" />
          <Kpi label="Profit" value={formatPrice(m.profit)} hint={pct(m.profit, m.revenue)} tone={m.profit >= 0 ? 'good' : 'bad'} />
          <Kpi label="Net after expenses" value={formatPrice(m.net)} hint={`Expenses ${formatPrice(m.expenses)}`} tone={m.net >= 0 ? 'good' : 'bad'} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">All time</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi label="Sales" value={formatPrice(t.revenue)} hint={`${t.orders} orders`} />
          <Kpi label="Capital (cost of goods)" value={formatPrice(t.cost)} />
          <Kpi label="Profit" value={formatPrice(t.profit)} hint={pct(t.profit, t.revenue)} tone={t.profit >= 0 ? 'good' : 'bad'} />
          <Kpi label="Net after expenses" value={formatPrice(t.net)} tone={t.net >= 0 ? 'good' : 'bad'} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Stock</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Kpi label="Capital in stock" value={formatPrice(inv.atCost)} hint={`${inv.units} units on hand`} />
          <Kpi label="Stock at selling price" value={formatPrice(inv.atRetail)} hint={`Potential profit ${formatPrice(inv.atRetail - inv.atCost)}`} />
          <Kpi label="Pending orders" value={pending.count ?? 0} hint="Waiting for payment or action" tone={(pending.count ?? 0) > 0 ? 'bad' : undefined} />
          <Kpi label="Low stock items" value={inv.low.length} hint="At or below alert level" tone={inv.low.length > 0 ? 'bad' : undefined} />
        </div>
      </section>

      <div className="grid xl:grid-cols-3 gap-6">
        <section className={`${card} xl:col-span-2 overflow-hidden`}>
          <div className="px-5 py-4 border-b border-stone-200 flex justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm underline underline-offset-4">View all</Link>
          </div>
          {orders.length === 0 ? (
            <p className="p-5 text-sm text-stone-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-500"><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Status</th><th className={`${th} text-right`}>Total</th></tr></thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className={`${td} font-medium`}>{o.order_ref ?? o.id.slice(0, 8)}<div className="text-xs text-stone-400 font-normal">{new Date(o.created_at).toLocaleDateString(store.locale)} · {o.source ?? 'web'}</div></td>
                      <td className={td}>{o.customer_name ?? '-'}</td>
                      <td className={td}><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[o.status] ?? 'bg-stone-200'}`}>{o.status.replace('_', ' ')}</span></td>
                      <td className={`${td} text-right`}>{formatPrice(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${card} overflow-hidden`}>
          <h2 className="px-5 py-4 border-b border-stone-200 font-semibold">Low stock alerts</h2>
          {inv.low.length === 0 ? (
            <p className="p-5 text-sm text-stone-500">All items are well stocked.</p>
          ) : (
            <ul className="divide-y divide-stone-100 text-sm">
              {inv.low.slice(0, 10).map((s) => (
                <li key={s.id} className="px-5 py-3 flex justify-between gap-3">
                  <span>{s.name}{s.label && <span className="text-stone-500"> · {s.label}</span>}</span>
                  <span className={s.stock <= 0 ? 'text-red-600 font-semibold' : 'text-amber-700 font-semibold'}>{s.stock <= 0 ? 'Out' : `${s.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
