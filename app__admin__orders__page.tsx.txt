import Link from 'next/link'
import { getAdmin } from '@/lib/supabaseAdmin'
import { updateOrderStatus } from '@/app/admin/actions'
import { formatPrice } from '@/lib/format'
import { store } from '@/lib/config'
import { card, field, btn } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'ready_for_pickup', 'completed', 'cancelled', 'refunded']
const RECOGNISED = ['paid', 'processing', 'shipped', 'ready_for_pickup', 'completed']

type Item = { id: string; name: string; variant_label: string | null; quantity: number; unit_price: number; unit_cost: number }
type Order = {
  id: string; order_ref: string | null; status: string; total: number; subtotal: number; delivery_fee: number
  customer_name: string | null; customer_phone: string | null; source: string | null; payment_method: string | null
  delivery_method: string | null; delivery_address: string | null; city: string | null; notes: string | null
  created_at: string; order_items: Item[]
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800', paid: 'bg-emerald-100 text-emerald-800', processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800', ready_for_pickup: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-stone-200 text-stone-800', cancelled: 'bg-red-100 text-red-800', refunded: 'bg-red-100 text-red-800',
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; error?: string }> }) {
  const { status = '', error } = await searchParams
  let query = getAdmin().from('orders').select('*, order_items(*)')
  if (status) query = query.eq('status', status)
  const { data } = await query.order('created_at', { ascending: false }).limit(60)
  const orders = (data ?? []) as Order[]

  const chip = (active: boolean) => `px-3 py-1.5 text-xs rounded-full border whitespace-nowrap ${active ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 text-stone-700'}`

  return (
    <div>
      <header className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Orders</h1>
        <Link href="/admin/sales/new" className={btn}>Record sale</Link>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        <Link href="/admin/orders" className={chip(!status)}>All</Link>
        {STATUSES.map((s) => <Link key={s} href={`/admin/orders?status=${s}`} className={chip(status === s)}>{s.replace('_', ' ')}</Link>)}
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 mb-4">{error}</p>}

      {orders.length === 0 ? (
        <div className={`${card} p-10 text-center text-stone-500`}>No orders here yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const cost = o.order_items.reduce((n, i) => n + i.quantity * Number(i.unit_cost), 0)
            const goods = o.order_items.reduce((n, i) => n + i.quantity * Number(i.unit_price), 0)
            const profit = goods - cost
            const counted = RECOGNISED.includes(o.status)
            const closed = o.status === 'cancelled' || o.status === 'refunded'
            return (
              <details key={o.id} className={`${card} group`}>
                <summary className="p-4 cursor-pointer list-none flex flex-wrap gap-x-4 gap-y-2 items-center justify-between">
                  <div>
                    <p className="font-semibold">{o.order_ref ?? o.id.slice(0, 8)} <span className="font-normal text-stone-500">· {o.customer_name ?? 'Walk-in'}</span></p>
                    <p className="text-xs text-stone-500">{new Date(o.created_at).toLocaleString(store.locale, { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' })} · {o.source ?? 'web'}{o.payment_method ? ` · ${o.payment_method}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[o.status] ?? 'bg-stone-200'}`}>{o.status.replace('_', ' ')}</span>
                    <span className="font-semibold">{formatPrice(o.total)}</span>
                  </div>
                </summary>
                <div className="border-t border-stone-100 p-4 space-y-4 text-sm">
                  <ul className="divide-y divide-stone-100">
                    {o.order_items.map((i) => (
                      <li key={i.id} className="py-2 flex justify-between gap-3">
                        <span>{i.name}{i.variant_label && <span className="text-stone-500"> · {i.variant_label}</span>} × {i.quantity}</span>
                        <span>{formatPrice(i.unit_price * i.quantity)} <span className="text-stone-400">(cost {formatPrice(i.unit_cost * i.quantity)})</span></span>
                      </li>
                    ))}
                  </ul>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="bg-stone-50 rounded p-3"><p className="text-xs text-stone-500">Capital</p><p className="font-semibold">{formatPrice(cost)}</p></div>
                    <div className="bg-stone-50 rounded p-3"><p className="text-xs text-stone-500">Profit on goods</p><p className={`font-semibold ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatPrice(profit)}</p></div>
                    <div className="bg-stone-50 rounded p-3"><p className="text-xs text-stone-500">Delivery fee</p><p className="font-semibold">{formatPrice(o.delivery_fee)}</p></div>
                  </div>
                  {!counted && !closed && <p className="text-xs text-amber-700">Profit is counted in your reports once the order is marked paid.</p>}
                  <p className="text-stone-600">
                    {o.customer_phone && <>Phone: <a className="underline" href={`tel:${o.customer_phone}`}>{o.customer_phone}</a><br /></>}
                    {o.delivery_method === 'pickup' ? 'Pickup' : o.delivery_address ? `Deliver to: ${o.delivery_address}${o.city ? `, ${o.city}` : ''}` : ''}
                    {o.notes && <><br />Notes: {o.notes}</>}
                  </p>
                  {closed ? (
                    <p className="text-xs text-stone-500">This order is closed. Stock was returned to inventory.</p>
                  ) : (
                    <form action={updateOrderStatus} className="flex gap-2 max-w-sm">
                      <input type="hidden" name="id" value={o.id} />
                      <select name="status" defaultValue={o.status} className={field}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                      <button className={btn}>Update</button>
                    </form>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
