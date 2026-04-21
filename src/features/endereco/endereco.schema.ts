/*
 * ARQUIVO: Schema de Endereço (Zod)
 * POSIÇÃO: Camada de Validação / DTO (Data Transfer Object)
 * FUNÇÃO: Valida os dados de um endereço antes de salvar no banco.
 * Um cliente pode ter múltiplos endereços (matriz, filial, cobrança, entrega).
 */

import { z } from 'zod'

// SCHEMA DE CRIAÇÃO: Campos obrigatórios para cadastrar um endereço
export const criarEnderecoSchema = z.object({

  // Vínculo obrigatório — todo endereço pertence a um cliente
  clienteId:   z.string().uuid(),

  // CEP: aceita com ou sem hífen (00000-000 ou 00000000)
  cep:         z.string().min(8, { message: 'CEP inválido' }).max(9),

  // Nome da rua, avenida, travessa, etc.
  logradouro:  z.string().min(2, { message: 'Logradouro obrigatório' }),

  // Número do imóvel — aceita "S/N" para endereços sem número
  numero:      z.string().min(1, { message: 'Número obrigatório' }),

  // Complemento é opcional (sala, bloco, andar...)
  complemento: z.string().optional(),

  bairro:      z.string().min(2, { message: 'Bairro obrigatório' }),
  cidade:      z.string().min(2, { message: 'Cidade obrigatória' }),

  // Estado como sigla de 2 letras (ex: CE, SP, RJ)
  estado:      z.string().length(2, { message: 'Use a sigla do estado (ex: CE)' }),

  // Tipo do endereço para diferenciar matriz de filiais ou entregas
  tipo:        z.enum(['PRINCIPAL', 'FILIAL', 'COBRANCA', 'ENTREGA']).default('PRINCIPAL'),
})

// SCHEMA DE EDIÇÃO: Igual ao de criação, porém todos os campos são opcionais
// O clienteId é removido pois não faz sentido mudar o dono de um endereço
export const editarEnderecoSchema = criarEnderecoSchema.omit({ clienteId: true }).partial()

/**
 * TIPAGENS AUTOMÁTICAS
 * O Zod gera os tipos TypeScript automaticamente a partir dos schemas acima.
 */
export type CriarEnderecoInput = z.infer<typeof criarEnderecoSchema>
export type EditarEnderecoInput = z.infer<typeof editarEnderecoSchema>
