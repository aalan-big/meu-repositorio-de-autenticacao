import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/heander'

export default function ClientesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-950 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
