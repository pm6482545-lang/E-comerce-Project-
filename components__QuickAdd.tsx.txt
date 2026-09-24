'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'

type Props = {
  product: { id: string; slug: string; name: string; price: number; image: string | null }
  hasVariants: boolean
  soldOut: boolean
}

export default function QuickAdd({ product, hasVariants, soldOut }: Props) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  if (soldOut) {
    return <button disabled className="w-full py-2.5 text-sm font-semibold rounded-md bg-stone-200 text-stone-500 cursor-not-allowed">Sold out</button>
  }

  if (hasVariants) {
    return (
      <Link
        href={`/products/${product.slug}`}
        className="block text-center w-full py-2.5 text-sm font-semibold rounded-md border border-orange-600 text-orange-600 hover:bg-orange-50 transition"
      >
        Select options
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        add({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image })
        setAdded(true)
        setTimeout(() => setAdded(false), 1800)
      }}
      className={`w-full py-2.5 text-sm font-semibold rounded-md text-white transition ${added ? 'bg-emerald-600' : 'bg-orange-600 hover:bg-orange-700'}`}
    >
      {added ? 'Added ✓' : 'Add to cart'}
    </button>
  )
}
