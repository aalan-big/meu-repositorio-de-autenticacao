/*
 * ARQUIVO: Schema Unificado de Cliente (Zod Discriminated Union)
 * POSIÇÃO: Camada de Validação
 * FUNÇÃO: Schema único que aceita PF ou PJ num mesmo payload.
 * O Zod usa o campo 'tipo' para saber qual bloco de campos exigir —
 * se tipo='PF', exige CPF e nome; se tipo='PJ', exige CNPJ e razão social.
 */

import { z } from 'zod'
import { criarClientePFSchema } from './pf/cliente-pf.schema'
import { criarClientePJSchema } from './pj/cliente-pj.schema'

// Estende cada schema adicionando o tipo como literal discriminador
const pfUnificado = criarClientePFSchema.extend({ tipo: z.literal('PF') })
const pjUnificado = criarClientePJSchema.extend({ tipo: z.literal('PJ') })

// Discriminated union: o Zod escolhe o schema correto com base no campo 'tipo'
export const criarClienteUnificadoSchema = z.discriminatedUnion('tipo', [pfUnificado, pjUnificado])

export type CriarClienteUnificadoInput = z.infer<typeof criarClienteUnificadoSchema>
