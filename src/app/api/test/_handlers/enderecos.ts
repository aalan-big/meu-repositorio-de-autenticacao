import { NextResponse } from 'next/server'
import { criarEnderecoSchema, editarEnderecoSchema } from '@/features/endereco/endereco.schema'
import {
  listarEnderecos,
  adicionarEndereco,
  editarEndereco,
  removerEndereco,
} from '@/features/endereco/endereco.service'

export async function handleEnderecos(acao: string, dados: unknown) {
  // -----------------------------------------------------------------------
  // LISTAR: Todos os endereços de um cliente
  // Payload: { clienteId: "uuid" }
  // -----------------------------------------------------------------------
  if (acao === 'listar_enderecos') {
    const { clienteId } = dados as { clienteId: string }
    const res = await listarEnderecos(clienteId)
    return NextResponse.json({ msg: 'Listagem OK', total: res.length, data: res })
  }

  // -----------------------------------------------------------------------
  // ADICIONAR: Novo endereço para um cliente
  // Payload: { clienteId, cep, logradouro, numero, bairro, cidade, estado, tipo?, complemento? }
  // -----------------------------------------------------------------------
  if (acao === 'adicionar_endereco') {
    const dadosValidados = criarEnderecoSchema.parse(dados)
    const res = await adicionarEndereco(dadosValidados)
    return NextResponse.json({ msg: 'Endereço adicionado com sucesso', data: res }, { status: 201 })
  }

  // -----------------------------------------------------------------------
  // EDITAR: Atualiza campos de um endereço
  // Payload: { id: "uuid", ...campos }
  // -----------------------------------------------------------------------
  if (acao === 'editar_endereco') {
    const { id, ...resto } = dados as { id: string; [key: string]: unknown }
    const dadosValidados = editarEnderecoSchema.parse(resto)
    const res = await editarEndereco(id, dadosValidados)
    return NextResponse.json({ msg: 'Endereço atualizado com sucesso', data: res })
  }

  // -----------------------------------------------------------------------
  // REMOVER: Apaga o endereço (delete real — endereço não tem soft-delete)
  // Payload: { id: "uuid" }
  // -----------------------------------------------------------------------
  if (acao === 'remover_endereco') {
    const { id } = dados as { id: string }
    const res = await removerEndereco(id)
    return NextResponse.json({ msg: 'Endereço removido com sucesso', data: res })
  }

  return null
}
