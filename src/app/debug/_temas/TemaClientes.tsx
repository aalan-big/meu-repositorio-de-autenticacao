'use client'

import { useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Console } from '../_shared/Console'
import { FormEndereco, enderecoVazio, type EnderecoForm } from '../_shared/FormEndereco'

interface ApiResponse {
  ok: boolean; status?: number; statusText?: string; payload?: unknown; error?: string
}

async function chamarApi(acao: string, dados: unknown): Promise<ApiResponse> {
  try {
    const res = await fetch('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao, dados }),
    })
    const data = await res.json()
    return { status: res.status, statusText: res.statusText, ok: res.ok, payload: data }
  } catch (err) {
    return { error: 'Falha na conexão', ok: false, payload: err instanceof Error ? err.message : String(err) }
  }
}

const i = 'w-full bg-[#0f172a] border border-slate-600 rounded p-2 outline-none transition text-sm'
const l = 'block text-xs uppercase font-bold text-slate-500 mb-1'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={l}>{label}</label>{children}</div>
}

// ---------------------------------------------------------------------------
// CAMPOS BASE (comuns a PF e PJ)
// ---------------------------------------------------------------------------
interface BaseForm { contato: string; email: string; plano: string; licencas: number; parceiro: string; status: string }

function CamposBase({ form, onChange, cor }: { form: BaseForm; onChange: (f: BaseForm) => void; cor: string }) {
  const f = (k: keyof BaseForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...form, [k]: k === 'licencas' ? Number(e.target.value) : e.target.value })
  const fc = `${i} focus:border-${cor}-500`
  return (
    <>
      <Field label="Contato Principal *"><input className={fc} placeholder="Ex: João Silva" value={form.contato} onChange={f('contato')} /></Field>
      <Field label="E-mail *"><input type="email" className={fc} placeholder="contato@empresa.com" value={form.email} onChange={f('email')} /></Field>
      <Field label="Parceiro *"><input className={fc} placeholder="Ex: BigTec Iguatu" value={form.parceiro} onChange={f('parceiro')} /></Field>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className={l}>Plano</label>
          <select className={fc} value={form.plano} onChange={f('plano')}>
            <option value="Start">Start</option><option value="Premium">Premium</option>
          </select>
        </div>
        <div className="w-24">
          <label className={l}>Licenças</label>
          <input type="number" min={1} className={fc} value={form.licencas} onChange={f('licencas')} />
        </div>
        <div className="flex-1">
          <label className={l}>Status</label>
          <select className={fc} value={form.status} onChange={f('status')}>
            <option value="PAGO">PAGO</option><option value="ATRASADO">ATRASADO</option>
          </select>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// LISTAR / PESQUISAR
// ---------------------------------------------------------------------------
function SecaoListarPesquisar() {
  const [termo, setTermo] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const executar = async () => { setLoading(true); setResponse(await chamarApi('pesquisar_clientes', { termo })); setLoading(false) }

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-cyan-400 mb-1 uppercase tracking-wider">Listar / Pesquisar</h2>
      <p className="text-slate-500 text-xs mb-4">Deixe vazio para listar todos. Busca PF e PJ por nome, CPF, CNPJ, e-mail, contato.</p>
      <div className="space-y-3">
        <div>
          <label className={l}>Termo</label>
          <input className={`${i} focus:border-cyan-500`} placeholder='nome, CPF, CNPJ, e-mail...'
            value={termo} onChange={(e) => setTermo(e.target.value)}
            onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && executar()} />
        </div>
        <button disabled={loading} onClick={executar} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white font-bold py-2 rounded transition">
          {loading ? 'Buscando...' : 'POST pesquisar_clientes'}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// CRIAR CLIENTE PF
// ---------------------------------------------------------------------------
function SecaoCriarPF() {
  const [base, setBase] = useState<BaseForm>({ contato: '', email: '', plano: 'Start', licencas: 1, parceiro: '', status: 'PAGO' })
  const [pf, setPf] = useState({ nomeCompleto: '', cpf: '', rg: '', dataNascimento: '' })
  const [end, setEnd] = useState<EnderecoForm>(enderecoVazio())
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const executar = async () => {
    setLoading(true)
    const enderecoPayload = end.cep ? end : undefined
    setResponse(await chamarApi('criar_cliente_pf', { ...base, ...pf, endereco: enderecoPayload }))
    setLoading(false)
  }
  const fp = (k: keyof typeof pf) => (e: ChangeEvent<HTMLInputElement>) => setPf({ ...pf, [k]: e.target.value })
  const fc = `${i} focus:border-emerald-500`

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-emerald-400 mb-1 uppercase tracking-wider">Criar Cliente — PF</h2>
      <p className="text-slate-500 text-xs mb-4">Pessoa Física</p>
      <div className="space-y-3">
        <Field label="Nome Completo *"><input className={fc} placeholder="Ex: João da Silva" value={pf.nomeCompleto} onChange={fp('nomeCompleto')} /></Field>
        <Field label="CPF *"><input className={fc} placeholder="000.000.000-00" value={pf.cpf} onChange={fp('cpf')} /></Field>
        <Field label="RG"><input className={fc} placeholder="opcional" value={pf.rg} onChange={fp('rg')} /></Field>
        <Field label="Data de Nascimento"><input type="date" className={fc} value={pf.dataNascimento} onChange={fp('dataNascimento')} /></Field>
        <div className="border-t border-slate-700 pt-3">
          <CamposBase form={base} onChange={setBase} cor="emerald" />
        </div>
        <FormEndereco cor="emerald" form={end} onChange={setEnd} />
        <button disabled={loading} onClick={executar} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-bold py-2 rounded transition mt-2">
          {loading ? 'Processando...' : 'POST criar_cliente_pf'}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// CRIAR CLIENTE PJ
// ---------------------------------------------------------------------------
function SecaoCriarPJ() {
  const [base, setBase] = useState<BaseForm>({ contato: '', email: '', plano: 'Start', licencas: 1, parceiro: '', status: 'PAGO' })
  const [pj, setPj] = useState({ razaoSocial: '', cnpj: '', nomeFantasia: '', inscricaoEstadual: '', responsavel: '' })
  const [end, setEnd] = useState<EnderecoForm>(enderecoVazio())
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const executar = async () => {
    setLoading(true)
    const enderecoPayload = end.cep ? end : undefined
    setResponse(await chamarApi('criar_cliente_pj', { ...base, ...pj, endereco: enderecoPayload }))
    setLoading(false)
  }
  const fp = (k: keyof typeof pj) => (e: ChangeEvent<HTMLInputElement>) => setPj({ ...pj, [k]: e.target.value })
  const fc = `${i} focus:border-sky-500`

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-sky-400 mb-1 uppercase tracking-wider">Criar Cliente — PJ</h2>
      <p className="text-slate-500 text-xs mb-4">Pessoa Jurídica</p>
      <div className="space-y-3">
        <Field label="Razão Social *"><input className={fc} placeholder="Ex: Alpha Comércio Ltda" value={pj.razaoSocial} onChange={fp('razaoSocial')} /></Field>
        <Field label="CNPJ *"><input className={fc} placeholder="00.000.000/0001-00" value={pj.cnpj} onChange={fp('cnpj')} /></Field>
        <Field label="Nome Fantasia"><input className={fc} placeholder="opcional" value={pj.nomeFantasia} onChange={fp('nomeFantasia')} /></Field>
        <Field label="Inscrição Estadual"><input className={fc} placeholder="opcional" value={pj.inscricaoEstadual} onChange={fp('inscricaoEstadual')} /></Field>
        <Field label="Responsável Legal"><input className={fc} placeholder="opcional" value={pj.responsavel} onChange={fp('responsavel')} /></Field>
        <div className="border-t border-slate-700 pt-3">
          <CamposBase form={base} onChange={setBase} cor="sky" />
        </div>
        <FormEndereco cor="sky" form={end} onChange={setEnd} />
        <button disabled={loading} onClick={executar} className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white font-bold py-2 rounded transition mt-2">
          {loading ? 'Processando...' : 'POST criar_cliente_pj'}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// EDITAR CLIENTE PF
// ---------------------------------------------------------------------------
function SecaoEditarPF() {
  const [id, setId] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erroId, setErroId] = useState('')
  const [form, setForm] = useState({ nomeCompleto: '', cpf: '', rg: '', dataNascimento: '', contato: '', email: '', plano: '', licencas: '', parceiro: '', status: '' })
  const [end, setEnd] = useState<EnderecoForm>(enderecoVazio())
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const buscarPorId = async (idBusca: string) => {
    if (!idBusca.trim()) return
    setBuscando(true)
    setErroId('')
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'buscar_cliente', dados: { id: idBusca } }),
      })
      const json = await res.json()
      if (!res.ok) { setErroId(json.error || 'Cliente não encontrado'); return }
      const c = json.data
      if (c.tipo !== 'PF') { setErroId('Este ID pertence a um cliente PJ'); return }
      // Preenche dados do cliente
      setForm({
        nomeCompleto:   c.pf?.nomeCompleto  ?? '',
        cpf:            c.pf?.cpf           ?? '',
        rg:             c.pf?.rg            ?? '',
        dataNascimento: c.pf?.dataNascimento ? c.pf.dataNascimento.split('T')[0] : '',
        contato:        c.contato           ?? '',
        email:          c.email             ?? '',
        plano:          c.plano             ?? '',
        licencas:       String(c.licencas   ?? ''),
        parceiro:       c.parceiro          ?? '',
        status:         c.status            ?? '',
      })
      // Preenche primeiro endereço se existir
      const e = c.enderecos?.[0]
      if (e) {
        setEnd({ id: e.id, cep: e.cep, logradouro: e.logradouro, numero: e.numero,
          complemento: e.complemento ?? '', bairro: e.bairro, cidade: e.cidade,
          estado: e.estado, tipo: e.tipo })
      } else {
        setEnd(enderecoVazio())
      }
    } catch { setErroId('Falha ao buscar cliente') }
    finally { setBuscando(false) }
  }

  const executar = async () => {
    setLoading(true)
    const campos = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    if (campos.licencas) campos.licencas = Number(campos.licencas) as unknown as string
    const enderecoPayload = end.cep || end.id ? end : undefined
    setResponse(await chamarApi('editar_cliente_pf', { id, ...campos, endereco: enderecoPayload }))
    setLoading(false)
  }
  const f = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value })
  const fc = `${i} focus:border-amber-500`

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-amber-400 mb-1 uppercase tracking-wider">Editar Cliente — PF</h2>
      <p className="text-slate-500 text-xs mb-4">Cole o ID para carregar os dados automaticamente.</p>
      <div className="space-y-3">
        {/* Campo ID com busca automática */}
        <div>
          <label className={l}>ID do Cliente (UUID) *</label>
          <div className="flex gap-2">
            <input className={`${fc} font-mono flex-1`} placeholder="cole o uuid e pressione Tab ou Enter..."
              value={id}
              onChange={(e) => { setId(e.target.value); setErroId('') }}
              onBlur={() => buscarPorId(id)}
              onKeyDown={(e) => e.key === 'Enter' && buscarPorId(id)}
            />
            <button type="button" onClick={() => buscarPorId(id)} disabled={buscando}
              className="px-3 py-2 rounded text-xs font-bold border border-amber-600 text-amber-400 hover:bg-amber-600/20 disabled:opacity-50 transition">
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>
          {erroId && <p className="text-red-400 text-xs mt-1">{erroId}</p>}
          {buscando && <p className="text-amber-400 text-xs mt-1">Carregando dados do cliente...</p>}
        </div>

        <Field label="Nome Completo"><input className={fc} value={form.nomeCompleto} onChange={f('nomeCompleto')} /></Field>
        <Field label="CPF"><input className={fc} value={form.cpf} onChange={f('cpf')} /></Field>
        <Field label="RG"><input className={fc} value={form.rg} onChange={f('rg')} /></Field>
        <Field label="Data de Nascimento"><input type="date" className={fc} value={form.dataNascimento} onChange={f('dataNascimento')} /></Field>
        <Field label="Contato"><input className={fc} value={form.contato} onChange={f('contato')} /></Field>
        <Field label="E-mail"><input className={fc} value={form.email} onChange={f('email')} /></Field>
        <Field label="Parceiro"><input className={fc} value={form.parceiro} onChange={f('parceiro')} /></Field>
        <div className="flex gap-3">
          <div className="flex-1"><label className={l}>Plano</label>
            <select className={fc} value={form.plano} onChange={f('plano')}><option value="">—</option><option value="Start">Start</option><option value="Premium">Premium</option></select>
          </div>
          <div className="w-24"><label className={l}>Licenças</label><input type="number" className={fc} value={form.licencas} onChange={f('licencas')} /></div>
          <div className="flex-1"><label className={l}>Status</label>
            <select className={fc} value={form.status} onChange={f('status')}><option value="">—</option><option value="PAGO">PAGO</option><option value="ATRASADO">ATRASADO</option></select>
          </div>
        </div>
        <FormEndereco cor="amber" form={end} onChange={setEnd} />
        <button disabled={loading} onClick={executar} className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white font-bold py-2 rounded transition mt-2">
          {loading ? 'Processando...' : 'POST editar_cliente_pf'}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// EDITAR CLIENTE PJ
