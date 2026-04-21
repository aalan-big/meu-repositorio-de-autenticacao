'use client'

import { AlertTriangle, Loader2, X } from 'lucide-react'

interface Props {
  nomeCliente: string
  processando: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ModalConfirmarDesativacao({
  nomeCliente,
  processando,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay escuro */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!processando ? onCancelar : undefined}
      />

      {/* Card de confirmação */}
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Faixa vermelha no topo */}
        <div className="h-1 bg-gradient-to-r from-red-600 to-orange-500" />

        {/* Conteúdo */}
        <div className="p-6">

          {/* Ícone + botão fechar */}
          <div className="flex items-start justify-between mb-5">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle size={22} className="text-red-400" />
            </div>
            {!processando && (
              <button
                onClick={onCancelar}
                className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Título e mensagem */}
          <h3 className="text-lg font-bold text-slate-100 mb-2">
            Desativar cliente?
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-1">
            Você está prestes a desativar:
          </p>
          <p className="text-white font-semibold text-sm mb-4 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
            {nomeCliente}
          </p>
          <p className="text-slate-500 text-xs leading-relaxed">
            O cliente <strong className="text-slate-400">não será excluído</strong> — apenas ficará
            invisível nas listagens. Você pode reativá-lo a qualquer momento pela busca.
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancelar}
            disabled={processando}
            className="flex-1 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={processando}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {processando ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Desativando...
              </>
            ) : (
              'Sim, desativar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
