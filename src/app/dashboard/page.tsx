
/*
 * ARQUIVO: Página Principal do Dashboard (page.tsx)
 * POSIÇÃO: src/app/dashboard/page.tsx
 * FUNÇÃO: Tela inicial após o login. Apresenta o resumo das operações 
 * do sistema Start Big, como métricas de vendas e atalhos rápidos.
 */

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA PÁGINA */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Resumo Geral</h2>
        <p className="text-slate-400 text-sm">Acompanhe o desempenho da BigTec em tempo real.</p>
      </div>

      {/* CARDS DE MÉTRICAS (EXEMPLO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Vendas Hoje</span>
          <p className="text-3xl font-bold text-green-500 mt-2">R$ 1.250,00</p>
          <p className="text-[10px] text-slate-400 mt-1">+12% em relação a ontem</p>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Ordens de Serviço</span>
          <p className="text-3xl font-bold text-blue-500 mt-2">08</p>
          <p className="text-[10px] text-slate-400 mt-1">4 aguardando peças</p>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase">Produtos em Alerta</span>
          <p className="text-3xl font-bold text-orange-500 mt-2">15</p>
          <p className="text-[10px] text-slate-400 mt-1">Itens com estoque baixo</p>
        </div>
      </div>

      {/* ÁREA DE GRÁFICO OU TABELA RECENTE */}
      <div className="w-full h-64 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-center">
        <p className="text-slate-600 text-sm italic">Área reservada para o gráfico de faturamento mensal</p>
      </div>
    </div>
  )
}