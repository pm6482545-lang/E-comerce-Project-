import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ProductCard'
import { serif } from '@/lib/config'
import { getPricing } from '@/lib/format'
import type { Product } from '@/lib/types'

export const revalidate = 60
export const metadata: Metadata = { title: 'Shop' }

type SearchParams = { q?: string; category?: string; sort?: string }

async function getProducts() {
  const { data } = await supabase
    .from('products')
    .select('*, product_images(image_url), categories(name)')
    .eq('is_active', true)
  return (data ?? []) as Product[]
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q = '', category = '', sort = 'newest' } = await searchParams
  const all = await getProducts()

  const categories = Array.from(
    new Set(all.map((p) => p.categories?.name).filter((n): n is string => Boolean(n)))
  ).sort()

  let products = all
  if (category) products = products.filter((p) => p.categories?.name === category)
  if (q) {
    const term = q.toLowerCase()
    products = products.filter(
      (p) => p.name.toLowerCase().includes(term) || (p.description ?? '').toLowerCase().includes(term)
    )
  }
  products = [...products].sort((a, b) => {
    if (sort === 'price-asc') return getPricing(a).price - getPricing(b).price
    if (sort === 'price-desc') return getPricing(b).price - getPricing(a).price
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })

  const hrefFor = (c: string) => {
    const params = new URLSearchParams()
    if (c) params.set('category', c)
    if (q) params.set('q', q)
    if (sort !== 'newest') params.set('sort', sort)
    const s = params.toString()
    return s ? `/shop?${s}` : '/shop'
  }

  const chip = (active: boolean) =>
    `px-4 py-2 text-sm border transition ${
      active ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 text-stone-700 hover:border-stone-900'
    }`

  return (
    <div className="max-w-7xl mx-auto px-6 pt-14">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl mb-2" style={serif}>Shop</h1>
        <p className="text-stone-500">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</p>
      </div>

      <form action="/shop" method="get" className="flex flex-col md:flex-row gap-3 mb-6">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search products"
          className="flex-1 border border-stone-300 bg-white px-4 py-3 text-sm focus:outline-none focus:border-stone-900"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="border border-stone-300 bg-white px-4 py-3 text-sm focus:outline-none focus:border-stone-900"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <button type="submit" className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 text-sm font-semibold transition">
          Apply
        </button>
      </form>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          <Link href={hrefFor('')} className={chip(!category)}>All</Link>
          {categories.map((c) => (
            <Link key={c} href={hrefFor(c)} className={chip(category === c)}>{c}</Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-24 text-stone-500">
          <p className="mb-4">No products match your search.</p>
          <Link href="/shop" className="underline underline-offset-4 text-stone-900">Clear filters</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
