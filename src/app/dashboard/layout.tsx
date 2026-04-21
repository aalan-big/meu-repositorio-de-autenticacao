/*
 * ARQUIVO: Layout Principal do Painel (layout.tsx)
 * POSIÇÃO: src/app/dashboard/layout.tsx
 * FUNÇÃO: Maestro visual do Dashboard. Ele importa os componentes globais 
 * (Sidebar e Header) e organiza onde cada um fica na tela, injetando 
 * o conteúdo dinâmico (children) no centro da interface.
 */

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar' // Importando o menu que criamos
import { Header } from '@/components/layout/heander'   // Importando o topo que criamos

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50">
      
      {/* 1. Menu Lateral (Agora isolado no componente Sidebar) */}
      <Sidebar />

      {/* 2. Área de Conteúdo à Direita */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* 3. Barra Superior (Agora isolada no componente Header) */}
        <Header />

        {/* 4. Conteúdo Dinâmico: Aqui é onde a 'page.tsx' é renderizada */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950">
          {children}
        </main>
        
      </div>
    </div>
  )
}