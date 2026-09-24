'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { saveProduct } from '@/app/admin/actions'
import { slugify } from '@/lib/format'
import { field, label, btn, btnGhost, card } from '@/components/admin/ui'

export type ProductFormData = {
  id?: string
  name: string
  slug: string
  category_id: string
  price: string
  sale_price: string
  cost_price: string
  description: string
  material_care: string
  stock: string
  low_stock_threshold: string
  is_active: boolean
  is_featured: boolean
  variants: { id?: string; size: string; color: string; stock: string }[]
  images: { id: string; image_url: string }[]
}

async function compress(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export default function ProductForm({ initial, categories }: { initial: ProductFormData; categories: { id: string; name: string }[] }) {
  const [d, setD] = useState<ProductFormData>(initial)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id))
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) => setD((p) => ({ ...p, [k]: v }))

  const cost = Number(d.cost_price) || 0
  const price = Number(d.sale_price) > 0 ? Number(d.sale_price) : Number(d.price) || 0
  const profit = price - cost

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    start(async () => {
      const fd = new FormData()
      fd.set('id', d.id ?? '')
      ;(['name', 'slug', 'category_id', 'price', 'sale_price', 'cost_price', 'description', 'material_care', 'stock', 'low_stock_threshold'] as const).forEach((k) => fd.set(k, d[k]))
      fd.set('is_active', String(d.is_active))
      fd.set('is_featured', String(d.is_featured))
      fd.set('variants', JSON.stringify(d.variants))
      fd.set('keepImages', JSON.stringify(d.images.map((i) => i.id)))
      const compressed = await Promise.all(files.map(compress))
      compressed.forEach((f) => fd.append('photos', f))
      const res = await saveProduct(fd)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <section className={`${card} p-5 space-y-4`}>
        <h2 className="font-semibold">Basics</h2>
        <div>
          <label className={label}>Product name</label>
          <input required className={field} value={d.name} onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)) }} placeholder="Linen Wrap Dress" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Category</label>
            <select className={field} value={d.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Link href="/admin/categories" className="text-xs text-stone-500 underline underline-offset-4 mt-1 inline-block">Manage categories</Link>
          </div>
          <div>
            <label className={label}>URL name (slug)</label>
            <input className={field} value={d.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)) }} />
          </div>
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea rows={4} className={field} value={d.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the fit, feel and occasion" />
        </div>
        <div>
          <label className={label}>Material and care</label>
          <input className={field} value={d.material_care} onChange={(e) => set('material_care', e.target.value)} placeholder="100% cotton. Wash cold." />
        </div>
      </section>

      <section className={`${card} p-5 space-y-4`}>
        <h2 className="font-semibold">Pricing and capital</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Cost price (capital)</label>
            <input required inputMode="decimal" className={field} value={d.cost_price} onChange={(e) => set('cost_price', e.target.value)} placeholder="2000" />
          </div>
          <div>
            <label className={label}>Selling price</label>
            <input required inputMode="decimal" className={field} value={d.price} onChange={(e) => set('price', e.target.value)} placeholder="4500" />
          </div>
          <div>
            <label className={label}>Sale price (optional)</label>
            <input inputMode="decimal" className={field} value={d.sale_price} onChange={(e) => set('sale_price', e.target.value)} placeholder="3800" />
          </div>
        </div>
        {price > 0 && (
          <p className={`text-sm ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            Profit per item: KES {Math.round(profit).toLocaleString('en-KE')} ({((profit / price) * 100).toFixed(0)}% margin)
          </p>
        )}
      </section>

      <section className={`${card} p-5 space-y-4`}>
        <h2 className="font-semibold">Sizes and stock</h2>
        {d.variants.length === 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Quantity in stock</label>
              <input inputMode="numeric" className={field} value={d.stock} onChange={(e) => set('stock', e.target.value)} />
            </div>
            <div>
              <label className={label}>Low stock alert at</label>
              <input inputMode="numeric" className={field} value={d.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {d.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_5rem_auto] gap-2 items-end">
                <div><label className="text-xs text-stone-500">Size</label><input className={field} value={v.size} placeholder="M" onChange={(e) => set('variants', d.variants.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} /></div>
                <div><label className="text-xs text-stone-500">Color</label><input className={field} value={v.color} placeholder="Black" onChange={(e) => set('variants', d.variants.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} /></div>
                <div><label className="text-xs text-stone-500">Stock</label><input inputMode="numeric" className={field} value={v.stock} onChange={(e) => set('variants', d.variants.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} /></div>
                <button type="button" onClick={() => set('variants', d.variants.filter((_, j) => j !== i))} className="h-10 px-2 text-red-600 text-sm">Remove</button>
              </div>
            ))}
            <div className="max-w-[12rem]">
              <label className={label}>Low stock alert at</label>
              <input inputMode="numeric" className={field} value={d.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value)} />
            </div>
          </div>
        )}
        <button type="button" className={btnGhost} onClick={() => set('variants', [...d.variants, { size: '', color: '', stock: '0' }])}>
          + Add size or color option
        </button>
        <p className="text-xs text-stone-500">Leave options empty for items with a single version, like a bag.</p>
      </section>

      <section className={`${card} p-5 space-y-4`}>
        <h2 className="font-semibold">Photos</h2>
        {d.images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {d.images.map((im) => (
              <div key={im.id} className="relative w-24 h-28 bg-stone-200 rounded overflow-hidden">
                <img src={im.image_url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => set('images', d.images.filter((x) => x.id !== im.id))} className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded px-1.5 py-0.5">Remove</button>
              </div>
            ))}
          </div>
        )}
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="block text-sm" />
        {files.length > 0 && <p className="text-xs text-stone-500">{files.length} new photo(s) will be resized and uploaded. Add up to 8 at a time. The first photo is the main one.</p>}
      </section>

      <section className={`${card} p-5 flex flex-wrap gap-6`}>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-stone-900 h-4 w-4" checked={d.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Visible in store</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-stone-900 h-4 w-4" checked={d.is_featured} onChange={(e) => set('is_featured', e.target.checked)} /> Featured on home page</label>
      </section>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={btn}>{pending ? 'Saving…' : d.id ? 'Save changes' : 'Create product'}</button>
        <Link href="/admin/products" className={btnGhost}>Cancel</Link>
      </div>
    </form>
  )
}
