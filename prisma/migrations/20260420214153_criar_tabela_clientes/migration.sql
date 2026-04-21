-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "plano" TEXT NOT NULL DEFAULT 'Start',
    "licencas" INTEGER NOT NULL DEFAULT 1,
    "parceiro" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAGO',
    "ultimoPagamento" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cnpj_key" ON "clientes"("cnpj");
