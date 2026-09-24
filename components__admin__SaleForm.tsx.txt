'use client'

import { useState, useTransition } from 'react'
import { createSale } from '@/app/admin/actions'
import { formatPrice } from '@/lib/format'
import { field, label, btn, card } from '@/components/admin/ui'

export type SaleProduct = {
  id: string
  name: string
  price: number
  cost: number
  stock: number
  variants: { id: string; label: string; stock: number }[]
}

type Line = { productId: string; variantId: string; quantity: string; price: string }

export default function SaleForm({ products }: { products: SaleProduct[] }) {
  const [lines, setLines] = useState<Line[]>([{ productId: '', variantId: '', quantity: '1', price: '' }])
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState('walk-in')
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [status, setStatus] = useState('paid')
  const [deliveryFee, setDeliveryFee] = useState('0')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  const byId = new Map(products.map((p) => [p.id, p]))
  const update = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const totals = lines.reduce(
    (t, l) => {
      const p = byId.get(l.productId)
      const q = Number(l.quantity) || 0
      if (p) { t.revenue += (Number(l.price) || 0) * q; t.cost += p.cost * q }
      return t
    },
    { revenue: 0, cost: 0 }
  )
  const fee = Number(deliveryFee) || 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const valid = lines.filter((l) => l.productId)
    for (const l of valid) {
      const p = byId.get(l.productId)
      if (p && p.variants.length > 0 && !l.variantId) { setError(`Choose a size or color for ${p.name}.`); return }
    }
    start(async () => {
      const res = await createSale(
        JSON.stringify({
          customerName, phone, source, paymentMethod, status, deliveryFee: fee, notes,
          lines: valid.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: Number(l.quantity) || 0, price: Number(l.price) || 0 })),
        })
      )
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <section className={`${card} p-5 space-y-4`}>
        <h2 className="font-semibold">Items sold</h2>
        {lines.map((l, i) => {
          const p = byId.get(l.productId)
          const v = p?.variants.find((x) => x.id === l.variantId)
          const avail = p ? (p.variants.length ? v?.stock : p.stock) : undefined
          const lineProfit = p ? ((Number(l.price) || 0) - p.cost) * (Number(l.quantity) || 0) : 0
          return (
            <div key={i} className="border border-stone-200 rounded-md p-3 space-y-3">
              <div>
                <label className={label}>Product</label>
                <select
                  className={field}
                  value={l.productId}
                  onChange={(e) => { const np = byId.get(e.target.value); update(i, { productId: e.target.value, variantId: '', price: np ? String(np.price) : '' }) }}
                >
                  <option value="">Select product</option>
                  {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>
              {p && p.variants.length > 0 && (
                <div>
                  <label className={label}>Size / color</label>
                  <select className={field} value={l.variantId} onChange={(e) => update(i, { variantId: e.target.value })}>
                    <option value="">Select option</option>
                    {p.variants.map((x) => <option key={x.id} value={x.id} disabled={x.stock <= 0}>{x.label} ({x.stock} in stock)</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Quantity</label>
                  <input inputMode="numeric" className={field} value={l.quantity} onChange={(e) => update(i, { quantity: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Price each (KES)</label>
                  <input inputMode="decimal" className={field} value={l.price} onChange={(e) => update(i, { price: e.target.value })} />
                </div>
              </div>
              {p && (
                <p className="text-xs text-stone-500">
                  Cost {formatPrice(p.cost)} each · profit on this line{' '}
                  <span className={lineProfit >= 0 ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}>{formatPrice(lineProfit)}</span>
                  {avail !== undefined && avail !== null && ` · ${avail} available`}
                </p>
              )}
              {lines.length > 1 && <button type="button" className="text-sm text-red-600" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>Remove item</button>}
            </div>
          )
        })}
        <button type="button" className="text-sm font-medium underline underline-offset-4" onClick={() => setLines((ls) => [...ls, { productId: '', variantId: '', quantity: '1', price: '' }])}>
          + Add another item
        </button>
      </section>

      <section className={`${card} p-5 space-y-4`}>
        <h2 className="font-semibold">Customer and payment</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={label}>Customer name (optional)</label><input className={field} value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
          <div><label className={label}>Phone (optional)</label><input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div>
            <label className={label}>Where did the sale come from?</label>
            <select className={field} value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="walk-in">Walk-in / shop</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="web">Website</option><option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={label}>Payment method</label>
            <select className={field} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="mpesa">M-Pesa</option><option value="cash">Cash</option><option value="card">Card</option><option value="bank">Bank transfer</option>
            </select>
          </div>
          <div>
            <label className={label}>Payment status</label>
            <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="paid">Paid</option><option value="pending">Not paid yet</option>
            </select>
          </div>
          <div><label className={label}>Delivery fee charged (KES)</label><input inputMode="decimal" className={field} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} /></div>
        </div>
        <div><label className={label}>Notes (optional)</label><input className={field} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      </section>

      <section className={`${card} p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm`}>
        <div><p className="text-stone-500">Sale total</p><p className="font-semibold text-lg">{formatPrice(totals.revenue + fee)}</p></div>
        <div><p className="text-stone-500">Capital</p><p className="font-semibold text-lg">{formatPrice(totals.cost)}</p></div>
        <div><p className="text-stone-500">Profit</p><p className={`font-semibold text-lg ${totals.revenue - totals.cost >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatPrice(totals.revenue - totals.cost)}</p></div>
        <div><p className="text-stone-500">Margin</p><p className="font-semibold text-lg">{totals.revenue > 0 ? `${(((totals.revenue - totals.cost) / totals.revenue) * 100).toFixed(0)}%` : '-'}</p></div>
      </section>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
      <button type="submit" disabled={pending} className={btn}>{pending ? 'Saving…' : 'Save sale'}</button>
    </form>
  )
}
