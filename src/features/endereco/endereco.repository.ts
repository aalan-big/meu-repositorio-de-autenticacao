/*
 * ARQUIVO: Repository de Endereços
 * POSIÇÃO: Camada de Dados (Data Access Layer)
 * FUNÇÃO: Único arquivo que acessa a tabela 'enderecos' diretamente.
 * Endereços são vinculados a um cliente via clienteId (chave estrangeira).
 * Ao contrário do cliente, o endereço usa delete real — não tem soft-delete.
 */

import { prisma } from '@/lib/prisma'
import type { CriarEnderecoInput, EditarEnderecoInput } from './endereco.schema'

// R: READ - Lista todos os endereços de um cliente, ordenados do mais antigo ao mais novo
export async function findEnderecosByCliente(clienteId: string) {
  return prisma.endereco.findMany({
    where: { clienteId },
    orderBy: { criadoEm: 'asc' },
  })
}

// R: READ - Busca um endereço específico pelo seu ID
export async function findEnderecoById(id: string) {
  return prisma.endereco.findUnique({ where: { id } })
}

// C: CREATE - Grava um novo endereço vinculado ao cliente
export async function createEndereco(data: CriarEnderecoInput) {
  return prisma.endereco.create({ data })
}

// U: UPDATE - Atualiza campos de um endereço existente
export async function updateEndereco(id: string, data: EditarEnderecoInput) {
  return prisma.endereco.update({ where: { id }, data })
}

// D: DELETE - Remove o endereço permanentemente do banco
// Diferente do cliente, endereço não tem soft-delete — exclusão é definitiva
export async function deleteEndereco(id: string) {
  return prisma.endereco.delete({ where: { id } })
}
