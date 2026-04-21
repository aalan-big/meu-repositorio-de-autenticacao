-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'PRINCIPAL',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
