'use client'

import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { serif, store } from '@/lib/config'
import { formatPrice } from '@/lib/format'

export default function CartPage() {
  const { items, ready, subtotal, setQty, remove } = useCart()

  if (!ready) return <div className="max-w-5xl mx-auto px-6 py-24 text-stone-400">Loading your cart…</div>

  const remaining = Math.max(0, store.freeDeliveryThreshold - subtotal)
  const progress = Math.min(100, (subtotal / store.freeDeliveryThreshold) * 100)

  return (
    <div className="max-w-5xl mx-auto px-6 pt-14">
      <h1 className="text-4xl md:text-5xl mb-10" style={serif}>Your cart</h1>

      {items.length === 0 ? (
        <div className="bg-white border border-stone-200 py-20 text-center">
          <p className="text-stone-500 mb-6">Your cart is empty.</p>
          <Link href="/shop" className="inline-block bg-stone-900 hover:bg-stone-800 text-white px-8 py-3.5 text-sm font-semibold transition">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2 divide-y divide-stone-200 border-y border-stone-200">
            {items.map((item) => (
              <div key={item.key} className="flex gap-5 py-6">
                <Link href={`/products/${item.slug}`} className="w-24 h-28 bg-stone-200 shrink-0 overflow-hidden rounded-sm">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </Link>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link href={`/products/${item.slug}`} className="font-medium hover:underline underline-offset-4">{item.name}</Link>
                      {item.variant && <p className="text-sm text-stone-500 mt-0.5">{item.variant}</p>}
                    </div>
                    <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center border border-stone-300">
                      <button onClick={() => setQty(item.key, item.quantity - 1)} className="w-9 h-9 hover:bg-stone-100" aria-label="Decrease quantity">−</button>
                      <span className="w-9 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => setQty(item.key, item.quantity + 1)} className="w-9 h-9 hover:bg-stone-100" aria-label="Increase quantity">+</button>
                    </div>
                    <button onClick={() => remove(item.key)} className="text-sm text-stone-500 hover:text-red-600 underline underline-offset-4">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="bg-white border border-stone-200 p-6 h-fit md:sticky md:top-28">
            <h2 className="text-xl mb-5" style={serif}>Order summary</h2>
            <div className="mb-5">
              <p className="text-sm text-stone-600 mb-2">
                {remaining > 0 ? `Add ${formatPrice(remaining)} more for free delivery` : 'You qualify for free delivery'}
              </p>
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-stone-900 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="flex justify-between text-sm text-stone-600 mb-2">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-600 mb-5">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
            <Link
              href="/checkout"
              className="block text-center bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold py-3.5 transition"
            >
              Proceed to checkout
            </Link>
            <Link href="/shop" className="block text-center text-sm text-stone-500 hover:text-stone-900 mt-4 underline underline-offset-4">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}
