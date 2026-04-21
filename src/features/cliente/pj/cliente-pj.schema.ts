/*
 * ARQUIVO: Schema de Cliente Pessoa Jurídica (Zod)
 * POSIÇÃO: Camada de Validação / DTO (Data Transfer Object)
 * FUNÇÃO: Valida os dados exclusivos de um cliente PJ.
 * Herda os campos base (contato, email, plano...) e adiciona os campos
 * específicos de uma empresa: CNPJ, razão social, nome fantasia, etc.
 */

import { z } from 'zod'
import { clienteBaseSchema } from '../cliente.schema'
import { validarCnpj } from '@/core/documento.validators'

// SCHEMA DE CRIAÇÃO PJ: Campos base + campos exclusivos de Pessoa Jurídica
// Remove o campo 'tipo' do base pois aqui ele sempre será 'PJ' (definido no repository)
export const criarClientePJSchema = clienteBaseSchema.omit({ tipo: true }).extend({

  // Razão social conforme CNPJ — nome oficial da empresa
  razaoSocial:       z.string().min(2, { message: 'Razão social obrigatória' }),

  // CNPJ: remove máscara → valida comprimento e dígitos verificadores
  cnpj: z.string()
    .transform(s => s.replace(/\D/g, ''))
    .pipe(z.string()
      .length(14, { message: 'CNPJ inválido' })
      .refine(validarCnpj, { message: 'CNPJ inválido (dígitos verificadores incorretos)' })
    ),

  // Nome fantasia é opcional — algumas empresas não possuem
  nomeFantasia:      z.string().optional(),

  // Inscrição Estadual é opcional — MEIs e algumas categorias são isentos
  inscricaoEstadual: z.string().optional(),

  // Nome do responsável legal ou sócio principal
  responsavel:       z.string().optional(),
})

// SCHEMA DE EDIÇÃO PJ: Todos os campos opcionais para atualizações parciais
export const editarClientePJSchema = criarClientePJSchema.partial()

/**
 * TIPAGENS AUTOMÁTICAS
 * O Zod gera os tipos TypeScript automaticamente a partir dos schemas acima.
 */
export type CriarClientePJInput = z.infer<typeof criarClientePJSchema>
export type EditarClientePJInput = z.infer<typeof editarClientePJSchema>
