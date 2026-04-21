import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ZodError } from 'zod'
import { authenticateUser } from '@/features/auth/auth.service'
import { loginSchema } from '@/features/auth/auth.schema'


export async function POST(request: Request) {
  try {
    const body = await request.json()
    const dados = loginSchema.parse(body)
    const result = await authenticateUser(dados)

    if (result.token) {
      const cookieStore = await cookies()
      cookieStore.set('token', result.token, {
        httpOnly: true, // Javascript do frontend não consegue ler (protege contra XSS)
        secure: process.env.NODE_ENV === 'production', // Exige HTTPS em produção
        sameSite: 'lax', // Segurança extra contra falsificação de requisições
        maxAge: 60 * 60 * 8, // Dura 8 horas, igual a validade que você definiu no JWT
        path: '/', // Válido em todo o sistema (inclusive no /dashboard)
      })
    }
    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { erro: 'Dados inválidos', detalhes: error.issues },
        { status: 400 }
      )
    }
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ erro: message }, { status: 401 })
  }
}
