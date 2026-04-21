import { NextResponse } from 'next/server'
import { listarClientes, pesquisarClientes, buscarCliente, alterarStatusCliente } from '@/features/cliente/cliente.service'
import { criarClientePF, editarClientePF } from '@/features/cliente/pf/cliente-pf.service'
import { criarClientePJ, editarClientePJ } from '@/features/cliente/pj/cliente-pj.service'
import { criarClientePFSchema, editarClientePFSchema } from '@/features/cliente/pf/cliente-pf.schema'
import { criarClientePJSchema, editarClientePJSchema } from '@/features/cliente/pj/cliente-pj.schema'
import { criarClienteUnificadoSchema } from '@/features/cliente/cliente.unified.schema'
import { criarEnderecoSchema } from '@/features/endereco/endereco.schema'
import { adicionarEndereco, editarEndereco } from '@/features/endereco/endereco.service'

// Extrai e valida o endereço do payload, criando-o vinculado ao clienteId
async function salvarEnderecoSeInformado(enderecoRaw: unknown, clienteId: string) {
  if (!enderecoRaw || typeof enderecoRaw !== 'object' || !Object.keys(enderecoRaw).length) return null
  const validado = criarEnderecoSchema.parse({ ...(enderecoRaw as object), clienteId })
  return adicionarEndereco(validado)
}

// Atualiza endereço se um ID de endereço foi informado; cria um novo caso contrário
async function atualizarEnderecoSeInformado(enderecoRaw: unknown, clienteId: string) {
  if (!enderecoRaw || typeof enderecoRaw !== 'object' || !Object.keys(enderecoRaw).length) return null
  const { id: endId, ...campos } = enderecoRaw as { id?: string; [key: string]: unknown }
  if (endId) {
    return editarEndereco(endId, campos)
  }
  const validado = criarEnderecoSchema.parse({ ...campos, clienteId })
  return adicionarEndereco(validado)
}

export async function handleClientes(acao: string, dados: unknown) {

  if (acao === 'listar_clientes') {
    const res = await listarClientes()
    return NextResponse.json({ msg: 'Listagem OK', total: res.length, data: res })
  }

  if (acao === 'pesquisar_clientes') {
    const { termo } = dados as { termo: string }
    const res = await pesquisarClientes(termo)
    return NextResponse.json({ msg: 'Pesquisa OK', total: res.length, data: res })
  }

  if (acao === 'buscar_cliente') {
    const { id } = dados as { id: string }
    const res = await buscarCliente(id)
    return NextResponse.json({ msg: 'Busca OK', data: res })
  }

  // Ação unificada — usa discriminated union para despachar PF ou PJ automaticamente
  if (acao === 'criar_cliente') {
    const { endereco, ...resto } = dados as { endereco?: unknown; [key: string]: unknown }
    const validado = criarClienteUnificadoSchema.parse(resto)
    const cliente = validado.tipo === 'PF'
      ? await criarClientePF(validado)
      : await criarClientePJ(validado)
    const enderecoSalvo = await salvarEnderecoSeInformado(endereco, cliente.id)
    return NextResponse.json(
      { msg: `Cliente ${validado.tipo} criado com sucesso`, data: { ...cliente, endereco: enderecoSalvo } },
      { status: 201 }
    )
  }

  if (acao === 'criar_cliente_pf') {
    const { endereco, ...resto } = dados as { endereco?: unknown; [key: string]: unknown }
    const validado = criarClientePFSchema.parse(resto)
    const cliente = await criarClientePF(validado)
    const enderecoSalvo = await salvarEnderecoSeInformado(endereco, cliente.id)
    return NextResponse.json({ msg: 'Cliente PF criado com sucesso', data: { ...cliente, endereco: enderecoSalvo } }, { status: 201 })
  }

  if (acao === 'criar_cliente_pj') {
    const { endereco, ...resto } = dados as { endereco?: unknown; [key: string]: unknown }
    const validado = criarClientePJSchema.parse(resto)
    const cliente = await criarClientePJ(validado)
    const enderecoSalvo = await salvarEnderecoSeInformado(endereco, cliente.id)
    return NextResponse.json({ msg: 'Cliente PJ criado com sucesso', data: { ...cliente, endereco: enderecoSalvo } }, { status: 201 })
  }

  if (acao === 'editar_cliente_pf') {
    const { id, endereco, ...resto } = dados as { id: string; endereco?: unknown; [key: string]: unknown }
    const validado = editarClientePFSchema.parse(resto)
    const cliente = await editarClientePF(id, validado)
    const enderecoSalvo = await atualizarEnderecoSeInformado(endereco, id)
    return NextResponse.json({ msg: 'Cliente PF atualizado com sucesso', data: { ...cliente, endereco: enderecoSalvo } })
  }

  if (acao === 'editar_cliente_pj') {
    const { id, endereco, ...resto } = dados as { id: string; endereco?: unknown; [key: string]: unknown }
    const validado = editarClientePJSchema.parse(resto)
    const cliente = await editarClientePJ(id, validado)
    const enderecoSalvo = await atualizarEnderecoSeInformado(endereco, id)
    return NextResponse.json({ msg: 'Cliente PJ atualizado com sucesso', data: { ...cliente, endereco: enderecoSalvo } })
  }

  if (acao === 'alterar_status_cliente') {
    const { id, ativo } = dados as { id: string; ativo: boolean }
    const res = await alterarStatusCliente(id, ativo)
    return NextResponse.json({ msg: `Cliente ${ativo ? 'ativado' : 'desativado'} com sucesso`, data: res })
  }

  return null
}
