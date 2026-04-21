/*
 * ARQUIVO: Service de Cliente Pessoa Jurídica
 * POSIÇÃO: Camada de Negócio (Business Logic Layer)
 * FUNÇÃO: Contém as regras de negócio exclusivas de clientes PJ.
 */

import { findClientePJByCnpj, createClientePJ, updateClientePJ } from './cliente-pj.repository'
import { findClienteById, findClienteByEmail } from '../cliente.repository'
import type { CriarClientePJInput, EditarClientePJInput } from './cliente-pj.schema'

// CRIAÇÃO PJ
export async function criarClientePJ(dados: CriarClientePJInput) {

  // 1. CNPJ único — busca com dados já limpos pelo transform do schema
  const existeCnpj = await findClientePJByCnpj(dados.cnpj)
  if (existeCnpj) throw new Error('CNPJ já cadastrado.')

  // 2. E-mail único entre todos os clientes (PF e PJ), já normalizado para minúsculas
  const existeEmail = await findClienteByEmail(dados.email)
  if (existeEmail) throw new Error('E-mail já cadastrado em outro cliente.')

  return createClientePJ(dados)
}

// EDIÇÃO PJ
export async function editarClientePJ(clienteId: string, dados: EditarClientePJInput) {

  // 1. Cliente existe?
  const cliente = await findClienteById(clienteId)
  if (!cliente) throw new Error('Cliente não encontrado.')

  // 2. Proteção de tipo — impede editar PF por esta rota
  if (cliente.tipo !== 'PJ') throw new Error('Cliente não é Pessoa Jurídica.')

  // 3. Trava de downgrade: licenças não podem ficar abaixo do uso real
  if (dados.licencas !== undefined && dados.licencas < cliente.usuariosAtivos) {
    throw new Error(
      `Não é possível reduzir para ${dados.licencas} licença(s) — o cliente possui ${cliente.usuariosAtivos} usuário(s) ativo(s).`
    )
  }

  // 4. CNPJ alterado já pertence a outra empresa?
  if (dados.cnpj) {
    const existeCnpj = await findClientePJByCnpj(dados.cnpj)
    if (existeCnpj && existeCnpj.clienteId !== clienteId) throw new Error('CNPJ já cadastrado em outro cliente.')
  }

  // 5. E-mail alterado já pertence a outro cliente?
  if (dados.email) {
    const existeEmail = await findClienteByEmail(dados.email, clienteId)
    if (existeEmail) throw new Error('E-mail já cadastrado em outro cliente.')
  }

  return updateClientePJ(clienteId, dados)
}
