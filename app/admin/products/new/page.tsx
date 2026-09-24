import { getAdmin } from '@/lib/supabaseAdmin'
import ProductForm from '@/components/admin/ProductForm'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const { data } = await getAdmin().from('categories').select('id,name').order('name')
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Add product</h1>
      <ProductForm
        categories={(data ?? []) as { id: string; name: string }[]}
        initial={{ name: '', slug: '', category_id: '', price: '', sale_price: '', cost_price: '', description: '', material_care: '', stock: '0', low_stock_threshold: '3', is_active: true, is_featured: false, variants: [], images: [] }}
      />
    </div>
  )
}
