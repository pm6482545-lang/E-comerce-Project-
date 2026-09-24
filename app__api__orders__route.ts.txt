import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/supabaseAdmin'
import { getPricing } from '@/lib/format'
import { store } from '@/lib/config'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PHONE = /^(?:\+?254|0)?[17]\d{8}$/

type Item = { productId?: string; variantId?: string; quantity?: number }
type Body = {
  name?: string; phone?: string; email?: string; delivery?: string
  address?: string; city?: string; notes?: string; payment?: string; items?: Item[]
}

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n)

export async function POST(req: Request) {
  let b: Body
  try { b = (await req.json()) as Body } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const name = clip(b.name, 100)
  const phone = clip(b.phone, 20).replace(/\s/g, '')
  const email = clip(b.email, 150)
  const pickup = b.delivery === 'pickup'
  const items = Array.isArray(b.items) ? b.items : []

  if (name.length < 2) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  if (!PHONE.test(phone)) return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })
  if (items.length < 1 || items.length > 30) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
  for (const i of items) {
    if (!i.productId || !UUID.test(i.productId) || (i.variantId && !UUID.test(i.variantId))) return NextResponse.json({ error: 'Invalid item.' }, { status: 400 })
    if (!Number.isInteger(i.quantity) || (i.quantity as number) < 1 || (i.quantity as number) > 20) return NextResponse.json({ error: 'Invalid quantity.' }, { status: 400 })
  }

  const db = getAdmin()
  const ids = Array.from(new Set(items.map((i) => i.productId as string)))
  const { data: prods } = await db.from('products').select('id,price,sale_price,is_active').in('id', ids)
  const priceMap = new Map<string, number>()
  for (const p of (prods ?? []) as { id: string; price: number; sale_price: number | null; is_active: boolean }[]) {
    if (p.is_active) priceMap.set(p.id, getPricing(p).price)
  }
  if (priceMap.size !== ids.length) return NextResponse.json({ error: 'A product in your cart is no longer available.' }, { status: 409 })

  const subtotal = items.reduce((n, i) => n + (priceMap.get(i.productId as string) ?? 0) * (i.quantity as number), 0)
  const deliveryFee = pickup || subtotal >= store.freeDeliveryThreshold ? 0 : store.deliveryFee

  const { data: ref, error } = await db.rpc('create_order', {
    p_customer_name: name,
    p_phone: phone,
    p_email: email || null,
    p_source: 'web',
    p_delivery_method: pickup ? 'pickup' : 'delivery',
    p_address: pickup ? null : clip(b.address, 200) || null,
    p_city: pickup ? null : clip(b.city, 80) || null,
    p_notes: clip(b.notes, 500) || null,
    p_payment_method: b.payment === 'card' ? 'card' : 'mpesa',
    p_status: 'pending',
    p_delivery_fee: deliveryFee,
    p_items: items.map((i) => ({ product_id: i.productId, variant_id: i.variantId || null, quantity: i.quantity })),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 409 })

  return NextResponse.json({ ref: ref as string, subtotal, deliveryFee, total: subtotal + deliveryFee })
}
