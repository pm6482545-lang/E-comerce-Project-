import Link from 'next/link'
import QuickAdd from '@/components/QuickAdd'
import { formatPrice, getPricing } from '@/lib/format'
import type { Product } from '@/lib/types'

export default function ProductCard({ product }: { product: Product }) {
  const image = product.product_images?.[0]?.image_url ?? null
  const { price, compareAt, onSale } = getPricing(product)
  const pct = compareAt ? Math.round((1 - price / compareAt) * 100) : 0
  const variants = product.product_variants ?? []
  const stock = variants.length ? variants.reduce((n, v) => n + (v.stock ?? 0), 0) : product.stock ?? null
  const soldOut = stock !== null && stock <= 0
  const low = stock !== null && stock > 0 && stock <= 5

  return (
    <div className="group bg-white border border-stone-200 rounded-lg overflow-hidden flex flex-col hover:shadow-lg hover:border-stone-300 transition">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] bg-stone-100 overflow-hidden">
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400 text-sm">No image</div>
        )}
        {onSale && pct > 0 && (
          <span className="absolute top-2 right-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">-{pct}%</span>
        )}
        {soldOut && (
          <span className="absolute inset-0 bg-white/60 flex items-center justify-center text-stone-700 text-sm font-semibold">Sold out</span>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        {product.categories?.name && (
          <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-1">{product.categories.name}</p>
        )}
        <Link href={`/products/${product.slug}`} className="text-sm text-stone-900 font-medium leading-snug line-clamp-2 min-h-[2.5rem] hover:text-orange-600">
          {product.name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-bold text-stone-900">{formatPrice(price)}</span>
          {compareAt && <span className="text-xs text-stone-400 line-through">{formatPrice(compareAt)}</span>}
        </div>
        <p className={`text-xs mt-1 h-4 ${low ? 'text-red-600 font-medium' : 'text-transparent'}`}>{low ? `Only ${stock} left` : '.'}</p>
        <div className="mt-2">
          <QuickAdd
            product={{ id: String(product.id), slug: product.slug, name: product.name, price, image }}
            hasVariants={variants.length > 0}
            soldOut={soldOut}
          />
        </div>
      </div>
    </div>
  )
}
