-- Migration: indice_parcial_e_licencas
-- Nota: PostgreSQL não permite subquery em predicado de índice parcial.
-- A unicidade condicional (CPF/CNPJ só entre clientes ativos) é garantida
-- pela camada de Service, que filtra `cliente: { deletedAt: null }` antes de checar.

-- 1. Colunas novas na tabela clientes
ALTER TABLE "clientes"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "usuariosAtivos" INTEGER NOT NULL DEFAULT 0;

-- 2. Índices de performance
CREATE INDEX "clientes_email_idx"     ON "clientes"("email");
CREATE INDEX "clientes_ativo_idx"     ON "clientes"("ativo");
CREATE INDEX "clientes_deletedAt_idx" ON "clientes"("deletedAt");

-- 3. Remove constraints únicas globais de CPF e CNPJ
--    O Service agora controla a unicidade considerando apenas clientes ativos
ALTER TABLE "clientes_pf" DROP CONSTRAINT IF EXISTS "clientes_pf_cpf_key";
ALTER TABLE "clientes_pj" DROP CONSTRAINT IF EXISTS "clientes_pj_cnpj_key";
