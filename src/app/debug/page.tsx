'use client'

import { useState } from 'react'
import { Tema } from './_shared/Tema'
import { TemaLogin } from './_temas/TemaLogin'
import { TemaClientes } from './_temas/TemaClientes'

interface UsuarioLogado {
  nome: string
  email: string
}

export default function DebugPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null)

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">

      {/* Cabeçalho */}
      <header className="mb-8 border-b border-slate-700 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400">BigTec API Laboratory</h1>
          <p className="text-slate-400 text-sm">
            Ambiente isolado para validação de Modules (Zod + Service + Prisma)
          </p>
        </div>

        {/* Badge do usuário logado — só aparece após o login */}
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Sessão ativa</p>
              <p className="text-sm font-bold text-emerald-400">{usuario.nome}</p>
              <p className="text-xs text-slate-500">{usuario.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400">
              {usuario.nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <button
              onClick={() => setUsuario(null)}
              className="text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-2 py-1 rounded transition"
            >
              Sair
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-col gap-6">

        {/* LOGIN — sempre visível */}
        <Tema titulo="Login">
          <TemaLogin onLogin={setUsuario} />
        </Tema>

        {/* CLIENTES — bloqueado até fazer login */}
        <Tema titulo={`Clientes${usuario ? ` — ${usuario.nome}` : ' 🔒'}`}>
          {usuario ? (
            <TemaClientes />
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center py-14 gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl">
                🔒
              </div>
              <p className="text-slate-400 font-semibold text-sm">Acesso restrito</p>
              <p className="text-slate-600 text-xs text-center max-w-xs">
                Faça login na seção acima para liberar o módulo de Clientes.
              </p>
            </div>
          )}
        </Tema>

      </div>
    </div>
  )
}
