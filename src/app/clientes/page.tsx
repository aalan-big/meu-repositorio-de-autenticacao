'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Eye, Pencil, ChevronRight, Crown, Zap, Users, PowerOff, RotateCcw } from 'lucide-react'
import ModalCriarCliente from './_components/ModalCriarCliente'
import ModalEditarCliente from './_components/ModalEditarCliente'
import ModalConfirmarDesativacao from './_components/ModalConfirmarDesativacao'
import ModalPerfilCliente from './_components/ModalPerfilCliente'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Cliente = {
  id: string
  tipo: 'PF' | 'PJ'
  email: string
  contato: string
  plano: 'Start' | 'Premium'
  licencas: number
  parceiro: string
  status: 'PAGO' | 'ATRASADO'
  ativo: boolean
  criadoEm: string
  pf: { nomeCompleto: string; cpf: string } | null
  pj: { razaoSocial: string; cnpj: string; nomeFantasia?: string | null } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nomeCliente(c: Cliente) {
  return c.tipo === 'PF' ? (c.pf?.nomeCompleto ?? '—') : (c.pj?.razaoSocial ?? '—')
}

function docCliente(c: Cliente) {
  if (c.tipo === 'PF') return formatCpf(c.pf?.cpf ?? '')
  return formatCnpj(c.pj?.cnpj ?? '')
}

function formatCpf(v: string) {
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatCnpj(v: string) {
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function formatarData(iso: string) {
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

const PALETA = [
  'bg-blue-600', 'bg-emerald-600', 'bg-purple-600',
  'bg-orange-500', 'bg-pink-600', 'bg-cyan-600',
  'bg-indigo-600', 'bg-rose-600', 'bg-teal-600',
]

function corAvatar(nome: string) {
  return PALETA[(nome.charCodeAt(0) || 0) % PALETA.length]
}

// ─── Gráfico decorativo de receita ────────────────────────────────────────────

function MiniBarChart() {
  const bars = [38, 55, 42, 70, 58, 88, 65, 80, 72, 92, 78, 100]
  return (
    <div className="flex items-end gap-1 h-10">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-emerald-400/70"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroParceiro, setFiltroParceiro] = useState('Todos')
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [filtroPlano, setFiltroPlano] = useState('Todos')
  const [modalAberto, setModalAberto]               = useState(false)
  const [clienteEditando, setClienteEditando]       = useState<Cliente | null>(null)
  const [clientePerfil, setClientePerfil]           = useState<string | null>(null) // ID do cliente no modal 360°
  const [clienteDesativando, setClienteDesativando] = useState<Cliente | null>(null)
  const [processandoId, setProcessandoId]           = useState<string | null>(null)

  const carregar = useCallback(async (q = '') => {
    setCarregando(true)
    try {
      const url = q ? `/api/cliente?q=${encodeURIComponent(q)}` : '/api/cliente'
      const res = await fetch(url)
      const json = await res.json()
      setClientes(json.data ?? [])
    } catch {
      setClientes([])
    } finally {
      setCarregando(false)
    }
  }, [])

  // Carga inicial e ao limpar a busca
  useEffect(() => {
    if (busca === '') {
      carregar('')
      return
    }
    const t = setTimeout(() => carregar(busca), 400)
    return () => clearTimeout(t)
  }, [busca, carregar])

  async function desativar(id: string) {
    setProcessandoId(id)
    try {
      await fetch(`/api/cliente/${id}`, { method: 'DELETE' })
      await carregar(busca)
      setClienteDesativando(null)
      setClientePerfil(null) // fecha o perfil se estiver aberto
    } finally {
      setProcessandoId(null)
    }
  }

  async function reativar(id: string) {
    setProcessandoId(id)
    try {
      await fetch(`/api/cliente/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: true }),
      })
      await carregar(busca)
    } finally {
      setProcessandoId(null)
    }
  }

  // Parceiros únicos extraídos dos dados reais (para o filtro)
  const parceirosDisponiveis = ['Todos', ...Array.from(new Set(clientes.map(c => c.parceiro)))]

  // Filtros aplicados no cliente (parceiro/status/plano são rápidos e evitam round-trips)
  const visiveis = clientes.filter(c => {
    if (filtroParceiro !== 'Todos' && c.parceiro !== filtroParceiro) return false
    if (filtroStatus !== 'Todos' && c.status !== filtroStatus) return false
    if (filtroPlano !== 'Todos' && c.plano !== filtroPlano) return false
    return true
  })

  const totalPremium = clientes.filter(c => c.plano === 'Premium').length
  const totalStart   = clientes.filter(c => c.plano === 'Start').length

  return (
    <div className="space-y-5">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-slate-900 to-blue-950 border border-slate-800 p-8">
        {/* Padrão de pontos decorativo */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        {/* Gradiente lateral direito */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-linear-to-l from-blue-950/60 to-transparent pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

          {/* Breadcrumb + Título */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Dashboard</span>
              <ChevronRight size={11} />
              <span className="text-slate-300 font-medium">Clientes</span>
            </div>
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.25em] mb-1.5">
              Gestão de Clientes
            </p>
            <h1 className="text-3xl font-extrabold text-white uppercase tracking-wide">
              Gestão de Clientes
            </h1>
          </div>

          {/* Cards de métricas */}
          <div className="flex items-stretch gap-3 shrink-0">
            <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl px-6 py-4 text-center min-w-25">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Users size={12} className="text-slate-400" />
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Total</p>
              </div>
              <p className="text-3xl font-extrabold text-white">
                {carregando ? '—' : clientes.length}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl px-6 py-4 text-center min-w-25">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Crown size={12} className="text-yellow-400" />
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Premium</p>
              </div>
              <p className="text-3xl font-extrabold text-yellow-400">
                {carregando ? '—' : totalPremium}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl px-6 py-4 text-center min-w-25">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Zap size={12} className="text-emerald-400" />
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Start</p>
              </div>
              <p className="text-3xl font-extrabold text-emerald-400">
                {carregando ? '—' : totalStart}
              </p>
            </div>

            <div className="bg-slate-800/70 backdrop-blur border border-slate-700/50 rounded-xl px-5 py-4 min-w-32.5">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-2">Receita Mensal</p>
              <MiniBarChart />
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTROS ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-center">

        <select
          value={filtroParceiro}
          onChange={e => setFiltroParceiro(e.target.value)}
          className={selectClass}
        >
          {parceirosDisponiveis.map(p => <option key={p}>{p}</option>)}
        </select>

        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className={selectClass}
        >
          <option value="Todos">Status de Pagamento</option>
          <option value="PAGO">PAGO</option>
          <option value="ATRASADO">ATRASADO</option>
        </select>

        <select
          value={filtroPlano}
          onChange={e => setFiltroPlano(e.target.value)}
          className={selectClass}
        >
          <option value="Todos">Plano</option>
          <option value="Premium">Premium</option>
          <option value="Start">Start</option>
        </select>

        <div className="flex-1 min-w-50 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por nome, CPF, CNPJ, e-mail..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-300 placeholder-slate-500 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          />
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-lg shadow-blue-900/30"
        >
          <Plus size={14} />
          Adicionar Cliente
        </button>
      </div>

      {/* ── TABELA ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Cliente</th>
                <th className="text-left px-5 py-3 font-semibold">CPF / CNPJ</th>
                <th className="text-left px-5 py-3 font-semibold">Contato Principal</th>
                <th className="text-left px-5 py-3 font-semibold">Plano / Licença</th>
                <th className="text-left px-5 py-3 font-semibold">Parceiro</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Cadastrado em</th>
                <th className="text-left px-5 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">

              {/* Estado de carregamento */}
              {carregando && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-500 text-xs">Carregando clientes...</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Estado vazio */}
              {!carregando && visiveis.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={28} className="text-slate-700" />
                      <p className="text-slate-500 text-sm">
                        {busca || filtroParceiro !== 'Todos' || filtroStatus !== 'Todos' || filtroPlano !== 'Todos'
                          ? 'Nenhum cliente encontrado com esses filtros.'
                          : 'Nenhum cliente cadastrado ainda.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Linhas de dados */}
              {!carregando && visiveis.map(c => {
                const nome = nomeCliente(c)
                return (
                  <tr key={c.id} onClick={() => setClientePerfil(c.id)} className="hover:bg-slate-800/40 transition-colors group cursor-pointer">

                    {/* Cliente */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${corAvatar(nome)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                          {nome[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 leading-tight">{nome}</p>
                          <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            c.tipo === 'PJ'
                              ? 'bg-blue-500/15 text-blue-400'
                              : 'bg-purple-500/15 text-purple-400'
                          }`}>
                            {c.tipo}
                          </span>
                          {!c.ativo && (
                            <span className="ml-1 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
                              Inativo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Documento */}
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">
                      {docCliente(c)}
                    </td>

                    {/* Contato */}
                    <td className="px-5 py-4">
                      <p className="text-slate-200 text-sm">{c.contato}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{c.email}</p>
                    </td>

                    {/* Plano / Licenças */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          c.plano === 'Premium'
                            ? 'bg-yellow-500/15 text-yellow-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {c.plano === 'Premium' ? <Crown size={10} /> : <Zap size={10} />}
                          {c.plano}
                        </span>
                        <span className="text-slate-500 text-xs">{c.licencas} lic.</span>
                      </div>
                    </td>

                    {/* Parceiro */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                          {c.parceiro[0]?.toUpperCase()}
                        </div>
                        <span className="text-slate-300 text-sm">{c.parceiro}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.status === 'PAGO'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-orange-500/15 text-orange-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'PAGO' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                        {c.status}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {formatarData(c.criadoEm)}
                    </td>

                    {/* Ações — aparecem só no hover da linha */}
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">

                        {/* Perfil */}
                        <button
                          onClick={() => setClientePerfil(c.id)}
                          title="Ver perfil completo"
                          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                        </button>

                        {/* Editar — só para clientes ativos */}
                        {c.ativo && (
                          <button
                            onClick={() => setClienteEditando(c)}
                            title="Editar cliente"
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/15 rounded-lg transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                        )}

                        {/* Desativar */}
                        {c.ativo && (
                          <button
                            onClick={() => setClienteDesativando(c)}
                            disabled={processandoId === c.id}
                            title="Desativar cliente"
                            className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/15 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <PowerOff size={14} />
                          </button>
                        )}

                        {/* Reativar — só para clientes inativos */}
                        {!c.ativo && (
                          <button
                            onClick={() => reativar(c.id)}
                            disabled={processandoId === c.id}
                            title="Reativar cliente"
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {processandoId === c.id
                              ? <span className="w-3.5 h-3.5 border border-emerald-400 border-t-transparent rounded-full animate-spin block" />
                              : <RotateCcw size={14} />}
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé com contagem */}
        {!carregando && visiveis.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Exibindo <span className="text-slate-300 font-medium">{visiveis.length}</span> de{' '}
              <span className="text-slate-300 font-medium">{clientes.length}</span> cliente{clientes.length !== 1 ? 's' : ''}
            </p>
            {busca && (
              <p className="text-xs text-slate-500">
                Pesquisa inclui clientes <span className="text-orange-400">inativos</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL: Criar cliente ─────────────────────────────────────────────── */}
      {modalAberto && (
        <ModalCriarCliente
          onClose={() => setModalAberto(false)}
          onSuccess={() => { setModalAberto(false); carregar(busca) }}
        />
      )}

      {/* ── MODAL: Editar cliente ─────────────────────────────────────────────── */}
      {clienteEditando && (
        <ModalEditarCliente
          cliente={clienteEditando}
          onClose={() => setClienteEditando(null)}
          onSuccess={() => { setClienteEditando(null); carregar(busca) }}
        />
      )}

      {/* ── MODAL: Perfil 360° ───────────────────────────────────────────────── */}
      {clientePerfil && (
        <ModalPerfilCliente
          clienteId={clientePerfil}
          onClose={() => setClientePerfil(null)}
          onEditar={(c) => {
            setClientePerfil(null)
            // Adapta o tipo completo para o tipo resumido que o modal de edição espera
            setClienteEditando(c as unknown as Cliente)
          }}
          onDesativar={(c) => {
            setClientePerfil(null)
            setClienteDesativando(c as unknown as Cliente)
          }}
          onReativar={async (c) => {
            await reativar(c.id)
            setClientePerfil(null)
          }}
        />
      )}

      {/* ── MODAL: Confirmar desativação ─────────────────────────────────────── */}
      {clienteDesativando && (
        <ModalConfirmarDesativacao
          nomeCliente={
            clienteDesativando.tipo === 'PF'
              ? (clienteDesativando.pf?.nomeCompleto ?? clienteDesativando.contato)
              : (clienteDesativando.pj?.razaoSocial  ?? clienteDesativando.contato)
          }
          processando={processandoId === clienteDesativando.id}
          onConfirmar={() => desativar(clienteDesativando.id)}
          onCancelar={() => setClienteDesativando(null)}
        />
      )}
    </div>
  )
}

const selectClass = 'bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all min-w-[140px]'
