'use client'

import { useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Console } from '../_shared/Console'

interface ApiResponse {
  ok: boolean
  status?: number
  statusText?: string
  payload?: unknown
  error?: string
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

const inputCls = 'w-full bg-[#0f172a] border border-slate-600 rounded p-2 focus:border-sky-500 outline-none transition text-sm'
const labelCls = 'block text-xs uppercase font-bold text-slate-500 mb-1'

// ---------------------------------------------------------------------------
// SEÇÃO: LISTAR ENDEREÇOS DO CLIENTE
// ---------------------------------------------------------------------------
function SecaoListar() {
  const [clienteId, setClienteId] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const executar = async () => {
    setLoading(true)
    setResponse(await chamarApi('listar_enderecos', { clienteId }))
    setLoading(false)
  }

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-sky-400 mb-4 uppercase tracking-wider">
        Listar Endereços
      </h2>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>ID do Cliente (UUID)</label>
          <input className={`${inputCls} font-mono`} placeholder="cole o uuid do cliente..."
            value={clienteId} onChange={(e) => setClienteId(e.target.value)} />
        </div>
        <button disabled={loading} onClick={executar}
          className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white font-bold py-2 rounded transition">
          {loading ? 'Buscando...' : 'POST listar_enderecos'}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// SEÇÃO: ADICIONAR ENDEREÇO
// ---------------------------------------------------------------------------
interface EnderecoForm {
  clienteId: string; cep: string; logradouro: string; numero: string
  complemento: string; bairro: string; cidade: string; estado: string; tipo: string
}

function SecaoAdicionar() {
  const [form, setForm] = useState<EnderecoForm>({
    clienteId: '', cep: '', logradouro: '', numero: '',
    complemento: '', bairro: '', cidade: '', estado: '', tipo: 'PRINCIPAL',
  })
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const executar = async () => {
    setLoading(true)
    const dados = { ...form, complemento: form.complemento || undefined }
    setResponse(await chamarApi('adicionar_endereco', dados))
    setLoading(false)
  }

  const f = (key: keyof EnderecoForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const buscarCep = async () => {
    const cep = form.cep.replace(/\D/g, '')
    if (cep.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
        }))
      }
    } catch { /* ignora falha de CEP */ }
  }

  const handleCepKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') buscarCep()
  }

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-emerald-400 mb-1 uppercase tracking-wider">
        Adicionar Endereço
      </h2>
      <p className="text-slate-500 text-xs mb-4">Digite o CEP e pressione Enter para preencher automaticamente.</p>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>ID do Cliente (UUID) *</label>
          <input className={`${inputCls} font-mono`} placeholder="cole o uuid do cliente..."
            value={form.clienteId} onChange={f('clienteId')} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelCls}>CEP *</label>
            <input className={inputCls} placeholder="00000-000"
              value={form.cep} onChange={f('cep')} onBlur={buscarCep} onKeyDown={handleCepKey} />
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select className={inputCls} value={form.tipo} onChange={f('tipo')}>
              <option value="PRINCIPAL">PRINCIPAL</option>
              <option value="FILIAL">FILIAL</option>
              <option value="COBRANCA">COBRANÇA</option>
              <option value="ENTREGA">ENTREGA</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Logradouro *</label>
          <input className={inputCls} placeholder="Rua, Av, Travessa..."
            value={form.logradouro} onChange={f('logradouro')} />
        </div>
        <div className="flex gap-2">
          <div className="w-1/3">
            <label className={labelCls}>Número *</label>
            <input className={inputCls} placeholder="123"
              value={form.numero} onChange={f('numero')} />
          </div>
          <div className="flex-1">
            <label className={labelCls}>Complemento</label>
            <input className={inputCls} placeholder="Sala 01, Bloco B..."
              value={form.complemento} onChange={f('complemento')} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Bairro *</label>
          <input className={inputCls} placeholder="Centro"
            value={form.bairro} onChange={f('bairro')} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelCls}>Cidade *</label>
            <input className={inputCls} placeholder="Iguatu"
              value={form.cidade} onChange={f('cidade')} />
          </div>
          <div className="w-20">
            <label className={labelCls}>UF *</label>
            <input className={`${inputCls} uppercase`} placeholder="CE" maxLength={2}
              value={form.estado} onChange={f('estado')} />
          </div>
        </div>
        <button disabled={loading} onClick={executar}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-bold py-2 rounded transition mt-2">
          {loading ? 'Processando...' : 'POST adicionar_endereco'}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// SEÇÃO: EDITAR ENDEREÇO
// ---------------------------------------------------------------------------
function SecaoEditar() {
  const [id, setId] = useState('')
  const [form, setForm] = useState({ logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', tipo: '' })
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const executar = async () => {
    setLoading(true)
    const campos = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    setResponse(await chamarApi('editar_endereco', { id, ...campos }))
    setLoading(false)
  }

  const f = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value })

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-amber-400 mb-1 uppercase tracking-wider">
        Editar Endereço
      </h2>
      <p className="text-slate-500 text-xs mb-4">Preencha só os campos que deseja alterar.</p>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>ID do Endereço (UUID) *</label>
          <input className={`${inputCls} font-mono`} placeholder="cole o uuid do endereço..."
            value={id} onChange={(e) => setId(e.target.value)} />
        </div>
        {(['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado'] as const).map((key) => (
          <div key={key}>
            <label className={labelCls}>{key}</label>
            <input className={inputCls} placeholder={`novo ${key} (opcional)`}
              value={form[key]} onChange={f(key)} />
          </div>
        ))}
        <div>
          <label className={labelCls}>Tipo</label>
          <select className={inputCls} value={form.tipo} onChange={f('tipo')}>
            <option value="">— sem alteração —</option>
            <option value="PRINCIPAL">PRINCIPAL</option>
            <option value="FILIAL">FILIAL</option>
            <option value="COBRANCA">COBRANÇA</option>
            <option value="ENTREGA">ENTREGA</option>
          </select>
        </div>
        <button disabled={loading} onClick={executar}
          className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white font-bold py-2 rounded transition mt-2">
          {loading ? 'Processando...' : 'POST editar_endereco'}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// SEÇÃO: REMOVER ENDEREÇO
// ---------------------------------------------------------------------------
function SecaoRemover() {
  const [id, setId] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const executar = async () => {
    setLoading(true)
    setResponse(await chamarApi('remover_endereco', { id }))
    setLoading(false)
  }

  return (
    <section className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-base font-bold text-red-400 mb-1 uppercase tracking-wider">
        Remover Endereço
      </h2>
      <p className="text-slate-500 text-xs mb-4">Delete permanente — endereço será apagado do banco.</p>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>ID do Endereço (UUID)</label>
          <input className={`${inputCls} font-mono`} placeholder="cole o uuid do endereço..."
            value={id} onChange={(e) => setId(e.target.value)} />
        </div>
        <button disabled={loading} onClick={executar}
          className="w-full bg-red-700 hover:bg-red-600 disabled:bg-slate-600 text-white font-bold py-2 rounded transition">
          {loading ? 'Processando...' : 'POST remover_endereco'}
        </button>
      </div>
      <Console response={response} />
    </section>
  )
}

// ---------------------------------------------------------------------------
// EXPORT PRINCIPAL
// ---------------------------------------------------------------------------
export function TemaEnderecos() {
  return (
    <>
      <SecaoListar />
      <SecaoAdicionar />
      <SecaoEditar />
      <SecaoRemover />
    </>
  )
}
