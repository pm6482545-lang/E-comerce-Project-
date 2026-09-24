import Link from 'next/link'
import { getAdmin } from '@/lib/supabaseAdmin'
import { formatPrice, getPricing } from '@/lib/format'
import { deleteProduct, toggleProduct } from '@/app/admin/actions'
import ConfirmButton from '@/components/admin/ConfirmButton'
import { card, btn, field } from '@/components/admin/ui'
import type { Product } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const db = getAdmin()
  const [p, c] = await Promise.all([
    db.from('products').select('*, categories(name), product_images(image_url), product_variants(id,stock)').order('created_at', { ascending: false }),
    db.from('product_costs').select('product_id,cost_price'),
  ])
  const costs = new Map<string, number>(((c.data ?? []) as { product_id: string; cost_price: number }[]).map((r) => [r.product_id, Number(r.cost_price)]))
  let products = (p.data ?? []) as Product[]
  if (q) products = products.filter((x) => x.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <header className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Products <span className="text-stone-400 text-xl">{products.length}</span></h1>
        <Link href="/admin/products/new" className={btn}>+ Add product</Link>
      </header>

      <form method="get" className="mb-6">
        <input name="q" defaultValue={q} placeholder="Search products" className={field} />
      </form>

      {products.length === 0 ? (
        <div className={`${card} p-10 text-center text-stone-500`}>No products yet. Tap Add product to create your first one.</div>
      ) : (
        <div className="space-y-3">
          {products.map((x) => {
            const id = String(x.id)
            const cost = costs.get(id) ?? 0
            const { price } = getPricing(x)
            const variants = x.product_variants ?? []
            const stock = variants.length ? variants.reduce((n, v) => n + (v.stock ?? 0), 0) : x.stock ?? 0
            const margin = price > 0 ? ((price - cost) / price) * 100 : 0
            const low = stock <= (x.low_stock_threshold ?? 3)
            const img = x.product_images?.[0]?.image_url
            return (
              <div key={id} className={`${card} p-4 flex gap-4`}>
                <div className="w-20 h-24 bg-stone-200 rounded shrink-0 overflow-hidden">
                  {img && <img src={img} alt={x.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold truncate">{x.name}</p>
                    {x.is_active === false && <span className="text-xs bg-stone-200 px-2 py-0.5 rounded-full">Hidden</span>}
                    {x.is_featured && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Featured</span>}
                  </div>
                  <p className="text-xs text-stone-500 mb-2">{x.categories?.name ?? 'No category'}</p>
                  <p className="text-sm">
                    <span className="font-medium">{formatPrice(price)}</span>
                    <span className="text-stone-400"> · cost {formatPrice(cost)} · </span>
                    <span className={margin >= 0 ? 'text-emerald-700' : 'text-red-600'}>{margin.toFixed(0)}% margin</span>
                  </p>
                  <p className={`text-sm mt-1 ${low ? 'text-red-600 font-medium' : 'text-stone-600'}`}>
                    {stock <= 0 ? 'Out of stock' : `${stock} in stock`}{low && stock > 0 ? ' (low)' : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm">
                    <Link href={`/admin/products/${id}`} className="font-medium underline underline-offset-4">Edit</Link>
                    <form action={toggleProduct}>
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="field" value="is_active" />
                      <input type="hidden" name="value" value={String(x.is_active === false)} />
                      <button className="text-stone-600 underline underline-offset-4">{x.is_active === false ? 'Show in store' : 'Hide'}</button>
                    </form>
                    <form action={toggleProduct}>
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="field" value="is_featured" />
                      <input type="hidden" name="value" value={String(!x.is_featured)} />
                      <button className="text-stone-600 underline underline-offset-4">{x.is_featured ? 'Unfeature' : 'Feature'}</button>
                    </form>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={id} />
                      <ConfirmButton message={`Delete ${x.name}? This cannot be undone.`} className="text-red-600 underline underline-offset-4">Delete</ConfirmButton>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