// ---------------------------------------------------------------------------
function SecaoEditarPJ() {
  const [id, setId] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [erroId, setErroId] = useState('')
  const [form, setForm] = useState({ razaoSocial: '', cnpj: '', nomeFantasia: '', inscricaoEstadual: '', responsavel: '', contato: '', email: '', plano: '', licencas: '', parceiro: '', status: '' })
  const [end, setEnd] = useState<EnderecoForm>(enderecoVazio())
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const buscarPorId = async (idBusca: string) => {
    if (!idBusca.trim()) return
    setBuscando(true)
    setErroId('')
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'buscar_cliente', dados: { id: idBusca } }),
      })
      const json = await res.json()
      if (!res.ok) { setErroId(json.error || 'Cliente não encontrado'); return }
      const c = json.data
      if (c.tipo !== 'PJ') { setErroId('Este ID pertence a um cliente PF'); return }
      // Preenche dados da empresa
      setForm({
        razaoSocial:       c.pj?.razaoSocial       ?? '',
        cnpj:              c.pj?.cnpj               ?? '',
        nomeFantasia:      c.pj?.nomeFantasia        ?? '',
        inscricaoEstadual: c.pj?.inscricaoEstadual   ?? '',
        responsavel:       c.pj?.responsavel         ?? '',
        contato:           c.contato                 ?? '',
        email:             c.email                   ?? '',
        plano:             c.plano                   ?? '',
        licencas:          String(c.licencas         ?? ''),
        parceiro:          c.parceiro                ?? '',
        status:            c.status                  ?? '',
      })
      // Preenche primeiro endereço se existir
      const e = c.enderecos?.[0]
      if (e) {
        setEnd({ id: e.id, cep: e.cep, logradouro: e.logradouro, numero: e.numero,
          complemento: e.complemento ?? '', bairro: e.bairro, cidade: e.cidade,
          estado: e.estado, tipo: e.tipo })
      } else {
        setEnd(enderecoVazio())
      }
    } catch { setErroId('Falha ao buscar cliente') }
    finally { setBuscando(false) }
  }

  const executar = async () => {
    setLoading(true)
    const campos = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    if (campos.licencas) campos.licencas = Number(campos.licencas) as unknown as string
    const enderecoPayload = end.cep || end.id ? end : undefined
    setResponse(await chamarApi('editar_cliente_pj', { id, ...campos, endereco: enderecoPayload }))
    setLoading(false)
  }
  const f = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value })
  const fc = `${i} focus:border-violet-500`

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-violet-400 mb-1 uppercase tracking-wider">Editar Cliente — PJ</h2>
      <p className="text-slate-500 text-xs mb-4">Cole o ID para carregar os dados automaticamente.</p>
      <div className="space-y-3">
        {/* Campo ID com busca automática */}
        <div>
          <label className={l}>ID do Cliente (UUID) *</label>
          <div className="flex gap-2">
            <input className={`${fc} font-mono flex-1`} placeholder="cole o uuid e pressione Tab ou Enter..."
              value={id}
              onChange={(e) => { setId(e.target.value); setErroId('') }}
              onBlur={() => buscarPorId(id)}
              onKeyDown={(e) => e.key === 'Enter' && buscarPorId(id)}
            />
            <button type="button" onClick={() => buscarPorId(id)} disabled={buscando}
              className="px-3 py-2 rounded text-xs font-bold border border-violet-600 text-violet-400 hover:bg-violet-600/20 disabled:opacity-50 transition">
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>
          {erroId && <p className="text-red-400 text-xs mt-1">{erroId}</p>}
          {buscando && <p className="text-violet-400 text-xs mt-1">Carregando dados do cliente...</p>}
        </div>

        <Field label="Razão Social"><input className={fc} value={form.razaoSocial} onChange={f('razaoSocial')} /></Field>
        <Field label="CNPJ"><input className={fc} value={form.cnpj} onChange={f('cnpj')} /></Field>
        <Field label="Nome Fantasia"><input className={fc} value={form.nomeFantasia} onChange={f('nomeFantasia')} /></Field>
        <Field label="Inscrição Estadual"><input className={fc} value={form.inscricaoEstadual} onChange={f('inscricaoEstadual')} /></Field>
        <Field label="Responsável Legal"><input className={fc} value={form.responsavel} onChange={f('responsavel')} /></Field>
        <Field label="Contato"><input className={fc} value={form.contato} onChange={f('contato')} /></Field>
        <Field label="E-mail"><input className={fc} value={form.email} onChange={f('email')} /></Field>
        <Field label="Parceiro"><input className={fc} value={form.parceiro} onChange={f('parceiro')} /></Field>
        <div className="flex gap-3">
          <div className="flex-1"><label className={l}>Plano</label>
            <select className={fc} value={form.plano} onChange={f('plano')}><option value="">—</option><option value="Start">Start</option><option value="Premium">Premium</option></select>
          </div>
          <div className="w-24"><label className={l}>Licenças</label><input type="number" className={fc} value={form.licencas} onChange={f('licencas')} /></div>
          <div className="flex-1"><label className={l}>Status</label>
            <select className={fc} value={form.status} onChange={f('status')}><option value="">—</option><option value="PAGO">PAGO</option><option value="ATRASADO">ATRASADO</option></select>
          </div>
        </div>
        <FormEndereco cor="violet" form={end} onChange={setEnd} />
        <button disabled={loading} onClick={executar} className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-600 text-white font-bold py-2 rounded transition mt-2">
          {loading ? 'Processando...' : 'POST editar_cliente_pj'}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// ATIVAR / DESATIVAR
