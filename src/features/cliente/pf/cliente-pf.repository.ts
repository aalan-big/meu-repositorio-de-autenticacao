/*
 * ARQUIVO: Repository de Cliente Pessoa Física
 * POSIÇÃO: Camada de Dados (Data Access Layer)
 * FUNÇÃO: Único arquivo que cria e atualiza registros de clientes PF.
 * Usa uma transação implícita do Prisma: ao criar o Cliente base, já cria
 * o ClientePF vinculado em uma única operação atômica no banco.
 */

import { prisma } from '@/lib/prisma'
import type { CriarClientePFInput, EditarClientePFInput } from './cliente-pf.schema'

// R: READ - Busca um ClientePF pelo CPF apenas entre clientes não deletados
// findFirst + filtro de deletedAt porque o índice único do DB é condicional (clientes ativos)
export async function findClientePFByCpf(cpf: string) {
  return prisma.clientePF.findFirst({
    where: { cpf, cliente: { is: { deletedAt: null } } },
  })
}

// C: CREATE - Cria o registro base na tabela 'clientes' e o PF em 'clientes_pf'
// O Prisma executa os dois INSERTs como uma única operação — se um falhar, ambos são cancelados
export async function createClientePF(dados: CriarClientePFInput) {
  // Separa os campos específicos de PF dos campos base do cliente
  const { nomeCompleto, cpf, rg, dataNascimento, ...base } = dados

  return prisma.cliente.create({
    data: {
      ...base,
      tipo: 'PF', // Define o tipo fixo para identificação nas listagens
      pf: {
        create: {
          nomeCompleto,
          cpf,
          rg,
          // Converte a string ISO para objeto Date que o Prisma/Postgres espera
          dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
        },
      },
    },
    // Retorna o cliente já com os dados de PF e endereços incluídos
    include: { pf: true, enderecos: true },
  })
}

// U: UPDATE - Atualiza o cliente base e os dados de PF em uma única operação
// O '...' spread só envia os campos que foram informados, ignorando os undefined
export async function updateClientePF(clienteId: string, dados: EditarClientePFInput) {
  const { nomeCompleto, cpf, rg, dataNascimento, ...base } = dados

  return prisma.cliente.update({
    where: { id: clienteId },
    data: {
      ...base,
      pf: {
        update: {
          // Só inclui o campo na query se ele foi enviado (evita sobrescrever com undefined)
          ...(nomeCompleto && { nomeCompleto }),
          ...(cpf && { cpf }),
          ...(rg !== undefined && { rg }),
          ...(dataNascimento && { dataNascimento: new Date(dataNascimento) }),
        },
      },
    },
    include: { pf: true, enderecos: true },
  })
}
