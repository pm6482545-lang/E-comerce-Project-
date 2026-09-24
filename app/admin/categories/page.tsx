import { getAdmin } from '@/lib/supabaseAdmin'
import { createCategory, deleteCategory } from '@/app/admin/actions'
import ConfirmButton from '@/components/admin/ConfirmButton'
import { card, field, btn } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const { data } = await getAdmin().from('categories').select('id,name,slug, products(count)').order('name')
  const cats = (data ?? []) as { id: string; name: string; slug: string; products: { count: number }[] }[]

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold mb-6">Categories</h1>
      <form action={createCategory} className="flex gap-2 mb-2">
        <input name="name" required placeholder="New category, e.g. Shoes" className={field} />
        <button className={btn}>Add</button>
      </form>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className={`${card} divide-y divide-stone-100 mt-6`}>
        {cats.length === 0 && <p className="p-5 text-sm text-stone-500">No categories yet.</p>}
        {cats.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
            <span><span className="font-medium">{c.name}</span> <span className="text-stone-400">· {c.products?.[0]?.count ?? 0} products</span></span>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmButton message={`Delete category ${c.name}? Its products will become uncategorised.`} className="text-red-600 underline underline-offset-4">Delete</ConfirmButton>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
