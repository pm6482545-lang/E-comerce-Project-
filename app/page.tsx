import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ProductCard'
import { store, serif } from '@/lib/config'
import { formatPrice, getPricing } from '@/lib/format'
import type { Product } from '@/lib/types'

export const revalidate = 60

const SELECT = '*, product_images(image_url), product_variants(id,stock), categories(name)'

async function getHomeData() {
  const [featured, latest, deals, cats] = await Promise.all([
    supabase.from('products').select(SELECT).eq('is_active', true).eq('is_featured', true).limit(10),
    supabase.from('products').select(SELECT).eq('is_active', true).order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select(SELECT).eq('is_active', true).not('sale_price', 'is', null).limit(30),
    supabase.from('categories').select('id,name').order('name'),
  ])
  return {
    featured: (featured.data ?? []) as Product[],
    latest: (latest.data ?? []) as Product[],
    deals: ((deals.data ?? []) as Product[]).filter((p) => getPricing(p).onSale).slice(0, 10),
    categories: (cats.data ?? []) as { id: string; name: string }[],
  }
}

const banners = [
  { eyebrow: 'New season', title: 'Dress the moment', text: 'Fresh arrivals, curated for you.', cta: 'Shop new arrivals', href: '/shop', bg: 'from-stone-950 via-stone-900 to-stone-700' },
  { eyebrow: 'Limited offers', title: 'Hot deals this week', text: 'Great prices on selected pieces.', cta: 'See all deals', href: '/shop?deals=1', bg: 'from-orange-700 via-orange-600 to-amber-500' },
  { eyebrow: 'Delivery', title: 'Free delivery', text: `On every order over ${formatPrice(store.freeDeliveryThreshold)}.`, cta: 'Start shopping', href: '/shop', bg: 'from-emerald-900 via-emerald-800 to-emerald-600' },
]

const perks = [
  { title: 'Fast delivery', text: `Free over ${formatPrice(store.freeDeliveryThreshold)}` },
  { title: 'M-Pesa and cards', text: 'Simple, secure checkout' },
  { title: 'Easy exchanges', text: 'Wrong size? Tell us' },
  { title: 'WhatsApp support', text: 'Real people, quick replies' },
]

function Section({ title, href, children, tint }: { title: string; href: string; children: React.ReactNode; tint?: string }) {
  return (
    <section className={`max-w-7xl mx-auto px-4 md:px-6 mt-8 ${tint ?? ''}`}>
      <div className="flex items-center justify-between py-4">
        <h2 className="text-xl md:text-2xl font-bold text-stone-900">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-orange-600 hover:text-orange-700">See all →</Link>
      </div>
      {children}
    </section>
  )
}

const grid = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4'

export default async function Home() {
  const { featured, latest, deals, categories } = await getHomeData()

  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-4 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex overflow-x-auto snap-x snap-mandatory gap-3 no-scrollbar rounded-xl">
          {banners.map((b) => (
            <div key={b.title} className={`snap-start shrink-0 min-w-[92%] md:min-w-full bg-gradient-to-br ${b.bg} text-white rounded-xl px-8 md:px-14 py-12 md:py-20 flex flex-col justify-center`}>
              <p className="text-xs tracking-[0.3em] uppercase text-white/70 mb-4">{b.eyebrow}</p>
              <h1 className="text-4xl md:text-6xl leading-tight mb-3" style={serif}>{b.title}</h1>
              <p className="text-white/80 mb-8 max-w-md">{b.text}</p>
              <Link href={b.href} className="self-start bg-white text-stone-900 hover:bg-stone-100 px-7 py-3 text-sm font-semibold rounded-md transition">{b.cta}</Link>
            </div>
          ))}
        </div>
        <div className="hidden lg:grid grid-rows-2 gap-4">
          <Link href="/shop?deals=1" className="rounded-xl bg-orange-50 border border-orange-200 p-6 flex flex-col justify-center hover:shadow-md transition">
            <p className="text-xs uppercase tracking-widest text-orange-700 mb-2">Save more</p>
            <p className="text-xl font-bold text-stone-900">Browse hot deals</p>
            <p className="text-sm text-stone-600 mt-1">Reduced prices, limited stock.</p>
          </Link>
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white border border-stone-200 p-6 flex flex-col justify-center hover:shadow-md transition">
            <p className="text-xs uppercase tracking-widest text-emerald-700 mb-2">Need help?</p>
            <p className="text-xl font-bold text-stone-900">Order on WhatsApp</p>
            <p className="text-sm text-stone-600 mt-1">Quick answers and styling advice.</p>
          </a>
        </div>
      </section>

      {/* Perks */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-4">
        <div className="bg-white border border-stone-200 rounded-xl grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-stone-100">
          {perks.map((p) => (
            <div key={p.title} className="p-4 md:p-5">
              <p className="text-sm font-semibold text-stone-900">{p.title}</p>
              <p className="text-xs md:text-sm text-stone-500">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <Section title="Shop by category" href="/shop">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((c) => (
              <Link key={c.id} href={`/shop?category=${encodeURIComponent(c.name)}`} className="bg-white border border-stone-200 rounded-lg p-5 hover:border-orange-500 hover:shadow-md transition group">
                <p className="font-semibold text-stone-900 group-hover:text-orange-600">{c.name}</p>
                <p className="text-xs text-stone-500 mt-1">Shop now →</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Deals */}
      {deals.length > 0 && (
        <div className="mt-8 bg-orange-50 border-y border-orange-100 pb-6">
          <Section title="Hot deals" href="/shop?deals=1">
            <div className={grid}>{deals.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          </Section>
        </div>
      )}

      {featured.length > 0 && (
        <Section title="Top picks" href="/shop">
          <div className={grid}>{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      {latest.length > 0 && (
        <Section title="New arrivals" href="/shop">
          <div className={grid}>{latest.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      )}

      {featured.length === 0 && latest.length === 0 && (
        <section className="max-w-7xl mx-auto px-6 py-24 text-center text-stone-500">New products are on their way. Check back soon.</section>
      )}

      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-12">
        <div className="bg-stone-950 text-white rounded-xl px-8 py-12 text-center">
          <h2 className="text-3xl mb-3" style={serif}>Need help choosing?</h2>
          <p className="text-stone-300 mb-7">Message us on WhatsApp for sizing, styling and delivery questions.</p>
          <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-block bg-orange-600 hover:bg-orange-700 px-8 py-3 text-sm font-semibold rounded-md transition">
            Start a conversation
          </a>
        </div>
      </section>
    </div>
  )
}
