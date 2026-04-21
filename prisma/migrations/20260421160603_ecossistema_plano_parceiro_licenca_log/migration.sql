-- ============================================================
-- MIGRATION: Ecossistema Completo — Plano, Parceiro, Licença, Log
-- ============================================================
-- O QUE ESTA MIGRATION FAZ:
--
-- 1. Cria a tabela 'planos'
--    Catálogo de planos (Start, Premium...) com preços e limites.
--    Antes o plano era apenas um texto ('Start'/'Premium') no cliente.
--    Agora é uma entidade com preço, módulos e limites configuráveis.
--
-- 2. Cria a tabela 'parceiros'
--    Revendedores que comercializam a plataforma.
--    Antes o parceiro era apenas uma string no cliente.
--    Agora é uma entidade com CNPJ, comissão e cidade base.
--
-- 3. Cria a tabela 'licencas'
--    Núcleo do módulo de Gestão de Dispositivos.
--    Cada linha representa UM dispositivo autorizado a usar o software.
--    Tem ciclo de vida: AGUARDANDO → ATIVA → SUSPENSA/REVOGADA.
--
-- 4. Cria a tabela 'logs'
--    Trilha de auditoria imutável de todas as ações do sistema.
--
-- 5. Altera a tabela 'clientes'
--    Adiciona campos de controle de negócio e os novos FKs opcionais
--    para plano e parceiro. Os campos antigos (plano STRING, parceiro
--    STRING) são MANTIDOS para não quebrar o código existente.
--
-- 6. Altera a tabela 'usuarios'
--    Adiciona parceiroId para permitir que usuários de parceiros
--    acessem o sistema com visão restrita aos seus clientes.
--
-- ESTRATÉGIA BACKWARDS-COMPATIBLE:
--    Todos os novos campos são NULL ou têm DEFAULT — o banco nunca
--    rejeita linhas existentes ao rodar esta migration.
-- ============================================================


