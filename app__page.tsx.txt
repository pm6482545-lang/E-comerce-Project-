import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ProductCard'
import { store, serif } from '@/lib/config'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'

export const revalidate = 60

const SELECT = '*, product_images(image_url), categories(name)'

async function getHomeData() {
  const [featured, latest] = await Promise.all([
    supabase.from('products').select(SELECT).eq('is_active', true).eq('is_featured', true).limit(4),
    supabase.from('products').select(SELECT).eq('is_active', true).order('created_at', { ascending: false }).limit(4),
  ])
  return {
    featured: (featured.data ?? []) as Product[],
    latest: (latest.data ?? []) as Product[],
  }
}

const perks = [
  { title: 'Fast delivery', text: `Free over ${formatPrice(store.freeDeliveryThreshold)}` },
  { title: 'M-Pesa and cards', text: 'Simple, secure checkout' },
  { title: 'Easy exchanges', text: 'Sizing not right? Tell us' },
  { title: 'WhatsApp support', text: 'Real people, quick replies' },
]

export default async function Home() {
  const { featured, latest } = await getHomeData()

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-stone-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-950 to-black" />
        <div className="relative max-w-7xl mx-auto px-6 py-28 md:py-40 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-amber-300/90 mb-6">New season collection</p>
          <h1 className="text-5xl md:text-7xl leading-tight mb-6" style={serif}>
            Elevate your style
          </h1>
          <p className="text-lg text-stone-300 max-w-xl mx-auto mb-10">
            Curated pieces designed for modern elegance, delivered to your door.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/shop" className="bg-white text-stone-900 hover:bg-stone-200 px-8 py-3.5 text-sm font-semibold tracking-wide transition">
              Shop the collection
            </Link>
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-stone-600 hover:border-white px-8 py-3.5 text-sm font-semibold tracking-wide transition"
            >
              Chat with us
            </a>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          {perks.map((p) => (
            <div key={p.title}>
              <p className="text-sm font-semibold text-stone-900">{p.title}</p>
              <p className="text-sm text-stone-500">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pt-20">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl md:text-4xl" style={serif}>Featured</h2>
            <Link href="/shop" className="text-sm font-medium underline underline-offset-4 hover:text-stone-600">View all</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {latest.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pt-20">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl md:text-4xl" style={serif}>New arrivals</h2>
            <Link href="/shop" className="text-sm font-medium underline underline-offset-4 hover:text-stone-600">Shop all</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {latest.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {featured.length === 0 && latest.length === 0 && (
        <section className="max-w-7xl mx-auto px-6 py-24 text-center text-stone-500">
          New products are on their way. Check back soon.
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pt-24">
        <div className="bg-stone-900 text-white px-8 py-14 text-center rounded-sm">
          <h2 className="text-3xl mb-3" style={serif}>Need help choosing?</h2>
          <p className="text-stone-300 mb-8">Message us on WhatsApp for sizing, styling and delivery questions.</p>
          <a
            href={`https://wa.me/${store.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-stone-900 hover:bg-stone-200 px-8 py-3.5 text-sm font-semibold tracking-wide transition"
          >
            Start a conversation
          </a>
        </div>
      </section>
    </div>
  )
}
