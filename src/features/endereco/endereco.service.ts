/*
 * ARQUIVO: Service de Endereços
 * POSIÇÃO: Camada de Negócio (Business Logic Layer)
 * FUNÇÃO: Contém as regras de negócio dos endereços.
 * Valida a existência do cliente antes de adicionar um endereço,
 * e confirma que o endereço existe antes de editar ou remover.
 */

import {
  findEnderecosByCliente,
  findEnderecoById,
  createEndereco,
  updateEndereco,
  deleteEndereco,
} from './endereco.repository'
import { findClienteById } from '@/features/cliente/cliente.repository'
import type { CriarEnderecoInput, EditarEnderecoInput } from './endereco.schema'

// LISTAGEM: Valida o cliente antes de listar os endereços dele
export async function listarEnderecos(clienteId: string) {
  // 1. Garante que o cliente existe — evita consultas para IDs inválidos
  const cliente = await findClienteById(clienteId)
  if (!cliente) throw new Error('Cliente não encontrado.')

  // 2. Retorna a lista de endereços desse cliente
  return findEnderecosByCliente(clienteId)
}

// ADIÇÃO: Valida o cliente antes de criar o endereço vinculado
export async function adicionarEndereco(dados: CriarEnderecoInput) {
  // 1. Regra de Negócio: só adiciona endereço se o cliente existir
  const cliente = await findClienteById(dados.clienteId)
  if (!cliente) throw new Error('Cliente não encontrado.')

  // 2. Persistência: cliente confirmado, grava o endereço
  return createEndereco(dados)
}

// EDIÇÃO: Valida que o endereço existe antes de atualizar
export async function editarEndereco(id: string, dados: EditarEnderecoInput) {
  // 1. Garante que o endereço existe no banco
  const end = await findEnderecoById(id)
  if (!end) throw new Error('Endereço não encontrado.')

  // 2. Tudo certo — aplica as alterações
  return updateEndereco(id, dados)
}

// REMOÇÃO: Valida que o endereço existe antes de deletar permanentemente
export async function removerEndereco(id: string) {
  // 1. Garante que o endereço existe antes de tentar deletar
  const end = await findEnderecoById(id)
  if (!end) throw new Error('Endereço não encontrado.')

  // 2. Delete real — esta operação não pode ser desfeita
  return deleteEndereco(id)
}
