'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/supabaseAdmin'
import { slugify } from '@/lib/format'

const BUCKET = 'product-images'

const num = (v: FormDataEntryValue | null | undefined) => {
  const n = Number(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}
const int = (v: FormDataEntryValue | null | undefined) => Math.max(0, Math.floor(num(v)))
const text = (v: FormDataEntryValue | null | undefined) => String(v ?? '').trim()

function friendly(msg: string) {
  if (msg.toLowerCase().includes('duplicate')) return 'That URL name (slug) or SKU already exists. Change the product name or slug.'
  return msg
}

function refreshStore(slug?: string) {
  revalidatePath('/')
  revalidatePath('/shop')
  if (slug) revalidatePath(`/products/${slug}`)
}

/* ---------------- Products ---------------- */

type VariantIn = { id?: string; size?: string; color?: string; stock?: string | number }

export async function saveProduct(fd: FormData): Promise<{ error: string } | undefined> {
  const db = getAdmin()
  const id = text(fd.get('id'))
  const name = text(fd.get('name'))
  const price = num(fd.get('price'))
  if (!name) return { error: 'Product name is required.' }
  if (price <= 0) return { error: 'Enter a selling price.' }

  const slug = slugify(text(fd.get('slug')) || name)
  const sale = num(fd.get('sale_price'))
  const row = {
    name,
    slug,
    category_id: text(fd.get('category_id')) || null,
    description: text(fd.get('description')) || null,
    material_care: text(fd.get('material_care')) || null,
    price,
    sale_price: sale > 0 ? sale : null,
    stock: int(fd.get('stock')),
    low_stock_threshold: int(fd.get('low_stock_threshold')) || 3,
    is_active: fd.get('is_active') === 'true',
    is_featured: fd.get('is_featured') === 'true',
    updated_at: new Date().toISOString(),
  }

  let productId = id
  if (id) {
    const { error } = await db.from('products').update(row).eq('id', id)
    if (error) return { error: friendly(error.message) }
  } else {
    const { data, error } = await db.from('products').insert(row).select('id').single()
    if (error || !data) return { error: friendly(error?.message ?? 'Could not save product.') }
    productId = data.id as string
  }

  // capital (cost price) lives in a private table
  const { error: costErr } = await db
    .from('product_costs')
    .upsert({ product_id: productId, cost_price: Math.max(0, num(fd.get('cost_price'))) })
  if (costErr) return { error: `Saved, but cost price failed: ${costErr.message}. Did you run the SQL update?` }

  // variants
  let incoming: VariantIn[] = []
  try { incoming = JSON.parse(text(fd.get('variants')) || '[]') as VariantIn[] } catch {}
  const clean = incoming.filter((v) => (v.size ?? '').trim() || (v.color ?? '').trim())
  const { data: existing } = await db.from('product_variants').select('id').eq('product_id', productId)
  const keep = new Set(clean.map((v) => v.id).filter((v): v is string => Boolean(v)))
  const remove = ((existing ?? []) as { id: string }[]).map((v) => v.id).filter((v) => !keep.has(v))
  if (remove.length) await db.from('product_variants').delete().in('id', remove)
  for (const v of clean) {
    const payload = { size: (v.size ?? '').trim() || null, color: (v.color ?? '').trim() || null, stock: int(String(v.stock ?? 0)) }
    if (v.id) await db.from('product_variants').update(payload).eq('id', v.id)
    else await db.from('product_variants').insert({ ...payload, product_id: productId })
  }

  // images: drop removed ones, upload new ones
  let keepImgs: string[] = []
  try { keepImgs = JSON.parse(text(fd.get('keepImages')) || '[]') as string[] } catch {}
  if (id) {
    const { data: imgs } = await db.from('product_images').select('id,image_url').eq('product_id', productId)
    const gone = ((imgs ?? []) as { id: string; image_url: string }[]).filter((i) => !keepImgs.includes(i.id))
    if (gone.length) {
      await db.from('product_images').delete().in('id', gone.map((i) => i.id))
      const paths = gone.map((i) => i.image_url.split(`/${BUCKET}/`)[1]).filter((p): p is string => Boolean(p))
      if (paths.length) await db.storage.from(BUCKET).remove(paths)
    }
  }
  const files = fd.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
  let i = 0
  for (const file of files) {
    const path = `${productId}/${Date.now()}-${i}.jpg`
    const { error: upErr } = await db.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'image/jpeg' })
    if (upErr) return { error: `Product saved, but a photo failed to upload: ${upErr.message}` }
    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path)
    await db.from('product_images').insert({ product_id: productId, image_url: pub.publicUrl, sort_order: keepImgs.length + i })
    i++
  }

  refreshStore(slug)
  redirect('/admin/products')
}

