import Link from 'next/link'
import { formatPrice, getPricing } from '@/lib/format'
import type { Product } from '@/lib/types'

export default function ProductCard({ product }: { product: Product }) {
  const image = product.product_images?.[0]?.image_url
  const { price, compareAt, onSale } = getPricing(product)

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-stone-200 overflow-hidden rounded-sm">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400 text-sm">No image</div>
        )}
        {onSale && (
          <span className="absolute top-3 left-3 bg-stone-900 text-white text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1">
            Sale
          </span>
        )}
      </div>
      <div className="pt-4">
        {product.categories?.name && (
          <p className="text-[11px] tracking-widest uppercase text-stone-500 mb-1">{product.categories.name}</p>
        )}
        <h3 className="text-stone-900 font-medium leading-snug group-hover:underline underline-offset-4">{product.name}</h3>
        <p className="mt-1 text-sm">
          <span className="font-semibold text-stone-900">{formatPrice(price)}</span>
          {compareAt && <span className="ml-2 text-stone-400 line-through">{formatPrice(compareAt)}</span>}
        </p>
      </div>
    </Link>
  )
}
