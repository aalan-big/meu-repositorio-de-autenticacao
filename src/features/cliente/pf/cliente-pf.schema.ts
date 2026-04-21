/*
 * ARQUIVO: Schema de Cliente Pessoa Física (Zod)
 * POSIÇÃO: Camada de Validação / DTO (Data Transfer Object)
 * FUNÇÃO: Valida os dados exclusivos de um cliente PF.
 * Herda os campos base (contato, email, plano...) e adiciona os campos
 * específicos de uma pessoa física: CPF, RG e data de nascimento.
 */

import { z } from 'zod'
import { clienteBaseSchema } from '../cliente.schema'
import { validarCpf } from '@/core/documento.validators'

// SCHEMA DE CRIAÇÃO PF: Campos base + campos exclusivos de Pessoa Física
// Remove o campo 'tipo' do base pois aqui ele sempre será 'PF' (definido no repository)
export const criarClientePFSchema = clienteBaseSchema.omit({ tipo: true }).extend({

  // Nome completo conforme documento oficial
  nomeCompleto:   z.string().min(2, { message: 'Nome completo obrigatório' }),

  // CPF: remove máscara → valida comprimento e dígitos verificadores
  // O .transform() garante que o banco sempre receba apenas os dígitos (11 chars)
  cpf: z.string()
    .transform(s => s.replace(/\D/g, ''))
    .pipe(z.string()
      .length(11, { message: 'CPF inválido' })
      .refine(validarCpf, { message: 'CPF inválido (dígitos verificadores incorretos)' })
    ),

  // RG é opcional — nem todos os clientes informam
  rg: z.string().optional(),

  // Data de nascimento: string ISO obrigatoriamente válida (ex: "1990-05-20")
  dataNascimento: z.string()
    .refine(s => !isNaN(Date.parse(s)), { message: 'Data de nascimento inválida' })
    .optional(),
})

// SCHEMA DE EDIÇÃO PF: Todos os campos opcionais para atualizações parciais
export const editarClientePFSchema = criarClientePFSchema.partial()

/**
 * TIPAGENS AUTOMÁTICAS
 * O Zod gera os tipos TypeScript automaticamente a partir dos schemas acima.
 */
export type CriarClientePFInput = z.infer<typeof criarClientePFSchema>
export type EditarClientePFInput = z.infer<typeof editarClientePFSchema>
