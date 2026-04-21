
/*
 * ARQUIVO: Componente de Formulário de Login (Front-end)
 * POSIÇÃO: src/features/auth/components/LoginForm.tsx
 * FUNÇÃO: Captura dados, envia para a API e SALVA o usuário no navegador.
 */

'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface LoginFormState {
  email: string
  senha: string
}

export function LoginForm() {
  const router = useRouter()
  const [form, setForm] = useState<LoginFormState>({ email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro || 'Erro ao fazer login.')
        return
      }

      // ============================================================
      // AQUI É ONDE O NOME DO ALAN É SALVO!
      // Se a API retornou o campo 'usuario' com o nome, nós guardamos.
      // ============================================================
      if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user))
      }

      router.push('/dashboard')
    } catch {
      setErro('Erro ao conectar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {erro && (
        <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {erro}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          E-mail
        </label>
        <input
          type="email"
          required
          className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="admin@exemplo.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Senha
        </label>
        <input
          type="password"
          required
          className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.senha}
          onChange={(e) => setForm({ ...form, senha: e.target.value })}
          placeholder="••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}