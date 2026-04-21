/*
 * ARQUIVO: Handler/Controller de Autenticação e Cadastro
 * POSIÇÃO: Camada de Apresentação/Roteamento (Controllers / Actions)
 * FUNÇÃO: Este arquivo atua como o "maestro" das requisições para a rota. 
 * Ele recebe o payload bruto, aplica a validação de formato e tipagem (via Zod), 
 * e delega a execução das regras de negócio para a camada de Service.
 * Nenhuma regra de negócio complexa ou acesso direto ao banco deve existir aqui.
 */

import { NextResponse } from 'next/server'
// Importações dos services (regras de negócio e banco de dados)
import { criarUsuario } from '@/features/usuario/usuario.service'
import { authenticateUser } from '@/features/auth/auth.service'
// Importações dos schemas do Zod para validação e tipagem dos payloads
import { criarUsuarioSchema } from '@/features/usuario/usuario.schema'
import { loginSchema } from '@/features/auth/auth.schema'


/**
 * Gerencia as rotas de teste para fluxos de autenticação e cadastro.
 * Recebe o payload bruto, aplica a validação de schema e delega a execução ao respectivo service.
 * * @param acao - Identificador da operação a ser executada ('testar_cadastro' ou 'testar_login').
 * @param dados - Payload bruto da requisição. É do tipo 'unknown' até passar pelo `.parse()` do Zod.
 * @returns {Promise<NextResponse | null>} Retorna um JSON de sucesso ou null se a ação for inválida.
 */
export async function handleLogin(acao: string, dados: unknown) {
  // ---------------------------------------------------------------------------
  // ROTA DE TESTE: CADASTRO DE USUÁRIO
  // ---------------------------------------------------------------------------
  if (acao === 'testar_cadastro') {
    // Valida os dados de entrada contra o schema de criação.
    // Observação: Se falhar, o Zod lança uma exceção (ZodError) que deve ser tratada no nível superior (Try/Catch).
    const dadosValidados = criarUsuarioSchema.parse(dados)
    
    // Chama o service para persistir os dados validados (ex: no banco de dados via Prisma)
    const res = await criarUsuario(dadosValidados)

    // Retorna a resposta padronizada confirmando a criação
    return NextResponse.json({ msg: 'Service de Cadastro OK', data: res })
  }

  // ---------------------------------------------------------------------------
  // ROTA DE TESTE: LOGIN DE USUÁRIO
  // ---------------------------------------------------------------------------
  if (acao === 'testar_login') {
     // Valida o payload de login garantindo a presença e o formato das credenciais
    const dadosValidados = loginSchema.parse(dados)

    // Chama o service de autenticação (onde as senhas são comparadas, JWT gerado, etc.)
    const res = await authenticateUser(dadosValidados)
    
    // Retorna a resposta confirmando a autenticação e devolvendo o payload (ex: token)
    return NextResponse.json({ msg: 'Service de Login OK', data: res })
  }

  // Fallback de segurança: retorna null caso a 'acao' enviada não corresponda a nenhum dos fluxos mapeados acima
  return null
}
