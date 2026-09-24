import { getAdmin } from '@/lib/supabaseAdmin'
import { getFinance, getInventory } from '@/lib/adminData'
import { addExpense, deleteExpense } from '@/app/admin/actions'
import { formatPrice } from '@/lib/format'
import Kpi from '@/components/admin/Kpi'
import ConfirmButton from '@/components/admin/ConfirmButton'
import { card, field, label, btn, th, td } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['Ads and marketing', 'Delivery', 'Packaging', 'Rent', 'Salaries', 'Transport', 'Other']
type Expense = { id: string; description: string; category: string; amount: number; spent_on: string }

export default async function FinancePage() {
  const [fin, inv, ex] = await Promise.all([
    getFinance(),
    getInventory(),
    getAdmin().from('expenses').select('*').order('spent_on', { ascending: false }).limit(30),
  ])
  const t = fin.total
  const expenses = (ex.data ?? []) as Expense[]
  const today = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10)
  const monthName = (m: string) => new Date(`${m}T00:00:00Z`).toLocaleDateString('en-KE', { month: 'long', year: 'numeric', timeZone: 'UTC' })

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-semibold">Finance</h1>

      <section className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <Kpi label="Sales" value={formatPrice(t.revenue)} hint="Paid orders, excl. delivery" />
        <Kpi label="Capital spent on sold items" value={formatPrice(t.cost)} />
        <Kpi label="Gross profit" value={formatPrice(t.profit)} tone={t.profit >= 0 ? 'good' : 'bad'} />
        <Kpi label="Expenses" value={formatPrice(t.expenses)} />
        <Kpi label="Net profit" value={formatPrice(t.net)} tone={t.net >= 0 ? 'good' : 'bad'} />
      </section>

      <section className="grid grid-cols-2 gap-4">
        <Kpi label="Capital tied up in stock" value={formatPrice(inv.atCost)} hint={`${inv.units} units`} />
        <Kpi label="Expected profit if all sold" value={formatPrice(inv.atRetail - inv.atCost)} hint={`Retail value ${formatPrice(inv.atRetail)}`} />
      </section>

      <section className={`${card} overflow-hidden`}>
        <h2 className="px-5 py-4 border-b border-stone-200 font-semibold">Month by month</h2>
        {fin.rows.length === 0 ? (
          <p className="p-5 text-sm text-stone-500">Numbers appear here after your first paid sale.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-stone-50 text-stone-500">
                <tr><th className={th}>Month</th><th className={th}>Orders</th><th className={th}>Sales</th><th className={th}>Capital</th><th className={th}>Profit</th><th className={th}>Expenses</th><th className={th}>Net</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {fin.rows.map((r) => (
                  <tr key={r.month}>
                    <td className={`${td} font-medium`}>{monthName(r.month)}</td>
                    <td className={td}>{r.orders}</td>
                    <td className={td}>{formatPrice(r.revenue)}</td>
                    <td className={td}>{formatPrice(r.cost)}</td>
                    <td className={`${td} text-emerald-700`}>{formatPrice(r.profit)}</td>
                    <td className={td}>{formatPrice(r.expenses)}</td>
                    <td className={`${td} font-semibold ${r.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatPrice(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <form action={addExpense} className={`${card} p-5 space-y-4`}>
          <h2 className="font-semibold">Add an expense</h2>
          <div><label className={label}>What was it for?</label><input name="description" required className={field} placeholder="Instagram ads" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Amount (KES)</label><input name="amount" required inputMode="decimal" className={field} /></div>
            <div><label className={label}>Date</label><input name="spent_on" type="date" defaultValue={today} className={field} /></div>
          </div>
          <div>
            <label className={label}>Category</label>
            <select name="category" className={field}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <button className={btn}>Save expense</button>
        </form>

        <div className={`${card} overflow-hidden`}>
          <h2 className="px-5 py-4 border-b border-stone-200 font-semibold">Recent expenses</h2>
          {expenses.length === 0 ? (
            <p className="p-5 text-sm text-stone-500">No expenses recorded.</p>
          ) : (
            <ul className="divide-y divide-stone-100 text-sm">
              {expenses.map((e) => (
                <li key={e.id} className="px-5 py-3 flex justify-between gap-3">
                  <div>
                    <p className="font-medium">{e.description}</p>
                    <p className="text-xs text-stone-500">{e.category} · {e.spent_on}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatPrice(e.amount)}</p>
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={e.id} />
                      <ConfirmButton message="Delete this expense?" className="text-xs text-red-600 underline underline-offset-4">Delete</ConfirmButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
