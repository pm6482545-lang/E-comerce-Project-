import { getAdmin } from '@/lib/supabaseAdmin'
import { getPricing } from '@/lib/format'
import SaleForm from '@/components/admin/SaleForm'
import type { SaleProduct } from '@/components/admin/SaleForm'
import type { Product } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function NewSalePage() {
  const db = getAdmin()
  const [p, c] = await Promise.all([
    db.from('products').select('id,name,price,sale_price,stock,product_variants(id,size,color,stock)').order('name'),
    db.from('product_costs').select('product_id,cost_price'),
  ])
  const costs = new Map<string, number>(((c.data ?? []) as { product_id: string; cost_price: number }[]).map((r) => [r.product_id, Number(r.cost_price)]))
  const products: SaleProduct[] = ((p.data ?? []) as Product[]).map((x) => ({
    id: String(x.id),
    name: x.name,
    price: getPricing(x).price,
    cost: costs.get(String(x.id)) ?? 0,
    stock: x.stock ?? 0,
    variants: (x.product_variants ?? []).map((v) => ({ id: String(v.id), label: [v.size, v.color].filter(Boolean).join(' / ') || 'Standard', stock: v.stock ?? 0 })),
  }))

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2">Record a sale</h1>
      <p className="text-stone-500 mb-6 text-sm">For walk-in, WhatsApp and Instagram sales. Stock is reduced and profit is calculated automatically.</p>
      <SaleForm products={products} />
    </div>
  )
}
