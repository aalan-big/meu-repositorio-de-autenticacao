/*
  Warnings:

  - You are about to drop the column `cnpj` on the `clientes` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `clientes` table. All the data in the column will be lost.
  - Added the required column `tipo` to the `clientes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "enderecos" DROP CONSTRAINT "enderecos_clienteId_fkey";

-- DropIndex
DROP INDEX "clientes_cnpj_key";

-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "cnpj",
DROP COLUMN "nome",
ADD COLUMN     "tipo" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "clientes_pf" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "dataNascimento" TIMESTAMP(3),

    CONSTRAINT "clientes_pf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes_pj" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "responsavel" TEXT,

    CONSTRAINT "clientes_pj_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_pf_clienteId_key" ON "clientes_pf"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_pf_cpf_key" ON "clientes_pf"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_pj_clienteId_key" ON "clientes_pj"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_pj_cnpj_key" ON "clientes_pj"("cnpj");

-- AddForeignKey
ALTER TABLE "clientes_pf" ADD CONSTRAINT "clientes_pf_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_pj" ADD CONSTRAINT "clientes_pj_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
