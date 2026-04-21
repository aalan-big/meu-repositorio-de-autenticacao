/*
 * ARQUIVO: Schema Base de Cliente (Zod)
 * POSIÇÃO: Camada de Validação / DTO (Data Transfer Object)
 * FUNÇÃO: Define os campos COMUNS a todo cliente, seja ele PF ou PJ.
 * Serve como "molde" reutilizável que os schemas específicos (PF/PJ) herdam.
 *
 * HIERARQUIA DE SCHEMAS:
 *   cliente.schema.ts          ← campos base (este arquivo)
 *   pf/cliente-pf.schema.ts    ← estende base + campos PF
 *   pj/cliente-pj.schema.ts    ← estende base + campos PJ
 *   cliente.unified.schema.ts  ← discriminatedUnion(PF | PJ) — importa PF e PJ,
 *                                 por isso vive em arquivo separado (evita circular import)
 */

import { z } from 'zod'

// SCHEMA BASE: Campos que existem em qualquer cliente, independente do tipo
export const clienteBaseSchema = z.object({

  // Identifica se o cliente é Pessoa Física ou Jurídica
  tipo:     z.enum(['PF', 'PJ']),

  // Nome da pessoa de contato direto na empresa ou do próprio cliente PF
  contato:  z.string().min(2, { message: 'Contato obrigatório' }),

  // E-mail normalizado para minúsculas — evita duplicatas por variação de caixa
  email: z.string().email({ message: 'E-mail inválido' }).transform(s => s.toLowerCase()),

  // Plano contratado — Start é o padrão para novos clientes
  plano:    z.enum(['Start', 'Premium']).default('Start'),

  // Quantidade de licenças ativas no plano
  licencas: z.number().int().min(1).default(1),

  // Parceiro/Revenda responsável por esse cliente
  parceiro: z.string().min(2, { message: 'Parceiro obrigatório' }),

  // Situação do pagamento atual
  status:   z.enum(['PAGO', 'ATRASADO']).default('PAGO'),
})

// SCHEMA DE EDIÇÃO BASE: Todos os campos opcionais para atualizações parciais
// O campo 'tipo' é excluído pois um cliente não pode mudar de PF para PJ
export const editarClienteBaseSchema = clienteBaseSchema.omit({ tipo: true }).partial()

/**
 * TIPAGENS AUTOMÁTICAS
 * O Zod gera os tipos TypeScript automaticamente a partir dos schemas acima.
 */
export type ClienteBaseInput = z.infer<typeof clienteBaseSchema>
export type EditarClienteBaseInput = z.infer<typeof editarClienteBaseSchema>
