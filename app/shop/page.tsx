import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ProductCard'
import { getPricing } from '@/lib/format'
import type { Product } from '@/lib/types'

export const revalidate = 60
export const metadata: Metadata = { title: 'Shop' }

type SP = { q?: string; category?: string; sort?: string; min?: string; max?: string; deals?: string }

async function getProducts() {
  const { data } = await supabase
    .from('products')
    .select('*, product_images(image_url), product_variants(id,stock), categories(name)')
    .eq('is_active', true)
  return (data ?? []) as Product[]
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const { q = '', category = '', sort = 'newest', min = '', max = '', deals = '' } = sp
  const all = await getProducts()

  const categories = Array.from(new Set(all.map((p) => p.categories?.name).filter((n): n is string => Boolean(n)))).sort()

  const minP = Number(min) || 0
  const maxP = Number(max) || Infinity
  let products = all.filter((p) => {
    const price = getPricing(p).price
    if (price < minP || price > maxP) return false
    if (category && p.categories?.name !== category) return false
    if (deals === '1' && !getPricing(p).onSale) return false
    if (q) {
      const t = q.toLowerCase()
      if (!p.name.toLowerCase().includes(t) && !(p.description ?? '').toLowerCase().includes(t)) return false
    }
    return true
  })
  products = [...products].sort((a, b) => {
    if (sort === 'price-asc') return getPricing(a).price - getPricing(b).price
    if (sort === 'price-desc') return getPricing(b).price - getPricing(a).price
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })

  const href = (over: Partial<SP>) => {
    const merged: SP = { q, category, sort, min, max, deals, ...over }
    const params = new URLSearchParams()
    if (merged.q) params.set('q', merged.q)
    if (merged.category) params.set('category', merged.category)
    if (merged.sort && merged.sort !== 'newest') params.set('sort', merged.sort)
    if (merged.min) params.set('min', merged.min)
    if (merged.max) params.set('max', merged.max)
    if (merged.deals === '1') params.set('deals', '1')
    const s = params.toString()
    return s ? `/shop?${s}` : '/shop'
  }

  const linkCls = (active: boolean) => `block py-1.5 text-sm ${active ? 'font-semibold text-orange-600' : 'text-stone-700 hover:text-orange-600'}`
  const inputCls = 'w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange-600'

  const filters = (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold text-stone-900 mb-2">Category</p>
        <Link href={href({ category: '' })} className={linkCls(!category)}>All products</Link>
        {categories.map((c) => <Link key={c} href={href({ category: c })} className={linkCls(category === c)}>{c}</Link>)}
      </div>
      <div>
        <p className="text-sm font-bold text-stone-900 mb-2">Offers</p>
        <Link href={href({ deals: deals === '1' ? '' : '1' })} className={linkCls(deals === '1')}>{deals === '1' ? '✓ ' : ''}Hot deals only</Link>
      </div>
      <form action="/shop" method="get">
        <p className="text-sm font-bold text-stone-900 mb-2">Price (KES)</p>
        {q && <input type="hidden" name="q" value={q} />}
        {category && <input type="hidden" name="category" value={category} />}
        {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
        {deals === '1' && <input type="hidden" name="deals" value="1" />}
        <div className="flex gap-2 mb-2">
          <input name="min" defaultValue={min} inputMode="numeric" placeholder="Min" className={inputCls} />
          <input name="max" defaultValue={max} inputMode="numeric" placeholder="Max" className={inputCls} />
        </div>
        <button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-md py-2 transition">Apply</button>
      </form>
    </div>
  )

  const sortCls = (active: boolean) => `px-3 py-1.5 text-xs rounded-full border whitespace-nowrap ${active ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-300 text-stone-700'}`

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">{category || (deals === '1' ? 'Hot deals' : q ? `Results for "${q}"` : 'All products')}</h1>
        <p className="text-sm text-stone-500 mt-1">{products.length} {products.length === 1 ? 'item' : 'items'}</p>
      </div>

      <div className="lg:grid lg:grid-cols-[230px_1fr] gap-8 items-start">
        <aside className="hidden lg:block bg-white border border-stone-200 rounded-lg p-5 sticky top-40">{filters}</aside>

        <div>
          <details className="lg:hidden bg-white border border-stone-200 rounded-lg mb-4">
            <summary className="px-4 py-3 text-sm font-semibold cursor-pointer">Filters</summary>
            <div className="px-4 pb-4">{filters}</div>
          </details>

          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
            <Link href={href({ sort: 'newest' })} className={sortCls(sort === 'newest')}>Newest</Link>
            <Link href={href({ sort: 'price-asc' })} className={sortCls(sort === 'price-asc')}>Price: low to high</Link>
            <Link href={href({ sort: 'price-desc' })} className={sortCls(sort === 'price-desc')}>Price: high to low</Link>
          </div>

          {products.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-lg text-center py-20 text-stone-500">
              <p className="mb-4">No products match your filters.</p>
              <Link href="/shop" className="text-orange-600 font-semibold">Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
