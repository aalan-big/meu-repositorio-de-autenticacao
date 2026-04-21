/*
 * ARQUIVO: Repository Base de Clientes
 * POSIÇÃO: Camada de Dados (Data Access Layer)
 * FUNÇÃO: Único arquivo que acessa a tabela 'clientes' diretamente.
 * Todas as queries genéricas (listar, buscar, pesquisar) vivem aqui.
 * Operações específicas de PF ou PJ ficam nos seus próprios repositories.
 */

import { prisma } from '@/lib/prisma'

// Incluir sempre os dados de PF, PJ e endereços junto com o cliente base
const includeAll = {
  pf: true,       // dados da Pessoa Física (cpf, rg, dataNascimento...)
  pj: true,       // dados da Pessoa Jurídica (cnpj, razaoSocial...)
  enderecos: true // lista de endereços vinculados
}

// R: READ - Lista todos os clientes ativos (PF e PJ juntos), do mais recente ao mais antigo
export async function findAllClientes() {
  return prisma.cliente.findMany({
    where: { ativo: true },
    include: includeAll,
    orderBy: { criadoEm: 'desc' },
  })
}

// R: READ - Busca um cliente pelo ID, trazendo todos os dados relacionados
export async function findClienteById(id: string) {
  return prisma.cliente.findUnique({
    where: { id },
    include: includeAll,
  })
}

// R: READ - Pesquisa inteligente: busca o termo em campos de PF e PJ ao mesmo tempo
// Sem filtro ativo: busca com termo encontra qualquer cliente (ativo ou não),
// permitindo localizar e reativar clientes desativados. Listagem vazia usa findAllClientes.
export async function searchClientes(termo: string) {
  const t = termo.trim()
  return prisma.cliente.findMany({
    where: {
      OR: [
        { id:    { contains: t, mode: 'insensitive' } },
        { email: { contains: t, mode: 'insensitive' } },
        { pf: { nomeCompleto: { contains: t, mode: 'insensitive' } } },
        { pf: { cpf:          { contains: t, mode: 'insensitive' } } },
        { pj: { razaoSocial:  { contains: t, mode: 'insensitive' } } },
        { pj: { nomeFantasia: { contains: t, mode: 'insensitive' } } },
        { pj: { cnpj:         { contains: t, mode: 'insensitive' } } },
        { pj: { responsavel:  { contains: t, mode: 'insensitive' } } },
      ],
    },
    include: includeAll,
    orderBy: { criadoEm: 'desc' },
  })
}

// R: READ - Busca um cliente pelo e-mail (usado para evitar duplicatas)
export async function findClienteByEmail(email: string, excluirId?: string) {
  return prisma.cliente.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
  })
}

// U: UPDATE - Ativa ou desativa um cliente sem apagar do banco (soft-delete controlado)
// deletedAt registra o momento exato da desativação para auditoria; volta a null ao reativar
export async function setClienteAtivo(id: string, ativo: boolean) {
  return prisma.cliente.update({
    where: { id },
    data: {
      ativo,
      deletedAt: ativo ? null : new Date(),
    },
  })
}
