'use client'

import { useState, type ChangeEvent, type KeyboardEvent } from 'react'

export interface EnderecoForm {
  id?: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  tipo: string
}

export const enderecoVazio = (): EnderecoForm => ({
  id: '', cep: '', logradouro: '', numero: '',
  complemento: '', bairro: '', cidade: '', estado: '', tipo: 'PRINCIPAL',
})

interface Props {
  cor: string
  form: EnderecoForm
  onChange: (f: EnderecoForm) => void
  modoEdicao?: boolean // true = exibe campo ID do endereço para edição
}

export function FormEndereco({ cor, form, onChange, modoEdicao = false }: Props) {
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [erroCep, setErroCep] = useState('')

  const inp = `w-full bg-[#0f172a] border border-slate-600 rounded p-2 focus:border-${cor}-500 outline-none transition text-sm`
  const lbl = 'block text-xs uppercase font-bold text-slate-500 mb-1'

  const f = (k: keyof EnderecoForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...form, [k]: e.target.value })

  const buscarCep = async () => {
    const cep = form.cep.replace(/\D/g, '')
    if (cep.length !== 8) { setErroCep('CEP deve ter 8 dígitos'); return }
    setBuscandoCep(true)
    setErroCep('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await res.json()
      if (d.erro) {
        setErroCep('CEP não encontrado')
      } else {
        onChange({
          ...form,
          logradouro: d.logradouro || '',
          bairro:     d.bairro     || '',
          cidade:     d.localidade || '',
          estado:     d.uf         || '',
        })
        setErroCep('')
      }
    } catch {
      setErroCep('Falha ao buscar o CEP')
    } finally {
      setBuscandoCep(false)
    }
  }

  return (
    <div className={`space-y-3 border border-${cor}-800/40 rounded-lg p-4 bg-${cor}-950/10`}>
      <p className={`text-${cor}-400 text-xs font-bold uppercase tracking-wider`}>Endereço</p>

      {/* ID do endereço — só aparece no modo edição */}
      {modoEdicao && (
        <div>
          <label className={lbl}>ID do Endereço (UUID) — deixe vazio para criar novo</label>
          <input className={`${inp} font-mono`} placeholder="cole o uuid do endereço para editar..."
            value={form.id ?? ''} onChange={f('id')} />
        </div>
      )}

      {/* CEP com busca automática */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className={lbl}>CEP</label>
          <input className={inp} placeholder="00000-000"
            value={form.cep} onChange={f('cep')}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && buscarCep()}
            onBlur={buscarCep}
          />
          {erroCep && <p className="text-red-400 text-xs mt-1">{erroCep}</p>}
        </div>
        <button type="button" onClick={buscarCep} disabled={buscandoCep}
          className={`px-3 py-2 rounded text-xs font-bold border border-${cor}-600 text-${cor}-400 hover:bg-${cor}-600/20 disabled:opacity-50 transition`}>
          {buscandoCep ? '...' : 'Buscar'}
        </button>
        <div className="flex-shrink-0">
          <label className={lbl}>Tipo</label>
          <select className={inp} value={form.tipo} onChange={f('tipo')}>
            <option value="PRINCIPAL">PRINCIPAL</option>
            <option value="FILIAL">FILIAL</option>
            <option value="COBRANCA">COBRANÇA</option>
            <option value="ENTREGA">ENTREGA</option>
          </select>
        </div>
      </div>

      {/* Campos preenchidos automaticamente pelo CEP */}
      <div>
        <label className={lbl}>Logradouro</label>
        <input className={inp} placeholder="Rua, Av, Travessa..." value={form.logradouro} onChange={f('logradouro')} />
      </div>

      <div className="flex gap-2">
        <div className="w-1/3">
          <label className={lbl}>Número *</label>
          <input className={inp} placeholder="123 / S/N" value={form.numero} onChange={f('numero')} />
        </div>
        <div className="flex-1">
          <label className={lbl}>Complemento</label>
          <input className={inp} placeholder="Sala 01, Bloco B..." value={form.complemento} onChange={f('complemento')} />
        </div>
      </div>

      <div>
        <label className={lbl}>Bairro</label>
        <input className={inp} placeholder="Centro" value={form.bairro} onChange={f('bairro')} />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className={lbl}>Cidade</label>
          <input className={inp} placeholder="Iguatu" value={form.cidade} onChange={f('cidade')} />
        </div>
        <div className="w-20">
          <label className={lbl}>UF</label>
          <input className={`${inp} uppercase`} placeholder="CE" maxLength={2} value={form.estado} onChange={f('estado')} />
        </div>
      </div>
    </div>
  )
}
