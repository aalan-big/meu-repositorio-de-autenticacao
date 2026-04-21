/*
 * ARQUIVO: Rota da API (Endpoint) do Laboratório de Testes
 * POSIÇÃO: Camada de Apresentação / Interface de Rede (Next.js App Router)
 * FUNÇÃO: Este arquivo atua como a porta de entrada HTTP da sua API. 
 * Ele recebe a requisição POST, extrai o corpo (payload), repassa o trabalho 
 * para os handlers específicos e fornece uma malha de segurança centralizada (Try/Catch) 
 * para capturar e padronizar os erros antes de enviá-los ao cliente.
 */

// Importa o utilitário do Next.js para formatar as respostas HTTP (JSON, Status Code, etc.)
import { NextResponse } from 'next/server'
// Importa a classe de erro do Zod para conseguirmos identificar quando o erro foi de validação
import { ZodError } from 'zod'
// Importa o seu handler (o "maestro") que criamos em outro arquivo para processar a lógica
import { handleLogin } from './_handlers/login'
import { handleClientes } from './_handlers/clientes'
import { handleEnderecos } from './_handlers/enderecos'

/**
 * Lida com as requisições HTTP POST para os testes de integração (cadastro/login).
 * @param {Request} request - Objeto da requisição nativa da Web API do Next.js.
 * @returns {Promise<NextResponse>} Retorna um JSON com os dados da operação ou os erros estruturados.
 */
export async function POST(request: Request) {
  try {
    // 1. Extrai a 'acao' e os 'dados' do corpo da requisição em formato JSON
    const { acao, dados } = await request.json()

    // 2. Delega o roteamento lógico para o nosso handler isolado
    const resLogin = await handleLogin(acao, dados)
    // 3. Se o handler identificou a ação e processou (retornando um NextResponse), nós o devolvemos
    if (resLogin) return resLogin

    const resClientes = await handleClientes(acao, dados)
    if (resClientes) return resClientes

    const resEnderecos = await handleEnderecos(acao, dados)
    if (resEnderecos) return resEnderecos

    // 4. Fallback: Se nenhum handler reconheceu a ação, retorna 400.
    return NextResponse.json({ error: 'Ação de teste não reconhecida' }, { status: 400 })
  } 
  // -------------------------------------------------------------------------
    // TRATAMENTO CENTRALIZADO DE ERROS (A Malha de Segurança)
    // Aqui capturamos os erros que "estouraram" lá nos schemas ou no banco
    // -------------------------------------------------------------------------
    
    // Verifica se o erro foi disparado por uma falha no `.parse()` do Zod (ex: senha muito curta)
  catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Erro de Validação (Zod)',
          detalhes: error.issues }, // Devolve o array detalhado informando exatamente quais campos falharam
        { status: 400 } // 400 Bad Request: Culpa do cliente (mandou dados errados)
       )
    }
    // Tratamento genérico para qualquer outra exceção (erros do banco, falha de JWT, erro de sintaxe, etc.)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json(
      { error: message, 
        stack: 'Erro capturado no Laboratório de Testes' }, // Identificador útil para facilitar o debug no frontend
      { status: 500 }// 500 Internal Server Error: Culpa do servidor (algo falhou na nossa infra/código)
    )
  }
}
