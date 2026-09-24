import { notFound } from 'next/navigation'
import { getAdmin } from '@/lib/supabaseAdmin'
import ProductForm from '@/components/admin/ProductForm'
import type { Product } from '@/lib/types'

export const dynamic = 'force-dynamic'

type Img = { id: string; image_url: string; sort_order: number | null }
type Full = Product & { product_images: Img[]; product_variants: { id: string; size: string | null; color: string | null; stock: number | null }[] }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getAdmin()
  const [p, cats, cost] = await Promise.all([
    db.from('products').select('*, product_images(id,image_url,sort_order), product_variants(id,size,color,stock)').eq('id', id).single(),
    db.from('categories').select('id,name').order('name'),
    db.from('product_costs').select('cost_price').eq('product_id', id).maybeSingle(),
  ])
  const x = p.data as Full | null
  if (!x) notFound()

  const images = [...(x.product_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Edit product</h1>
      <ProductForm
        categories={(cats.data ?? []) as { id: string; name: string }[]}
        initial={{
          id: String(x.id),
          name: x.name,
          slug: x.slug,
          category_id: x.category_id ? String(x.category_id) : '',
          price: String(x.price ?? ''),
          sale_price: x.sale_price ? String(x.sale_price) : '',
          cost_price: cost.data ? String((cost.data as { cost_price: number }).cost_price) : '',
          description: x.description ?? '',
          material_care: x.material_care ?? '',
          stock: String(x.stock ?? 0),
          low_stock_threshold: String(x.low_stock_threshold ?? 3),
          is_active: x.is_active !== false,
          is_featured: Boolean(x.is_featured),
          variants: (x.product_variants ?? []).map((v) => ({ id: v.id, size: v.size ?? '', color: v.color ?? '', stock: String(v.stock ?? 0) })),
          images: images.map((i) => ({ id: i.id, image_url: i.image_url })),
        }}
      />
    </div>
  )
}