-- ============================================================
-- 1. TABELA: planos
-- ============================================================
-- Catálogo de planos disponíveis na plataforma.
-- modulosLiberados usa o tipo TEXT[] do PostgreSQL (array nativo).
-- ============================================================
CREATE TABLE "planos" (
    "id"                    TEXT NOT NULL,
    "nome"                  TEXT NOT NULL,
    "limiteLicencas"        INTEGER NOT NULL DEFAULT 1,
    "precoMensal"           DECIMAL(10, 2) NOT NULL,

    -- Array de strings com os módulos que este plano desbloqueia
    -- Ex: ARRAY['clientes', 'dispositivos', 'financeiro']
    "modulosLiberados"      TEXT[] NOT NULL DEFAULT '{}',

    "valorLicencaAdicional" DECIMAL(10, 2),
    "periodoTrialDias"      INTEGER NOT NULL DEFAULT 0,
    "ativo"                 BOOLEAN NOT NULL DEFAULT TRUE,
    "criadoEm"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- Nome do plano deve ser único no catálogo
CREATE UNIQUE INDEX "planos_nome_key" ON "planos"("nome");


-- ============================================================
-- 2. TABELA: parceiros
-- ============================================================
-- Revendedores/consultores que vendem e gerenciam clientes.
-- ============================================================
CREATE TABLE "parceiros" (
    "id"                 TEXT NOT NULL,
    "nomeParceiro"       TEXT NOT NULL,
    "documento"          TEXT,             -- CNPJ ou CPF sem formatação
    "comissaoPercentual" DECIMAL(5, 2),    -- Ex: 15.00 = 15% de comissão
    "contatoCelular"     TEXT,
    "cidadeBase"         TEXT,
    "ativo"              BOOLEAN NOT NULL DEFAULT TRUE,
    "criadoEm"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parceiros_pkey" PRIMARY KEY ("id")
);


-- ============================================================
-- 3. TABELA: licencas
-- ============================================================
-- Núcleo do módulo de Gestão de Dispositivos.
-- Cada linha = um dispositivo autorizado a usar o software.
--
-- Relacionamentos:
--   clienteId  → clientes.id  (obrigatório)
--   parceiroId → parceiros.id (opcional — parceiro que vendeu)
-- ============================================================
CREATE TABLE "licencas" (
    "id"              TEXT NOT NULL,
    "clienteId"       TEXT NOT NULL,
    "parceiroId"      TEXT,              -- null se venda direta pela BigTec
    "chaveAtivacao"   TEXT NOT NULL,     -- chave única entregue ao cliente

    -- Hardware ID do dispositivo que ativou a chave.
    -- null = aguardando ativação. Preenchido pelo software na primeira ativação.
    "hwidAutorizado"  TEXT,

    "nomeDispositivo" TEXT,              -- nome amigável (ex: "Caixa 01 - Loja Centro")

    -- AGUARDANDO = gerada, não ativada
    -- ATIVA       = dispositivo ativado e com acesso
    -- SUSPENSA    = bloqueio temporário
    -- REVOGADA    = chave inválida permanentemente
    "status"          TEXT NOT NULL DEFAULT 'AGUARDANDO',

    -- Última vez que o software fez contato (heartbeat de monitoramento)
    "ultimoHeartbeat" TIMESTAMP(3),

    "criadoEm"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtivacao"    TIMESTAMP(3),      -- null até a primeira ativação

    -- Origem da chave: MANUAL | PARCEIRO | TRIAL | API
    "chaveOrigem"     TEXT NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "licencas_pkey" PRIMARY KEY ("id")
);

-- Chave de ativação deve ser única globalmente
CREATE UNIQUE INDEX "licencas_chaveAtivacao_key" ON "licencas"("chaveAtivacao");

-- Índices para as queries mais comuns do módulo de dispositivos
CREATE INDEX "licencas_clienteId_idx"      ON "licencas"("clienteId");
CREATE INDEX "licencas_hwidAutorizado_idx" ON "licencas"("hwidAutorizado");
CREATE INDEX "licencas_status_idx"         ON "licencas"("status");

-- Foreign Keys da tabela licencas
ALTER TABLE "licencas"
    ADD CONSTRAINT "licencas_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "licencas"
    ADD CONSTRAINT "licencas_parceiroId_fkey"
    FOREIGN KEY ("parceiroId") REFERENCES "parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================
-- 4. TABELA: logs
-- ============================================================
-- Trilha de auditoria imutável. Nunca é apagada.
-- Registra quem fez o quê, quando e em qual entidade.
-- ============================================================
CREATE TABLE "logs" (
    "id"           TEXT NOT NULL,
    "dataHora"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId"    TEXT,                 -- null = ação do sistema
    "acao"         TEXT NOT NULL,        -- CRIACAO | EDICAO | DELECAO | LOGIN | etc.
    "entidadeNome" TEXT NOT NULL,        -- nome da tabela afetada (ex: "clientes")
    "entidadeId"   TEXT,                 -- ID do registro afetado
    "descricao"    TEXT,                 -- texto legível da ação
    "ipAddress"    TEXT,                 -- IP de origem da requisição

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- Índices para as consultas mais comuns de auditoria
CREATE INDEX "logs_usuarioId_idx"             ON "logs"("usuarioId");
CREATE INDEX "logs_entidadeNome_entidadeId_idx" ON "logs"("entidadeNome", "entidadeId");
CREATE INDEX "logs_dataHora_idx"              ON "logs"("dataHora");

-- Foreign Key: log pode existir mesmo se o usuário for deletado (SET NULL)
ALTER TABLE "logs"
    ADD CONSTRAINT "logs_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================
-- 5. ALTERA: clientes
-- ============================================================
-- Adiciona novos campos de controle de negócio e os FKs
-- opcionais para Plano e Parceiro.
-- IMPORTANTE: todos os campos são NULL ou têm DEFAULT para
-- não afetar as linhas existentes no banco.
-- ============================================================

-- Próximo vencimento da assinatura (controle financeiro)
ALTER TABLE "clientes" ADD COLUMN "dataVencimento"  TIMESTAMP(3);

-- Cliente está em período de trial gratuito?
ALTER TABLE "clientes" ADD COLUMN "isTrial"         BOOLEAN NOT NULL DEFAULT FALSE;

-- Dias extras de acesso após o vencimento antes de bloquear
ALTER TABLE "clientes" ADD COLUMN "diasCortesia"    INTEGER NOT NULL DEFAULT 0;

-- Admin pode bloquear acesso sem desativar a conta (inadimplência, disputa...)
ALTER TABLE "clientes" ADD COLUMN "bloqueioManual"  BOOLEAN NOT NULL DEFAULT FALSE;

-- FK opcional para o catálogo de planos (null enquanto módulo não for migrado)
ALTER TABLE "clientes" ADD COLUMN "planoId"         TEXT;

-- FK opcional para a entidade parceiro (null enquanto módulo não for migrado)
ALTER TABLE "clientes" ADD COLUMN "parceiroId"      TEXT;

-- Índices nos novos FKs para queries de relatório e filtragem
CREATE INDEX "clientes_planoId_idx"    ON "clientes"("planoId");
CREATE INDEX "clientes_parceiroId_idx" ON "clientes"("parceiroId");

-- Foreign Keys para Plano e Parceiro (SET NULL ao deletar para não perder o cliente)
ALTER TABLE "clientes"
    ADD CONSTRAINT "clientes_planoId_fkey"
    FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clientes"
    ADD CONSTRAINT "clientes_parceiroId_fkey"
    FOREIGN KEY ("parceiroId") REFERENCES "parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================
-- 6. ALTERA: usuarios
-- ============================================================
-- Adiciona parceiroId para suportar usuários de parceiros.
-- null = funcionário interno da BigTec.
-- ============================================================
ALTER TABLE "usuarios" ADD COLUMN "parceiroId" TEXT;

CREATE INDEX "usuarios_parceiroId_idx" ON "usuarios"("parceiroId");

ALTER TABLE "usuarios"
    ADD CONSTRAINT "usuarios_parceiroId_fkey"
    FOREIGN KEY ("parceiroId") REFERENCES "parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
