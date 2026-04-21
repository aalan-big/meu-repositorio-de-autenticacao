/*
 * ============================================================
 * ROTA: POST /api/cliente/registrar
 * APELIDO: "O Nascimento" — esta rota cria um cliente do zero.
 * ============================================================
 *
 * FUNÇÃO:
 *   Endpoint de produção para cadastrar um novo cliente (PF ou PJ)
 *   com endereço opcional. Toda a operação é atômica: se qualquer
 *   escrita falhar, nenhuma alteração permanece no banco.
 *
 * POR QUE prisma.$transaction AQUI?
 *   O cadastro envolve 2 (ou 3) tabelas:
 *     1. clientes         → linha base com email, plano, parceiro...
 *     2. clientes_pf ou clientes_pj → dados específicos do tipo
 *     3. enderecos        → opcional, vinculado pelo clienteId
 *
 *   Sem transação: se o endereço falhar após o cliente ter sido criado,
 *   o banco fica com um cliente sem endereço prometido — dado inconsistente.
 *   Com transação: ou tudo salva junto, ou nada salva.
 *
 * DIFERENÇA DO /api/test:
 *   O /api/test é o laboratório de desenvolvimento (usado na página /debug).
 *   Esta rota é a porta de entrada real do sistema — será chamada pelo
 *   painel admin, pelo app mobile ou pelo sistema local do cliente.
 *
 * FLUXO DA REQUISIÇÃO:
 *   1. Recebe o JSON no corpo da requisição
 *   2. Separa o campo "endereco" do restante dos dados
 *   3. Valida os dados do cliente com o schema unificado (PF ou PJ)
 *   4. Valida o endereço se foi enviado (sem o clienteId ainda — ele não existe)
 *   5. Verifica unicidade (CPF/CNPJ e e-mail) — feito FORA da transação por serem apenas leituras
 *   6. Abre a transação e escreve tudo atomicamente
 *   7. Retorna 201 com os dados completos do cliente criado
 *
 * EXEMPLO DE PAYLOAD (PJ com endereço):
 *   {
 *     "tipo": "PJ",
 *     "razaoSocial": "Alpha Ltda",
 *     "cnpj": "11.222.333/0001-81",
 *     "contato": "João Silva",
 *     "email": "joao@alpha.com",
 *     "parceiro": "BigTec Iguatu",
 *     "endereco": {
 *       "cep": "63500-000",
 *       "logradouro": "Rua das Flores",
 *       "numero": "100",
 *       "bairro": "Centro",
 *       "cidade": "Iguatu",
 *       "estado": "CE"
 *     }
 *   }
 * ============================================================
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Schema unificado: valida PF ou PJ automaticamente pelo campo "tipo"
import { criarClienteUnificadoSchema } from '@/features/cliente/cliente.unified.schema'

// Schema de endereço — valida sem clienteId (será injetado dentro da transação)
import { criarEnderecoSchema } from '@/features/endereco/endereco.schema'

// Repositories de leitura — usados ANTES da transação para verificar unicidade
import { findClientePFByCpf } from '@/features/cliente/pf/cliente-pf.repository'
import { findClientePJByCnpj } from '@/features/cliente/pj/cliente-pj.repository'
import { findClienteByEmail } from '@/features/cliente/cliente.repository'

// Cliente Prisma — necessário para abrir a transação explícita
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // ----------------------------------------------------------------
    // PASSO 1 — Lê o corpo da requisição como JSON
    // ----------------------------------------------------------------
    const body = await request.json()

    // ----------------------------------------------------------------
    // PASSO 2 — Separa o endereço do restante dos dados do cliente
    //
    // O endereço é opcional e tem seu próprio schema de validação.
    // Ele NÃO faz parte do criarClienteUnificadoSchema — cliente pode
    // ser cadastrado sem endereço inicial.
    // ----------------------------------------------------------------
    const { endereco: enderecoRaw, ...dadosCliente } = body

    // ----------------------------------------------------------------
    // PASSO 3 — Valida os dados do cliente com o schema unificado
    //
    // O criarClienteUnificadoSchema é um "discriminatedUnion":
    //   - Se "tipo" = "PF" → exige CPF, nomeCompleto, etc.
    //   - Se "tipo" = "PJ" → exige CNPJ, razaoSocial, etc.
    //
    // Os transforms também rodam aqui:
    //   - CPF/CNPJ tem máscara removida automaticamente
    //   - E-mail é convertido para minúsculas
    // ----------------------------------------------------------------
    const dadosValidados = criarClienteUnificadoSchema.parse(dadosCliente)

    // ----------------------------------------------------------------
    // PASSO 4 — Pré-valida o endereço (sem clienteId ainda)
    //
    // Validamos a estrutura do endereço aqui, antes da transação.
    // O clienteId ainda não existe — ele será injetado dentro da
    // transação após o cliente ser criado.
    //
    // O schema usa z.string().uuid() para clienteId, então passamos
    // um UUID fictício apenas para a validação dos outros campos,
    // depois sobrescrevemos com o ID real dentro da transação.
    // ----------------------------------------------------------------
    let enderecoPreValidado: ReturnType<typeof criarEnderecoSchema.parse> | null = null

    if (enderecoRaw && typeof enderecoRaw === 'object' && enderecoRaw.cep) {
      // Injeta clienteId temporário só para satisfazer o schema uuid()
      // O valor real será substituído dentro da transação
      enderecoPreValidado = criarEnderecoSchema.parse({
        ...enderecoRaw,
        clienteId: '00000000-0000-0000-0000-000000000000',
      })
    }

    // ----------------------------------------------------------------
    // PASSO 5 — Verifica unicidade (CPF/CNPJ e e-mail)
    //
    // IMPORTANTE: Fazemos essas verificações FORA da transação por dois motivos:
    //   1. São apenas leituras (SELECT) — não precisam de atomicidade
    //   2. Transações longas com reads intermediários podem causar deadlocks
    //      no banco de dados
    //
    // Race condition teórica: dois cadastros simultâneos com o mesmo CPF
    // poderiam passar por aqui ao mesmo tempo. Em produção real com alto
    // volume simultâneo, adicionar um índice UNIQUE condicional no banco
    // seria a proteção definitiva. Para este sistema, a janela de risco
    // é aceitável dado o volume esperado.
    // ----------------------------------------------------------------
    if (dadosValidados.tipo === 'PF') {
      const existeCpf = await findClientePFByCpf(dadosValidados.cpf)
      if (existeCpf) throw new Error('CPF já cadastrado.')
    } else {
      const existeCnpj = await findClientePJByCnpj(dadosValidados.cnpj)
      if (existeCnpj) throw new Error('CNPJ já cadastrado.')
    }

    const existeEmail = await findClienteByEmail(dadosValidados.email)
    if (existeEmail) throw new Error('E-mail já cadastrado em outro cliente.')

    // ----------------------------------------------------------------
    // PASSO 6 — Transação atômica: escreve tudo ou nada
    //
    // prisma.$transaction() recebe uma função assíncrona com o cliente
    // de transação "tx". Todas as operações feitas com "tx" fazem parte
    // do mesmo bloco atômico:
    //
    //   ✓ Se o cliente for criado mas o endereço falhar → ROLLBACK TOTAL
    //   ✓ Se tudo der certo → COMMIT (dados aparecem para outros usuários)
    //
    // ORDEM OBRIGATÓRIA:
    //   1º cria o cliente (para gerar o ID)
    //   2º cria o endereço usando o ID do cliente recém-criado
    //   Inverter a ordem causaria erro de chave estrangeira.
    // ----------------------------------------------------------------
    const { cliente, enderecoSalvo } = await prisma.$transaction(async (tx) => {

      // — 6a. Cria o cliente base + dados PF ou PJ (nested write atômico)
      //
      // O Prisma nested write ("pf: { create: {...} }") executa dois INSERTs
      // dentro da mesma transação pai: um em 'clientes' e outro em 'clientes_pf'.
      // Não precisamos gerenciar isso manualmente.
      let novoCliente

      if (dadosValidados.tipo === 'PF') {
        const { nomeCompleto, cpf, rg, dataNascimento, tipo, ...base } = dadosValidados
        novoCliente = await tx.cliente.create({
          data: {
            ...base,
            tipo: 'PF',
            pf: {
              create: {
                nomeCompleto,
                cpf,
                rg,
                dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
              },
            },
          },
          include: { pf: true, pj: true, enderecos: true },
        })
      } else {
        const { razaoSocial, cnpj, nomeFantasia, inscricaoEstadual, responsavel, tipo, ...base } = dadosValidados
        novoCliente = await tx.cliente.create({
          data: {
            ...base,
            tipo: 'PJ',
            pj: {
              create: { razaoSocial, cnpj, nomeFantasia, inscricaoEstadual, responsavel },
            },
          },
          include: { pf: true, pj: true, enderecos: true },
        })
      }

      // — 6b. Cria o endereço vinculado ao cliente recém-criado (se enviado)
      //
      // Agora temos o novoCliente.id real — substituímos o clienteId temporário.
      // Se enderecoPreValidado for null, o cliente é criado sem endereço.
      let novoEndereco = null

      if (enderecoPreValidado) {
        novoEndereco = await tx.endereco.create({
          data: {
            ...enderecoPreValidado,
            clienteId: novoCliente.id, // ID real — sobrescreve o UUID temporário
          },
        })
      }

      return { cliente: novoCliente, enderecoSalvo: novoEndereco }
    })

    // ----------------------------------------------------------------
    // PASSO 7 — Retorna 201 (Created) com todos os dados do cliente
    // ----------------------------------------------------------------
    return NextResponse.json(
      {
        msg: `Cliente ${dadosValidados.tipo} registrado com sucesso`,
        data: { ...cliente, endereco: enderecoSalvo },
      },
      { status: 201 }
    )

  } catch (error) {

    // ----------------------------------------------------------------
    // TRATAMENTO DE ERROS
    //
    // ZodError → dados inválidos enviados pelo cliente (400 Bad Request)
    //   Retorna os detalhes exatos de cada campo que falhou.
    //
    // Error comum → regra de negócio violada (CPF duplicado, etc.)
    //   Retorna a mensagem do erro que o service lançou.
    //
    // Erro desconhecido → falha inesperada no servidor (500)
    // ----------------------------------------------------------------
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
      { erro: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}
