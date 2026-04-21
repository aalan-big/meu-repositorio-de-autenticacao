'use client'

import { useEffect, useState } from 'react'
import {
  X, Crown, Zap, MapPin, Mail, Phone, Calendar,
  Hash, Building2, User, Pencil, PowerOff, RotateCcw,
  Loader2, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'

// ─── Tipo completo vindo do GET /api/cliente/:id ────────────────────────────

type Endereco = {
  id: string
  cep: string
  logradouro: string
  numero: string
  complemento?: string | null
  bairro: string
  cidade: string
  estado: string
  tipo: string
}

type ClienteCompleto = {
  id: string
  tipo: 'PF' | 'PJ'
  email: string
  contato: string
  plano: 'Start' | 'Premium'
  licencas: number
  usuariosAtivos: number
  parceiro: string
  status: 'PAGO' | 'ATRASADO'
  ativo: boolean
  criadoEm: string
  deletedAt?: string | null
  pf: {
    nomeCompleto: string
    cpf: string
    rg?: string | null
    dataNascimento?: string | null
  } | null
  pj: {
    razaoSocial: string
    cnpj: string
    nomeFantasia?: string | null
    inscricaoEstadual?: string | null
    responsavel?: string | null
  } | null
  enderecos: Endereco[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCpf(v: string)  { return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') }
function formatCnpj(v: string) { return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') }
function formatData(iso: string) {
  const m = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2,'0')} ${m[d.getMonth()]} ${d.getFullYear()}`
}

const PALETA = [
  'bg-blue-600','bg-emerald-600','bg-purple-600','bg-orange-500',
  'bg-pink-600','bg-cyan-600','bg-indigo-600','bg-rose-600','bg-teal-600',
]
function corAvatar(nome: string) { return PALETA[(nome.charCodeAt(0) || 0) % PALETA.length] }

function nomeCompleto(c: ClienteCompleto) {
  return c.tipo === 'PF' ? (c.pf?.nomeCompleto ?? '—') : (c.pj?.razaoSocial ?? '—')
}

// ─── Sub-componentes de UI ───────────────────────────────────────────────────

function InfoLinha({ label, valor, mono = false }: { label: string; valor?: string | null; mono?: boolean }) {
  if (!valor) return null
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}>{valor}</p>
    </div>
  )
}

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
      <span className="flex-1 h-px bg-slate-800" />
      {children}
      <span className="flex-1 h-px bg-slate-800" />
    </p>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  clienteId: string
  onClose: () => void
  onEditar: (c: ClienteCompleto) => void
  onDesativar: (c: ClienteCompleto) => void
  onReativar: (c: ClienteCompleto) => void
}

// ─── Modal Principal ─────────────────────────────────────────────────────────

export default function ModalPerfilCliente({
  clienteId,
  onClose,
  onEditar,
  onDesativar,
  onReativar,
}: Props) {
  const [cliente, setCliente] = useState<ClienteCompleto | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    setCarregando(true)
    setErro('')
    fetch(`/api/cliente/${clienteId}`)
      .then(r => r.json())
      .then(j => {
        if (j.data) setCliente(j.data)
        else setErro('Cliente não encontrado.')
      })
      .catch(() => setErro('Falha ao carregar dados.'))
      .finally(() => setCarregando(false))
  }, [clienteId])

  const nome = cliente ? nomeCompleto(cliente) : '...'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* ── CABEÇALHO ────────────────────────────────────────────────────── */}
        {cliente && !carregando && (
          <div className="relative overflow-hidden rounded-t-2xl">
            {/* Gradiente de fundo do header */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-blue-950/60" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }}
            />

            <div className="relative px-6 py-5 flex items-start gap-4">
              {/* Avatar */}
              <div className={`w-16 h-16 rounded-2xl ${corAvatar(nome)} flex items-center justify-center text-2xl font-extrabold text-white shrink-0 shadow-lg`}>
                {nome[0]?.toUpperCase()}
              </div>

              {/* Nome + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-xl font-bold text-white truncate">{nome}</h2>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    cliente.tipo === 'PJ' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                  }`}>
                    {cliente.tipo}
                  </span>
                </div>

                {/* Badges de estado */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Plano */}
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    cliente.plano === 'Premium'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {cliente.plano === 'Premium' ? <Crown size={9} /> : <Zap size={9} />}
                    {cliente.plano}
                  </span>

                  {/* Status pagamento */}
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    cliente.status === 'PAGO'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-orange-500/20 text-orange-300'
                  }`}>
                    {cliente.status === 'PAGO'
                      ? <CheckCircle2 size={9} />
                      : <AlertCircle size={9} />}
                    {cliente.status}
                  </span>

                  {/* Ativo/Inativo */}
                  {!cliente.ativo && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">
                      <XCircle size={9} />
                      Inativo
                    </span>
                  )}
                </div>

                {/* Licenças em uso */}
                <p className="text-xs text-slate-400 mt-1.5">
                  <span className="text-slate-200 font-medium">{cliente.usuariosAtivos}</span>
                  {' '}de{' '}
                  <span className="text-slate-200 font-medium">{cliente.licencas}</span>
                  {' '}licença{cliente.licencas !== 1 ? 's' : ''} em uso
                </p>
              </div>

              {/* Botões de ação + fechar */}
              <div className="flex items-center gap-2 shrink-0">
                {cliente.ativo && (
                  <>
                    <button
                      onClick={() => onEditar(cliente)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/30 rounded-lg transition-colors"
                    >
                      <Pencil size={11} />
                      Editar
                    </button>
                    <button
                      onClick={() => onDesativar(cliente)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-colors"
                    >
                      <PowerOff size={11} />
                      Desativar
                    </button>
                  </>
                )}
                {!cliente.ativo && (
                  <button
                    onClick={() => onReativar(cliente)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
                  >
                    <RotateCcw size={11} />
                    Reativar
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="ml-1 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700/60"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botão fechar quando sem dados */}
        {(carregando || erro) && (
          <div className="flex justify-end px-4 pt-4">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── CORPO ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Estado de carregamento */}
          {carregando && (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 size={24} className="animate-spin text-blue-400" />
              <p className="text-slate-500 text-sm">Carregando dados do cliente...</p>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} />
              {erro}
            </div>
          )}

          {/* Conteúdo quando carregado */}
          {cliente && !carregando && (
            <>
              {/* ── SEÇÃO: Identificação ──────────────────────────────────── */}
              <div>
                <SecaoTitulo>
                  {cliente.tipo === 'PJ' ? <Building2 size={11} /> : <User size={11} />}
                  {cliente.tipo === 'PJ' ? 'Dados da Empresa' : 'Dados Pessoais'}
                </SecaoTitulo>

                {cliente.tipo === 'PJ' && cliente.pj && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <InfoLinha label="Razão Social"       valor={cliente.pj.razaoSocial} />
                    <InfoLinha label="CNPJ"               valor={formatCnpj(cliente.pj.cnpj)} mono />
                    <InfoLinha label="Nome Fantasia"      valor={cliente.pj.nomeFantasia} />
                    <InfoLinha label="Inscrição Estadual" valor={cliente.pj.inscricaoEstadual} />
                    <InfoLinha label="Responsável Legal"  valor={cliente.pj.responsavel} />
                  </div>
                )}

                {cliente.tipo === 'PF' && cliente.pf && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <InfoLinha label="Nome Completo"      valor={cliente.pf.nomeCompleto} />
                    <InfoLinha label="CPF"                valor={formatCpf(cliente.pf.cpf)} mono />
                    <InfoLinha label="RG"                 valor={cliente.pf.rg} />
                    <InfoLinha label="Data de Nascimento" valor={cliente.pf.dataNascimento ? formatData(cliente.pf.dataNascimento) : undefined} />
                  </div>
                )}
              </div>

              {/* ── SEÇÃO: Contato & Comercial ────────────────────────────── */}
              <div>
                <SecaoTitulo><Mail size={11} /> Contato & Comercial</SecaoTitulo>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <InfoLinha label="E-mail"        valor={cliente.email} />
                  <InfoLinha label="Contato"        valor={cliente.contato} />
                  <InfoLinha label="Parceiro"       valor={cliente.parceiro} />
                  <InfoLinha label="Cadastrado em"  valor={formatData(cliente.criadoEm)} />
                  {!cliente.ativo && cliente.deletedAt && (
                    <InfoLinha label="Desativado em" valor={formatData(cliente.deletedAt)} />
                  )}
                </div>
              </div>

              {/* ── SEÇÃO: Plano & Licenças ───────────────────────────────── */}
              <div>
                <SecaoTitulo><Hash size={11} /> Plano & Licenças</SecaoTitulo>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Plano</p>
                    <span className={`inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded ${
                      cliente.plano === 'Premium'
                        ? 'text-yellow-400'
                        : 'text-emerald-400'
                    }`}>
                      {cliente.plano === 'Premium' ? <Crown size={13} /> : <Zap size={13} />}
                      {cliente.plano}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Licenças</p>
                    <p className="text-2xl font-extrabold text-slate-100">{cliente.licencas}</p>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Em Uso</p>
                    <p className={`text-2xl font-extrabold ${
                      cliente.usuariosAtivos >= cliente.licencas ? 'text-orange-400' : 'text-slate-100'
                    }`}>{cliente.usuariosAtivos}</p>
                  </div>
                </div>
              </div>

              {/* ── SEÇÃO: Endereços ─────────────────────────────────────── */}
              {cliente.enderecos.length > 0 && (
                <div>
                  <SecaoTitulo><MapPin size={11} /> Endereços ({cliente.enderecos.length})</SecaoTitulo>
                  <div className="space-y-3">
                    {cliente.enderecos.map(e => (
                      <div key={e.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wide px-2 py-0.5 bg-blue-500/10 rounded">
                            {e.tipo}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">{e.cep}</span>
                        </div>
                        <p className="text-sm text-slate-200">
                          {e.logradouro}, {e.numero}
                          {e.complemento && ` — ${e.complemento}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {e.bairro} · {e.cidade} / {e.estado}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SEÇÃO: Dispositivos (placeholder para módulo futuro) ── */}
              <div>
                <SecaoTitulo><Phone size={11} /> Dispositivos</SecaoTitulo>
                <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-5 text-center">
                  <p className="text-slate-500 text-sm">
                    Módulo de Gestão de Dispositivos em desenvolvimento.
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    {cliente.licencas} licença{cliente.licencas !== 1 ? 's' : ''} contratada{cliente.licencas !== 1 ? 's' : ''} ·{' '}
                    {cliente.usuariosAtivos} em uso
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        {cliente && !carregando && (
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-600 font-mono">ID: {cliente.id}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