// ---------------------------------------------------------------------------
function SecaoStatus() {
  const [id, setId] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const executar = async () => { setLoading(true); setResponse(await chamarApi('alterar_status_cliente', { id, ativo })); setLoading(false) }

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-red-400 mb-1 uppercase tracking-wider">Ativar / Desativar</h2>
      <p className="text-slate-500 text-xs mb-4">Funciona para PF e PJ.</p>
      <div className="space-y-3">
        <div><label className={l}>ID (UUID)</label><input className={`${i} focus:border-red-500 font-mono`} placeholder="cole o uuid..." value={id} onChange={(e) => setId(e.target.value)} /></div>
        <div className="flex gap-3">
          <button onClick={() => setAtivo(true)} className={`flex-1 py-2 rounded font-bold text-sm border transition ${ativo ? 'bg-green-600 border-green-500 text-white' : 'bg-transparent border-slate-600 text-slate-400 hover:border-green-500'}`}>✓ Ativar</button>
          <button onClick={() => setAtivo(false)} className={`flex-1 py-2 rounded font-bold text-sm border transition ${!ativo ? 'bg-red-700 border-red-500 text-white' : 'bg-transparent border-slate-600 text-slate-400 hover:border-red-500'}`}>✕ Desativar</button>
        </div>
        <button disabled={loading} onClick={executar} className={`w-full disabled:bg-slate-600 text-white font-bold py-2 rounded transition ${ativo ? 'bg-green-600 hover:bg-green-500' : 'bg-red-700 hover:bg-red-600'}`}>
          {loading ? 'Processando...' : `POST alterar_status_cliente`}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// REGISTRAR CLIENTE — testa a rota REAL de produção POST /api/cliente/registrar
// Diferente das seções acima que usam /api/test, esta bate direto no endpoint
// que o painel admin (e o sistema local do cliente) irá usar.
// ---------------------------------------------------------------------------
function SecaoRegistrar() {
  const COR = 'rose'
  const fc = `${i} focus:border-rose-500`

  // Tipo selecionado — alterna os campos exibidos
  const [tipo, setTipo] = useState<'PF' | 'PJ'>('PJ')

  // Campos exclusivos de PF
  const [pf, setPf] = useState({ nomeCompleto: '', cpf: '', rg: '', dataNascimento: '' })
  // Campos exclusivos de PJ
  const [pj, setPj] = useState({ razaoSocial: '', cnpj: '', nomeFantasia: '', inscricaoEstadual: '', responsavel: '' })
  // Campos base comuns
  const [base, setBase] = useState<BaseForm>({ contato: '', email: '', plano: 'Start', licencas: 1, parceiro: '', status: 'PAGO' })
  // Endereço opcional
  const [end, setEnd] = useState<EnderecoForm>(enderecoVazio())

  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const fpf = (k: keyof typeof pf) => (e: ChangeEvent<HTMLInputElement>) => setPf({ ...pf, [k]: e.target.value })
  const fpj = (k: keyof typeof pj) => (e: ChangeEvent<HTMLInputElement>) => setPj({ ...pj, [k]: e.target.value })

  const executar = async () => {
    setLoading(true)

    // Monta o payload dependendo do tipo selecionado
    const camposEspecificos = tipo === 'PF' ? pf : pj
    // Só inclui endereço se o CEP foi preenchido
    const enderecoPayload = end.cep ? end : undefined

    try {
      // ← Chama a rota REAL de produção, não o /api/test
      const res = await fetch('/api/cliente/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, ...base, ...camposEspecificos, endereco: enderecoPayload }),
      })
      const data = await res.json()
      setResponse({ status: res.status, statusText: res.statusText, ok: res.ok, payload: data })
    } catch (err) {
      setResponse({ error: 'Falha na conexão', ok: false, payload: err instanceof Error ? err.message : String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-rose-800/50 shadow-xl col-span-2">
      {/* Cabeçalho com badge indicando que é a rota real */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-rose-400 uppercase tracking-wider">
          Registrar Cliente
        </h2>
        <span className="text-xs font-mono bg-rose-950/60 text-rose-300 border border-rose-800/50 px-2 py-0.5 rounded">
          POST /api/cliente/registrar
        </span>
      </div>
      <p className="text-slate-500 text-xs mb-4">
        Rota de produção — usa o schema unificado (discriminatedUnion). O tipo alterna os campos exigidos.
      </p>

      {/* Toggle PF / PJ */}
      <div className="flex gap-2 mb-4">
        {(['PF', 'PJ'] as const).map(t => (
          <button key={t} onClick={() => setTipo(t)}
            className={`flex-1 py-2 rounded font-bold text-sm border transition ${
              tipo === t
                ? 'bg-rose-700 border-rose-500 text-white'
                : 'bg-transparent border-slate-600 text-slate-400 hover:border-rose-600'
            }`}>
            {t === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Coluna esquerda — campos específicos do tipo */}
        <div className="space-y-3">
          {tipo === 'PF' ? (
            <>
              <Field label="Nome Completo *"><input className={fc} placeholder="Ex: João da Silva" value={pf.nomeCompleto} onChange={fpf('nomeCompleto')} /></Field>
              <Field label="CPF *"><input className={fc} placeholder="000.000.000-00" value={pf.cpf} onChange={fpf('cpf')} /></Field>
              <Field label="RG"><input className={fc} placeholder="opcional" value={pf.rg} onChange={fpf('rg')} /></Field>
              <Field label="Data de Nascimento"><input type="date" className={fc} value={pf.dataNascimento} onChange={fpf('dataNascimento')} /></Field>
            </>
          ) : (
            <>
              <Field label="Razão Social *"><input className={fc} placeholder="Ex: Alpha Comércio Ltda" value={pj.razaoSocial} onChange={fpj('razaoSocial')} /></Field>
              <Field label="CNPJ *"><input className={fc} placeholder="00.000.000/0001-00" value={pj.cnpj} onChange={fpj('cnpj')} /></Field>
              <Field label="Nome Fantasia"><input className={fc} placeholder="opcional" value={pj.nomeFantasia} onChange={fpj('nomeFantasia')} /></Field>
              <Field label="Inscrição Estadual"><input className={fc} placeholder="opcional" value={pj.inscricaoEstadual} onChange={fpj('inscricaoEstadual')} /></Field>
              <Field label="Responsável Legal"><input className={fc} placeholder="opcional" value={pj.responsavel} onChange={fpj('responsavel')} /></Field>
            </>
          )}
        </div>

        {/* Coluna direita — campos base (iguais para PF e PJ) */}
        <div className="space-y-3">
          <CamposBase form={base} onChange={setBase} cor={COR} />
        </div>
      </div>

      {/* Endereço opcional — largura total */}
      <div className="mt-4">
        <FormEndereco cor={COR} form={end} onChange={setEnd} />
      </div>

      <button disabled={loading} onClick={executar}
        className="w-full mt-4 bg-rose-700 hover:bg-rose-600 disabled:bg-slate-600 text-white font-bold py-2 rounded transition">
        {loading ? 'Enviando...' : `POST /api/cliente/registrar — tipo: ${tipo}`}
      </button>

      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// EXPORT — o Tema usa grid 2 colunas, cada seção ocupa 1 célula
// ---------------------------------------------------------------------------
export function TemaClientes() {
  return (
    <>
      {/* ── ZONA 1: ROTA DE PRODUÇÃO ─────────────────────────────────────────
          Testa o endpoint real que o frontend vai consumir.
          Valide aqui DEPOIS de confirmar tudo nas rotas de teste abaixo. */}
      <SecaoRegistrar />

      {/* Divisor visual entre as duas zonas */}
      <div className="col-span-2 flex items-center gap-3 py-2">
        <div className="flex-1 border-t border-slate-700" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
          Rotas de Teste — /api/test
        </span>
        <div className="flex-1 border-t border-slate-700" />
      </div>

      {/* ── ZONA 2: LABORATÓRIO DE TESTES ───────────────────────────────────
          Use estas seções primeiro para validar schemas, services e banco.
          Só leve para produção (Zona 1) após confirmar tudo aqui. */}
      <SecaoListarPesquisar />
      <SecaoStatus />
      <SecaoCriarPF />
      <SecaoCriarPJ />
      <SecaoEditarPF />
      <SecaoEditarPJ />
    </>
  )
}
