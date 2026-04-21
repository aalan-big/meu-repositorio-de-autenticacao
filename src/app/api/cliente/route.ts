/*
 * ============================================================
 * ROTA: GET /api/cliente
 * APELIDO: "A Vitrine" — lista os clientes para o dashboard.
 * ============================================================
 *
 * FUNÇÃO:
 *   Retorna a lista de clientes para o painel administrativo.
 *   Sem parâmetros → lista todos os clientes ATIVOS.
 *   Com ?q= → pesquisa inteligente em múltiplos campos.
 *
 * DIFERENÇA ENTRE LISTAGEM E PESQUISA:
 *   findAllClientes()   → sempre filtra ativo: true
 *                         usado no carregamento inicial do dashboard
 *
 *   searchClientes(q)   → não filtra por ativo
 *                         permite encontrar clientes desativados pelo nome/CPF
 *                         essencial para reativar clientes que pediram cancelamento
 *                         e voltaram depois
 *
 * PARÂMETROS DE QUERY:
 *   ?q=<termo>    Pesquisa em: id, email, contato, parceiro,
 *                 nome (PF), cpf (PF), razão social (PJ),
 *                 nome fantasia (PJ), cnpj (PJ)
 *
 * EXEMPLOS:
 *   GET /api/cliente              → todos os ativos
 *   GET /api/cliente?q=João       → clientes com "João" no nome/contato
 *   GET /api/cliente?q=11222333   → busca pelo CPF/CNPJ (com ou sem máscara)
 *   GET /api/cliente?q=<uuid>     → localiza cliente pelo ID exato
 * ============================================================
 */

import { NextResponse } from 'next/server'
import { findAllClientes, searchClientes } from '@/features/cliente/cliente.repository'

export async function GET(request: Request) {
  try {
    // ----------------------------------------------------------------
    // PASSO 1 — Extrai o parâmetro de pesquisa da URL
    //
    // new URL(request.url) converte a string da URL em objeto navegável.
    // searchParams.get('q') retorna null se o parâmetro não foi enviado.
    // O || '' garante que sempre tenhamos uma string (nunca null).
    // ----------------------------------------------------------------
    const { searchParams } = new URL(request.url)
    const termo = searchParams.get('q') || ''

    // ----------------------------------------------------------------
    // PASSO 2 — Decide qual query executar
    //
    // Se um termo foi passado → pesquisa inteligente (sem filtro de ativo,
    // permite localizar clientes desativados para reativação)
    //
    // Se nenhum termo → listagem padrão (apenas ativos, para o dashboard)
    // ----------------------------------------------------------------
    const clientes = termo.trim()
      ? await searchClientes(termo)
      : await findAllClientes()

    // ----------------------------------------------------------------
    // PASSO 3 — Retorna a lista
    //
    // Cada item já vem com os dados de pf/pj e enderecos incluídos,
    // pois o repository usa { include: { pf: true, pj: true, enderecos: true } }
    // ----------------------------------------------------------------
    return NextResponse.json({ data: clientes })

  } catch (error) {
    return NextResponse.json(
      { erro: 'Erro interno ao listar clientes' },
      { status: 500 }
    )
  }
}
