'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { serif, store } from '@/lib/config'
import { formatPrice } from '@/lib/format'

const PHONE_RE = /^(?:\+?254|0)?[17]\d{8}$/
const input =
  'w-full border border-stone-300 bg-white px-4 py-3 text-sm focus:outline-none focus:border-stone-900 transition'

export default function CheckoutPage() {
  const { items, ready, subtotal, clear } = useCart()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    delivery: 'delivery',
    paymentMethod: 'mpesa',
  })
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ ref: string; link: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const isPickup = form.delivery === 'pickup'
  const deliveryFee = isPickup || subtotal >= store.freeDeliveryThreshold ? 0 : store.deliveryFee
  const total = subtotal + deliveryFee

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!PHONE_RE.test(form.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid Kenyan phone number, e.g. 0712345678.')
      return
    }
    setError('')

    const ref = `EL-${Date.now().toString(36).toUpperCase()}`
    const lines = items.map(
      (i) => `• ${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.quantity} - ${formatPrice(i.price * i.quantity)}`
    )
    const message = [
      `New order ${ref}`,
      '',
      ...lines,
      '',
      `Subtotal: ${formatPrice(subtotal)}`,
      `Delivery: ${deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}`,
      `Total: ${formatPrice(total)}`,
      '',
      `Name: ${form.fullName}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      isPickup ? 'Collection: Pickup' : `Deliver to: ${form.address}, ${form.city}`,
      `Payment: ${form.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'}`,
      form.notes ? `Notes: ${form.notes}` : '',
    ]
      .filter((l, idx, arr) => l !== '' || arr[idx - 1] !== '')
      .join('\n')

    const link = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`
    window.open(link, '_blank', 'noopener,noreferrer')
    clear()
    setDone({ ref, link })
  }

  if (!ready) return <div className="max-w-5xl mx-auto px-6 py-24 text-stone-400">Loading…</div>

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-24 text-center">
        <h1 className="text-4xl mb-4" style={serif}>Thank you</h1>
        <p className="text-stone-600 mb-2">Your order request <strong>{done.ref}</strong> is ready to send.</p>
        <p className="text-stone-600 mb-8">
          Send the pre-filled WhatsApp message and we will confirm your order and payment details right away.
        </p>
        <a href={done.link} target="_blank" rel="noopener noreferrer" className="inline-block bg-stone-900 hover:bg-stone-800 text-white px-8 py-3.5 text-sm font-semibold transition">
          Open WhatsApp
        </a>
        <div className="mt-6">
          <Link href="/shop" className="text-sm underline underline-offset-4 text-stone-600">Continue shopping</Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 pt-24 text-center">
        <h1 className="text-4xl mb-4" style={serif}>Checkout</h1>
        <p className="text-stone-500 mb-8">Your cart is empty.</p>
        <Link href="/shop" className="inline-block bg-stone-900 text-white px-8 py-3.5 text-sm font-semibold">Browse the shop</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-14">
      <h1 className="text-4xl md:text-5xl mb-10" style={serif}>Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 space-y-10">
          <section>
            <h2 className="text-xl mb-5" style={serif}>Contact</h2>
            <div className="grid gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">Full name</label>
                <input id="fullName" name="fullName" required value={form.fullName} onChange={handleChange} className={input} placeholder="Jane Wanjiku" autoComplete="name" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
                  <input id="email" type="email" name="email" required value={form.email} onChange={handleChange} className={input} placeholder="jane@example.com" autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1.5">Phone (M-Pesa)</label>
                  <input id="phone" type="tel" name="phone" required value={form.phone} onChange={handleChange} className={input} placeholder="0712345678" autoComplete="tel" />
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl mb-5" style={serif}>Delivery</h2>
            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              {[
                { value: 'delivery', title: 'Delivery', sub: deliveryFee === 0 && !isPickup ? 'Free' : formatPrice(store.deliveryFee) },
                { value: 'pickup', title: 'Pickup', sub: `${store.city} · Free` },
              ].map((o) => (
                <label key={o.value} className={`flex items-center justify-between border p-4 cursor-pointer transition ${form.delivery === o.value ? 'border-stone-900 bg-white' : 'border-stone-300 hover:border-stone-500'}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="delivery" value={o.value} checked={form.delivery === o.value} onChange={handleChange} className="accent-stone-900" />
                    <span className="text-sm font-medium">{o.title}</span>
                  </span>
                  <span className="text-sm text-stone-500">{o.sub}</span>
                </label>
              ))}
            </div>
            {!isPickup && (
              <div className="grid gap-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-1.5">Address</label>
                  <input id="address" name="address" required value={form.address} onChange={handleChange} className={input} placeholder="Street / building / apartment" autoComplete="street-address" />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-1.5">City / area</label>
                  <input id="city" name="city" required value={form.city} onChange={handleChange} className={input} placeholder={store.city} />
                </div>
              </div>
            )}
            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium mb-1.5">Order notes (optional)</label>
              <textarea id="notes" name="notes" rows={3} value={form.notes} onChange={handleChange} className={input} placeholder="Landmark, preferred time, gift note…" />
            </div>
          </section>

          <section>
            <h2 className="text-xl mb-5" style={serif}>Payment</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { value: 'mpesa', title: 'M-Pesa' },
                { value: 'card', title: 'Credit / debit card' },
              ].map((o) => (
                <label key={o.value} className={`flex items-center gap-3 border p-4 cursor-pointer transition ${form.paymentMethod === o.value ? 'border-stone-900 bg-white' : 'border-stone-300 hover:border-stone-500'}`}>
                  <input type="radio" name="paymentMethod" value={o.value} checked={form.paymentMethod === o.value} onChange={handleChange} className="accent-stone-900" />
                  <span className="text-sm font-medium">{o.title}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-stone-500 mt-3">We will send secure payment instructions once your order is confirmed.</p>
          </section>
        </div>

        <aside className="lg:col-span-2 bg-white border border-stone-200 p-6 h-fit lg:sticky lg:top-28">
          <h2 className="text-xl mb-5" style={serif}>Your order</h2>
          <ul className="divide-y divide-stone-100 mb-5">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  {i.name}
                  {i.variant && <span className="text-stone-500"> · {i.variant}</span>}
                  <span className="text-stone-500"> × {i.quantity}</span>
                </span>
                <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 text-sm text-stone-600 border-t border-stone-200 pt-4">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span></div>
            <div className="flex justify-between text-base font-semibold text-stone-900 pt-2"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
          <button type="submit" className="w-full mt-6 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold py-3.5 transition">
            Place order
          </button>
          <p className="text-xs text-stone-500 mt-3 text-center">Your order is sent to us on WhatsApp for confirmation.</p>
        </aside>
      </form>
    </div>
  )
}
