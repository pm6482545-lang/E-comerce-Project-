'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'

type Option = { id: string; label: string; stock: number | null }

type Props = {
  product: { id: string; slug: string; name: string; price: number; image: string | null }
  options: Option[]
  stockLimit?: number | null
}

export default function AddToCart({ product, options, stockLimit = null }: Props) {
  const { add } = useCart()
  const [selected, setSelected] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')

  const chosen = options.find((o) => o.id === selected)
  const allSoldOut =
    (options.length > 0 && options.every((o) => o.stock !== null && o.stock <= 0)) ||
    (options.length === 0 && stockLimit !== null && stockLimit <= 0)
  const limit = chosen?.stock ?? (options.length === 0 ? stockLimit : null)
  const max = limit != null ? Math.max(1, Math.min(limit, 10)) : 10

  function handleAdd() {
    if (options.length > 0 && !chosen) {
      setError('Please choose an option first.')
      return
    }
    setError('')
    add(
      { productId: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image, variant: chosen?.label, variantId: chosen?.id },
      qty
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 4000)
  }

  return (
    <div className="space-y-6">
      {options.length > 0 && (
        <div>
          <p className="text-sm font-medium text-stone-900 mb-3">Select option</p>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => {
              const soldOut = o.stock !== null && o.stock <= 0
              const active = o.id === selected
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => { setSelected(o.id); setQty(1); setError('') }}
                  className={`px-4 py-2 text-sm border transition ${
                    active ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 text-stone-800 hover:border-stone-900'
                  } ${soldOut ? 'opacity-40 line-through cursor-not-allowed' : ''}`}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
          {chosen?.stock != null && chosen.stock > 0 && chosen.stock <= 5 && (
            <p className="text-sm text-amber-700 mt-3">Only {chosen.stock} left</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center border border-stone-300">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-12 hover:bg-stone-100" aria-label="Decrease quantity">−</button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} className="w-10 h-12 hover:bg-stone-100" aria-label="Increase quantity">+</button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={allSoldOut}
          className="flex-1 h-12 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-sm font-semibold tracking-wide transition"
        >
          {allSoldOut ? 'Sold out' : 'Add to cart'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {added && (
        <p className="text-sm text-emerald-700">
          Added to your cart. <Link href="/cart" className="underline underline-offset-4 font-medium">View cart</Link>
        </p>
      )}
    </div>
  )
}
