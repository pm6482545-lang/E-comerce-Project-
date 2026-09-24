import { getAdmin } from '@/lib/supabaseAdmin'
import { getPricing } from '@/lib/format'
import type { Product } from '@/lib/types'

export type MonthRow = {
  month: string
  orders: number
  revenue: number
  cost: number
  profit: number
  expenses: number
  net: number
}

const blank = (month: string): MonthRow => ({ month, orders: 0, revenue: 0, cost: 0, profit: 0, expenses: 0, net: 0 })

export async function getFinance() {
  const db = getAdmin()
  const [s, e] = await Promise.all([
    db.from('sales_summary').select('*'),
    db.from('expense_summary').select('*'),
  ])
  const map = new Map<string, MonthRow>()
  for (const r of (s.data ?? []) as { month: string; orders: number; revenue: number; cost: number }[]) {
    const m = map.get(r.month) ?? blank(r.month)
    m.orders = Number(r.orders)
    m.revenue = Number(r.revenue)
    m.cost = Number(r.cost)
    map.set(r.month, m)
  }
  for (const r of (e.data ?? []) as { month: string; total: number }[]) {
    const m = map.get(r.month) ?? blank(r.month)
    m.expenses = Number(r.total)
    map.set(r.month, m)
  }
  const rows = Array.from(map.values())
    .map((m) => ({ ...m, profit: m.revenue - m.cost, net: m.revenue - m.cost - m.expenses }))
    .sort((a, b) => b.month.localeCompare(a.month))

  const total = rows.reduce((t, r) => {
    t.orders += r.orders; t.revenue += r.revenue; t.cost += r.cost
    t.profit += r.profit; t.expenses += r.expenses; t.net += r.net
    return t
  }, blank('total'))

  // current month key in Kenya time (UTC+3)
  const key = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 7) + '-01'
  const current = rows.find((r) => r.month === key) ?? blank(key)
  return { rows, total, current }
}

export type StockRow = { id: string; name: string; label: string | null; stock: number; threshold: number }

export async function getInventory() {
  const db = getAdmin()
  const [p, c] = await Promise.all([
    db.from('products').select('id,name,price,sale_price,stock,low_stock_threshold,is_active,product_variants(id,size,color,stock)'),
    db.from('product_costs').select('product_id,cost_price'),
  ])
  const costs = new Map<string, number>(
    ((c.data ?? []) as { product_id: string; cost_price: number }[]).map((r) => [r.product_id, Number(r.cost_price)])
  )
  let atCost = 0
  let atRetail = 0
  let units = 0
  const low: StockRow[] = []
  for (const prod of (p.data ?? []) as Product[]) {
    if (prod.is_active === false) continue
    const cost = costs.get(String(prod.id)) ?? 0
    const price = getPricing(prod).price
    const threshold = prod.low_stock_threshold ?? 3
    const variants = prod.product_variants ?? []
    if (variants.length > 0) {
      for (const v of variants) {
        const st = v.stock ?? 0
        units += st; atCost += st * cost; atRetail += st * price
        if (st <= threshold) low.push({ id: String(v.id), name: prod.name, label: [v.size, v.color].filter(Boolean).join(' / ') || null, stock: st, threshold })
      }
    } else {
      const st = prod.stock ?? 0
      units += st; atCost += st * cost; atRetail += st * price
      if (st <= threshold) low.push({ id: String(prod.id), name: prod.name, label: null, stock: st, threshold })
    }
  }
  low.sort((a, b) => a.stock - b.stock)
  return { atCost, atRetail, units, low }
}
