/*
 * ARQUIVO: Service Base de Clientes
 * POSIÇÃO: Camada de Negócio (Business Logic Layer)
 * FUNÇÃO: Contém a "inteligência" comum a todos os clientes.
 * Operações de listagem, pesquisa e controle de status vivem aqui.
 * A criação e edição específica de PF/PJ ficam nos seus próprios services.
 */

import {
  findAllClientes,
  searchClientes,
  findClienteById,
  setClienteAtivo,
} from './cliente.repository'

// LISTAGEM: Retorna todos os clientes ativos com seus dados de PF/PJ e endereços
export async function listarClientes() {
  return findAllClientes()
}

// PESQUISA: Se o termo estiver vazio, lista todos — caso contrário filtra no banco
// A busca é feita diretamente no PostgreSQL, não em memória
export async function pesquisarClientes(termo: string) {
  if (!termo.trim()) return findAllClientes()
  return searchClientes(termo)
}

// BUSCA POR ID: Valida se o cliente existe antes de retornar
// Lança erro 'Cliente não encontrado' que será capturado pelo handler
export async function buscarCliente(id: string) {
  const cliente = await findClienteById(id)
  if (!cliente) throw new Error('Cliente não encontrado.')
  return cliente
}

// ATIVAR / DESATIVAR: Altera o campo 'ativo' sem apagar o registro do banco
// true = cliente aparece nas listagens | false = cliente fica oculto
export async function alterarStatusCliente(id: string, ativo: boolean) {
  // 1. Garante que o cliente existe antes de tentar alterar
  await buscarCliente(id)
  // 2. Aplica a mudança de status
  return setClienteAtivo(id, ativo)
}
