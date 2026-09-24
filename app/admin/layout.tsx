import type { Metadata } from 'next'
import AdminNav from '@/components/admin/AdminNav'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const configured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  return (
    <div className="min-h-screen bg-stone-100 md:flex">
      <AdminNav />
      <main className="flex-1 min-w-0 p-5 md:p-10">
        {configured ? (
          children
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-6 max-w-xl">
            <p className="font-semibold mb-2">One more setup step</p>
            <p className="text-sm">
              Add <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in Vercel (Settings, Environment Variables), using your Supabase secret key, then redeploy.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