export async function deleteProduct(fd: FormData): Promise<void> {
  const db = getAdmin()
  const id = text(fd.get('id'))
  if (!id) return
  const { data: imgs } = await db.from('product_images').select('image_url').eq('product_id', id)
  const paths = ((imgs ?? []) as { image_url: string }[])
    .map((i) => i.image_url.split(`/${BUCKET}/`)[1])
    .filter((p): p is string => Boolean(p))
  if (paths.length) await db.storage.from(BUCKET).remove(paths)
  await db.from('products').delete().eq('id', id)
  refreshStore()
  redirect('/admin/products')
}

export async function toggleProduct(fd: FormData): Promise<void> {
  const db = getAdmin()
  const field = text(fd.get('field'))
  if (field !== 'is_active' && field !== 'is_featured') return
  await db.from('products').update({ [field]: text(fd.get('value')) === 'true' }).eq('id', text(fd.get('id')))
  refreshStore()
  redirect('/admin/products')
}

/* ---------------- Categories ---------------- */

export async function createCategory(fd: FormData): Promise<void> {
  const name = text(fd.get('name'))
  if (!name) redirect('/admin/categories')
  const { error } = await getAdmin().from('categories').insert({ name, slug: slugify(name) })
  refreshStore()
  redirect(error ? `/admin/categories?error=${encodeURIComponent(friendly(error.message))}` : '/admin/categories')
}

export async function deleteCategory(fd: FormData): Promise<void> {
  await getAdmin().from('categories').delete().eq('id', text(fd.get('id')))
  refreshStore()
  redirect('/admin/categories')
}

/* ---------------- Sales & orders ---------------- */

type SaleIn = {
  customerName: string
  phone: string
  source: string
  paymentMethod: string
  status: string
  deliveryFee: number
  notes: string
  lines: { productId: string; variantId: string; quantity: number; price: number }[]
}

export async function createSale(payload: string): Promise<{ error: string } | undefined> {
  let s: SaleIn
  try { s = JSON.parse(payload) as SaleIn } catch { return { error: 'Invalid sale.' } }
  if (!s.lines?.length) return { error: 'Add at least one item.' }
  if (s.lines.some((l) => !l.productId || l.quantity < 1 || l.price < 0)) return { error: 'Check the items: quantity and price must be valid.' }

  const { error } = await getAdmin().rpc('create_order', {
    p_customer_name: s.customerName || null,
    p_phone: s.phone || null,
    p_email: null,
    p_source: s.source || 'walk-in',
    p_delivery_method: 'delivery',
    p_address: null,
    p_city: null,
    p_notes: s.notes || null,
    p_payment_method: s.paymentMethod || null,
    p_status: s.status === 'pending' ? 'pending' : 'paid',
    p_delivery_fee: Math.max(0, Number(s.deliveryFee) || 0),
    p_items: s.lines.map((l) => ({
      product_id: l.productId,
      variant_id: l.variantId || null,
      quantity: Math.floor(l.quantity),
      unit_price: l.price,
    })),
  })
  if (error) return { error: error.message }
  refreshStore()
  redirect('/admin/orders')
}

export async function updateOrderStatus(fd: FormData): Promise<void> {
  const { error } = await getAdmin().rpc('set_order_status', {
    p_order: text(fd.get('id')),
    p_status: text(fd.get('status')),
  })
  refreshStore()
  redirect(error ? `/admin/orders?error=${encodeURIComponent(error.message)}` : '/admin/orders')
}

/* ---------------- Expenses ---------------- */

export async function addExpense(fd: FormData): Promise<void> {
  const amount = num(fd.get('amount'))
  const description = text(fd.get('description'))
  if (amount <= 0 || !description) redirect('/admin/finance')
  await getAdmin().from('expenses').insert({
    description,
    category: text(fd.get('category')) || 'Other',
    amount,
    spent_on: text(fd.get('spent_on')) || new Date().toISOString().slice(0, 10),
  })
  redirect('/admin/finance')
}

export async function deleteExpense(fd: FormData): Promise<void> {
  await getAdmin().from('expenses').delete().eq('id', text(fd.get('id')))
  redirect('/admin/finance')
}
