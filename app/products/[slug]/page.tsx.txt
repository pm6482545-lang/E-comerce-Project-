import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AddToCart from '@/components/AddToCart'
import ProductCard from '@/components/ProductCard'
import { serif, store } from '@/lib/config'
import { formatPrice, getPricing } from '@/lib/format'
import type { Product } from '@/lib/types'

export const revalidate = 60

async function getProduct(slug: string) {
  const { data } = await supabase
    .from('products')
    .select('*, product_images(image_url), product_variants(*), categories(name)')
    .eq('slug', slug)
    .single()
  return (data ?? null) as Product | null
}

async function getRelated(product: Product) {
  if (!product.category_id) return []
  const { data } = await supabase
    .from('products')
    .select('*, product_images(image_url), categories(name)')
    .eq('is_active', true)
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4)
  return (data ?? []) as Product[]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: product.name,
    description: product.description?.slice(0, 155) ?? undefined,
    openGraph: { images: product.product_images?.[0]?.image_url ? [product.product_images[0].image_url] : [] },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const related = await getRelated(product)
  const images = product.product_images ?? []
  const { price, compareAt, onSale } = getPricing(product)

  const options = (product.product_variants ?? []).map((v) => ({
    id: String(v.id),
    label: [v.size, v.color].filter(Boolean).join(' / ') || v.name || v.sku || 'Standard',
    stock: typeof v.stock === 'number' ? v.stock : typeof v.stock_quantity === 'number' ? v.stock_quantity : null,
  }))

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10">
      <nav className="text-sm text-stone-500 mb-8">
        <Link href="/shop" className="hover:text-stone-900">Shop</Link>
        {product.categories?.name && <span> / {product.categories.name}</span>}
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-[4/5] bg-stone-200 overflow-hidden rounded-sm">
            {images[0]?.image_url ? (
              <img src={images[0].image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400">No image available</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((img, i) => (
                <div key={i} className="aspect-square bg-stone-200 overflow-hidden rounded-sm">
                  <img src={img.image_url} alt={`${product.name} view ${i + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.categories?.name && (
            <p className="text-xs tracking-widest uppercase text-stone-500 mb-3">{product.categories.name}</p>
          )}
          <h1 className="text-4xl md:text-5xl leading-tight mb-5" style={serif}>{product.name}</h1>
          <p className="text-2xl mb-8">
            <span className="font-semibold">{formatPrice(price)}</span>
            {onSale && compareAt && <span className="ml-3 text-lg text-stone-400 line-through">{formatPrice(compareAt)}</span>}
          </p>

          <p className="text-stone-600 leading-relaxed mb-10">{product.description || 'Details coming soon.'}</p>

          <AddToCart
            product={{
              id: String(product.id),
              slug: product.slug,
              name: product.name,
              price,
              image: images[0]?.image_url ?? null,
            }}
            options={options}
          />

          <div className="mt-10 border-t border-stone-200 divide-y divide-stone-200 text-sm">
            {product.material_care && (
              <div className="py-5">
                <p className="font-semibold text-stone-900 mb-1">Material and care</p>
                <p className="text-stone-600 leading-relaxed">{product.material_care}</p>
              </div>
            )}
            <div className="py-5">
              <p className="font-semibold text-stone-900 mb-1">Delivery</p>
              <p className="text-stone-600">
                Free over {formatPrice(store.freeDeliveryThreshold)}, otherwise {formatPrice(store.deliveryFee)}. Pickup available in {store.city}.
              </p>
            </div>
            <div className="py-5">
              <p className="font-semibold text-stone-900 mb-1">Payment</p>
              <p className="text-stone-600">M-Pesa and card accepted.</p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pt-24">
          <h2 className="text-3xl mb-10" style={serif}>You may also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
