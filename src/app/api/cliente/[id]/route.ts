/*
 * ============================================================
 * ROTAS: /api/cliente/[id]
 * ============================================================
 *
 * Este arquivo concentra três operações sobre um cliente específico:
 *
 *   GET    /api/cliente/:id  → "Ficha Completa"
 *   PATCH  /api/cliente/:id  → "Edição" ou "Reativação"
 *   DELETE /api/cliente/:id  → "Desativação" (soft-delete)
 *
 * POR QUE TRÊS VERBOS NO MESMO ARQUIVO?
 *   O Next.js App Router agrupa todos os verbos HTTP de uma URL em um
 *   único arquivo route.ts. Isso mantém toda a lógica de /api/cliente/:id
 *   em um só lugar, fácil de encontrar e modificar.
 *
 * NOTA SOBRE PARAMS (Next.js 16):
 *   O parâmetro dinâmico "[id]" não é mais um objeto síncrono.
 *   Em Next.js 16, ctx.params é uma Promise — precisa de "await".
 *   Exemplo: const { id } = await ctx.params
 *
 * ============================================================
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { findClienteById, setClienteAtivo } from '@/features/cliente/cliente.repository'
import { editarClientePF } from '@/features/cliente/pf/cliente-pf.service'
import { editarClientePJ } from '@/features/cliente/pj/cliente-pj.service'
import { editarClientePFSchema } from '@/features/cliente/pf/cliente-pf.schema'
import { editarClientePJSchema } from '@/features/cliente/pj/cliente-pj.schema'
import { editarEnderecoSchema } from '@/features/endereco/endereco.schema'
import { prisma } from '@/lib/prisma'

// ================================================================
// GET /api/cliente/:id — "Ficha Completa"
// ================================================================
//
// Retorna todos os dados de um cliente específico, incluindo os
// dados de PF ou PJ e a lista de endereços vinculados.
//
// Usado quando o admin abre o perfil de um cliente no painel.
//
// RESPOSTA:
//   200 → { data: { ...cliente, pf/pj, enderecos[] } }
//   404 → { erro: "Cliente não encontrado" }
// ================================================================
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // Em Next.js 16, params é uma Promise — sempre deve ser awaited
    const { id } = await ctx.params

    const cliente = await findClienteById(id)

    // O repository retorna null se o ID não existir no banco
    if (!cliente) {
      return NextResponse.json(
        { erro: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: cliente })

  } catch (error) {
    return NextResponse.json(
      { erro: 'Erro interno ao buscar cliente' },
      { status: 500 }
    )
  }
}

// ================================================================
// PATCH /api/cliente/:id — "Edição" ou "Reativação"
// ================================================================
//
// Esse verbo trata dois casos distintos dependendo do payload:
//
// CASO 1 — REATIVAÇÃO: { "ativo": true }
//   O cliente estava desativado (deletedAt preenchido).
//   Zera o deletedAt e redefine ativo = true.
//   Usado no painel quando o admin reativa um cliente cancelado.
//
// CASO 2 — EDIÇÃO PARCIAL: { campo1: valor1, campo2: valor2, ... }
//   Atualiza os campos informados sem tocar nos demais.
//   O schema correto (PF ou PJ) é escolhido com base no tipo
//   que o cliente já tem no banco — sem precisar enviar "tipo" no body.
//
// REGRAS DE NEGÓCIO (aplicadas nos services):
//   ✓ Não pode reduzir licenças abaixo do número de usuários ativos
//   ✓ CPF/CNPJ não pode conflitar com outro cliente ativo
//   ✓ E-mail não pode conflitar com outro cliente
//
// RESPOSTA:
//   200 → { msg: "...", data: { ...clienteAtualizado } }
//   400 → { erro: "..." } ou { erro: "Dados inválidos", detalhes: [...] }
//   404 → { erro: "Cliente não encontrado" }
// ================================================================
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params

    // ----------------------------------------------------------------
    // PASSO 1 — Busca o cliente para descobrir o tipo (PF ou PJ)
    //
    // Precisamos saber o tipo ANTES de validar o body,
    // pois cada tipo tem seu próprio schema de edição.
    // ----------------------------------------------------------------
    const cliente = await findClienteById(id)

    if (!cliente) {
      return NextResponse.json(
        { erro: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Separa o endereço do restante — ele tem seu próprio fluxo de upsert
    const { endereco: enderecoRaw, ...dadosCliente } = body

    // ----------------------------------------------------------------
    // PASSO 2 — CASO DE REATIVAÇÃO: ativo === true no payload
    //
    // Se o cliente está desativado (!cliente.ativo) e o payload pede
    // reativação (body.ativo === true), zeramos o deletedAt e marcamos
    // ativo = true. Não passamos pelo schema de edição nesse caso.
    //
    // Isso permite que o admin reative um cliente sem precisar enviar
    // todos os dados de PF/PJ novamente.
    // ----------------------------------------------------------------
    if (body.ativo === true && !cliente.ativo) {
      const reativado = await setClienteAtivo(id, true)
      return NextResponse.json({
        msg: 'Cliente reativado com sucesso',
        data: reativado,
      })
    }

    // ----------------------------------------------------------------
    // PASSO 3 — CASO DE EDIÇÃO PARCIAL
    //
    // Escolhemos o schema e o service certos com base no tipo do cliente.
    //
    // Por que não usar o tipo do body?
    //   Porque "tipo" não pode ser mudado (PF não vira PJ).
    //   Usar o tipo já gravado no banco é mais seguro e explícito.
    // ----------------------------------------------------------------
    if (cliente.tipo === 'PF') {
      const dadosValidados = editarClientePFSchema.parse(dadosCliente)
      const atualizado = await editarClientePF(id, dadosValidados)
      await upsertEndereco(id, cliente.enderecos, enderecoRaw)
      return NextResponse.json({ msg: 'Cliente PF atualizado com sucesso', data: atualizado })
    }

    if (cliente.tipo === 'PJ') {
      const dadosValidados = editarClientePJSchema.parse(dadosCliente)
      const atualizado = await editarClientePJ(id, dadosValidados)
      await upsertEndereco(id, cliente.enderecos, enderecoRaw)
      return NextResponse.json({ msg: 'Cliente PJ atualizado com sucesso', data: atualizado })
    }

    // Defensive: tipo desconhecido não deveria acontecer com banco íntegro
    return NextResponse.json(
      { erro: 'Tipo de cliente desconhecido' },
      { status: 400 }
    )

  } catch (error) {

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          erro: 'Dados inválidos',
          detalhes: error.issues.map(i => ({
            campo: i.path.join('.'),
            mensagem: i.message,
          })),
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { erro: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { erro: 'Erro interno ao atualizar cliente' },
      { status: 500 }
    )
  }
}

// ================================================================
// DELETE /api/cliente/:id — "Desativação" (Soft-Delete)
// ================================================================
//
// NÃO apaga o cliente do banco. Em vez disso, marca dois campos:
//   - ativo: false       → sai das listagens normais do dashboard
//   - deletedAt: now()   → registra quando ocorreu a desativação (auditoria)
//
// POR QUE SOFT-DELETE E NÃO DELETE REAL?
//   1. Auditoria: histórico de quem existiu e quando foi desativado
//   2. Recuperação: o admin pode reativar via PATCH { ativo: true }
//   3. Relatórios: dados passados (faturas, pedidos) continuam fazendo sentido
//   4. Integridade referencial: outras tabelas que referenciam este cliente
//      não quebram com erros de chave estrangeira
//
// PARA REATIVAR: PATCH /api/cliente/:id com body { "ativo": true }
//
// RESPOSTA:
//   200 → { msg: "Cliente desativado com sucesso", data: { ...cliente } }
//   404 → { erro: "Cliente não encontrado" }
// ================================================================
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params

    // ----------------------------------------------------------------
    // PASSO 1 — Confirma que o cliente existe antes de desativar
    //
    // Evita retornar sucesso para um ID inexistente, o que confundiria
    // o frontend (ele esperaria que a operação teve efeito).
    // ----------------------------------------------------------------
    const cliente = await findClienteById(id)

    if (!cliente) {
      return NextResponse.json(
        { erro: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // ----------------------------------------------------------------
    // PASSO 2 — Aplica o soft-delete
    //
    // setClienteAtivo(id, false) executa um único UPDATE:
    //   SET ativo = false, deletedAt = NOW()
    //
    // O cliente continua no banco, mas não aparece nas listagens
    // normais do dashboard (findAllClientes filtra ativo: true).
    //
    // Quando buscado diretamente por ID (GET /api/cliente/:id),
    // ainda retorna — o admin pode ver e reativar se necessário.
    // ----------------------------------------------------------------
    const desativado = await setClienteAtivo(id, false)

    return NextResponse.json({
      msg: 'Cliente desativado com sucesso',
      data: desativado,
    })

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { erro: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { erro: 'Erro interno ao desativar cliente' },
      { status: 500 }
    )
  }
}

// ================================================================
// HELPER: upsertEndereco
// Atualiza o endereço principal existente ou cria um novo.
// ================================================================
async function upsertEndereco(
  clienteId: string,
  enderecos: { id: string; tipo: string }[],
  raw: unknown
) {
  if (!raw || typeof raw !== 'object') return

  const dados = editarEnderecoSchema.parse(raw)
  const principal = enderecos.find(e => e.tipo === 'PRINCIPAL') ?? enderecos[0]

  if (principal) {
    await prisma.endereco.update({ where: { id: principal.id }, data: dados })
  } else {
    await prisma.endereco.create({
      data: { clienteId, tipo: 'PRINCIPAL', ...dados } as Parameters<typeof prisma.endereco.create>[0]['data'],
    })
  }
}
