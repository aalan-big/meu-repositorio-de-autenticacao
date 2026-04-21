/*
 * ARQUIVO: Service de Cliente Pessoa Física
 * POSIÇÃO: Camada de Negócio (Business Logic Layer)
 * FUNÇÃO: Contém as regras de negócio exclusivas de clientes PF.
 */

import { findClientePFByCpf, createClientePF, updateClientePF } from './cliente-pf.repository'
import { findClienteById, findClienteByEmail } from '../cliente.repository'
import type { CriarClientePFInput, EditarClientePFInput } from './cliente-pf.schema'

// CRIAÇÃO PF
export async function criarClientePF(dados: CriarClientePFInput) {

  // 1. CPF único — busca com dados já limpos pelo transform do schema
  const existeCpf = await findClientePFByCpf(dados.cpf)
  if (existeCpf) throw new Error('CPF já cadastrado.')

  // 2. E-mail único entre todos os clientes (PF e PJ), já normalizado para minúsculas
  const existeEmail = await findClienteByEmail(dados.email)
  if (existeEmail) throw new Error('E-mail já cadastrado em outro cliente.')

  return createClientePF(dados)
}

// EDIÇÃO PF
export async function editarClientePF(clienteId: string, dados: EditarClientePFInput) {

  // 1. Cliente existe?
  const cliente = await findClienteById(clienteId)
  if (!cliente) throw new Error('Cliente não encontrado.')

  // 2. Proteção de tipo — impede editar PJ por esta rota
  if (cliente.tipo !== 'PF') throw new Error('Cliente não é Pessoa Física.')

  // 3. Trava de downgrade: licenças não podem ficar abaixo do uso real
  if (dados.licencas !== undefined && dados.licencas < cliente.usuariosAtivos) {
    throw new Error(
      `Não é possível reduzir para ${dados.licencas} licença(s) — o cliente possui ${cliente.usuariosAtivos} usuário(s) ativo(s).`
    )
  }

  // 4. CPF alterado já pertence a outro cliente?
  if (dados.cpf) {
    const existeCpf = await findClientePFByCpf(dados.cpf)
    if (existeCpf && existeCpf.clienteId !== clienteId) throw new Error('CPF já cadastrado em outro cliente.')
  }

  // 5. E-mail alterado já pertence a outro cliente?
  if (dados.email) {
    const existeEmail = await findClienteByEmail(dados.email, clienteId)
    if (existeEmail) throw new Error('E-mail já cadastrado em outro cliente.')
  }

  return updateClientePF(clienteId, dados)
}
