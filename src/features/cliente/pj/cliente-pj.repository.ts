/*
 * ARQUIVO: Repository de Cliente Pessoa Jurídica
 * POSIÇÃO: Camada de Dados (Data Access Layer)
 * FUNÇÃO: Único arquivo que cria e atualiza registros de clientes PJ.
 * Usa uma transação implícita do Prisma: ao criar o Cliente base, já cria
 * o ClientePJ vinculado em uma única operação atômica no banco.
 */

import { prisma } from '@/lib/prisma'
import type { CriarClientePJInput, EditarClientePJInput } from './cliente-pj.schema'

// R: READ - Busca um ClientePJ pelo CNPJ apenas entre clientes não deletados
// findFirst + filtro de deletedAt porque o índice único do DB é condicional (clientes ativos)
export async function findClientePJByCnpj(cnpj: string) {
  return prisma.clientePJ.findFirst({
    where: { cnpj, cliente: { is: { deletedAt: null } } },
  })
}

// C: CREATE - Cria o registro base na tabela 'clientes' e o PJ em 'clientes_pj'
// O Prisma executa os dois INSERTs como uma única operação — se um falhar, ambos são cancelados
export async function createClientePJ(dados: CriarClientePJInput) {
  // Separa os campos específicos de PJ dos campos base do cliente
  const { razaoSocial, cnpj, nomeFantasia, inscricaoEstadual, responsavel, ...base } = dados

  return prisma.cliente.create({
    data: {
      ...base,
      tipo: 'PJ', // Define o tipo fixo para identificação nas listagens
      pj: {
        create: { razaoSocial, cnpj, nomeFantasia, inscricaoEstadual, responsavel },
      },
    },
    // Retorna o cliente já com os dados de PJ e endereços incluídos
    include: { pj: true, enderecos: true },
  })
}

// U: UPDATE - Atualiza o cliente base e os dados de PJ em uma única operação
// O spread condicional '...(campo && { campo })' só envia o campo se ele foi informado
export async function updateClientePJ(clienteId: string, dados: EditarClientePJInput) {
  const { razaoSocial, cnpj, nomeFantasia, inscricaoEstadual, responsavel, ...base } = dados

  return prisma.cliente.update({
    where: { id: clienteId },
    data: {
      ...base,
      pj: {
        update: {
          // Só inclui o campo na query se ele foi enviado (evita sobrescrever com undefined)
          ...(razaoSocial && { razaoSocial }),
          ...(cnpj && { cnpj }),
          ...(nomeFantasia !== undefined && { nomeFantasia }),
          ...(inscricaoEstadual !== undefined && { inscricaoEstadual }),
          ...(responsavel !== undefined && { responsavel }),
        },
      },
    },
    include: { pj: true, enderecos: true },
  })
}
