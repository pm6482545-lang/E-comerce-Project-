import { store } from '@/lib/config'

export function formatPrice(value: number | string | null | undefined) {
  const n = Number(value ?? 0)
  return `${store.currency} ${Math.round(n).toLocaleString(store.locale)}`
}

export function getPricing(p: { price: number | string; sale_price?: number | string | null }) {
  const price = Number(p.price ?? 0)
  const sale = p.sale_price != null ? Number(p.sale_price) : 0
  if (sale > 0 && sale < price) return { price: sale, compareAt: price, onSale: true }
  return { price, compareAt: null as number | null, onSale: false }
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
