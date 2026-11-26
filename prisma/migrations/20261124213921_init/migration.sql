-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('CLIENTE', 'PROFISSIONAL', 'AMBOS', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'BLOQUEADO', 'EXCLUIDO');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "StatusEspecialidade" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('ABERTA', 'EM_ORCAMENTO', 'ACEITA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusOrcamento" AS ENUM ('SOLICITADO', 'ENVIADO', 'ACEITO', 'RECUSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusDenuncia" AS ENUM ('ABERTA', 'EM_ANALISE', 'PROCEDENTE', 'IMPROCEDENTE');

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(20),
    "perfil" "PerfilUsuario" NOT NULL DEFAULT 'CLIENTE',
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "motivo_bloqueio" VARCHAR(500),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "excluido_em" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessao" (
    "id" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_recuperacao_senha" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_recuperacao_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "usuario_id" INTEGER NOT NULL,
    "cpf" VARCHAR(11),

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "profissional" (
    "usuario_id" INTEGER NOT NULL,
    "tipo_pessoa" "TipoPessoa" NOT NULL,
    "cpf" VARCHAR(11),
    "cnpj" VARCHAR(14),
    "descricao" VARCHAR(1000),
    "regiao_atendimento" VARCHAR(255),
    "uf" VARCHAR(2),
    "cidade" VARCHAR(100),
    "bairro" VARCHAR(100),
    "horario_atendimento" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "profissional_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(500),
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especialidade" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "profissional_sugeriu_id" INTEGER,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(500),
    "status" "StatusEspecialidade" NOT NULL DEFAULT 'APROVADA',

    CONSTRAINT "especialidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissional_categoria" (
    "profissional_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,

    CONSTRAINT "profissional_categoria_pkey" PRIMARY KEY ("profissional_id","categoria_id")
);

-- CreateTable
CREATE TABLE "profissional_especialidade" (
    "profissional_id" INTEGER NOT NULL,
    "especialidade_id" INTEGER NOT NULL,

    CONSTRAINT "profissional_especialidade_pkey" PRIMARY KEY ("profissional_id","especialidade_id")
);

-- CreateTable
CREATE TABLE "solicitacao" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "objeto" VARCHAR(150) NOT NULL,
    "descricao_defeito" VARCHAR(2000) NOT NULL,
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "tempo_defeito" VARCHAR(100),
    "localizacao" VARCHAR(255) NOT NULL,
    "uf" VARCHAR(2),
    "cidade" VARCHAR(100),
    "bairro" VARCHAR(100),
    "preco_produto_novo" DECIMAL(10,2),
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'ABERTA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foto_solicitacao" (
    "id" SERIAL NOT NULL,
    "solicitacao_id" INTEGER NOT NULL,
    "caminho_arquivo" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "tamanho_bytes" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foto_solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento" (
    "id" SERIAL NOT NULL,
    "solicitacao_id" INTEGER NOT NULL,
    "profissional_id" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" VARCHAR(2000) NOT NULL,
    "prazo_estimado" VARCHAR(100),
    "status" "StatusOrcamento" NOT NULL DEFAULT 'ENVIADO',
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondido_em" TIMESTAMP(3),

    CONSTRAINT "orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "profissional_id" INTEGER NOT NULL,
    "orcamento_id" INTEGER NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" VARCHAR(1000),
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denuncia" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "profissional_id" INTEGER NOT NULL,
    "analisado_por_id" INTEGER,
    "motivo" VARCHAR(150) NOT NULL,
    "descricao" VARCHAR(2000),
    "status" "StatusDenuncia" NOT NULL DEFAULT 'ABERTA',
    "decisao_admin" VARCHAR(1000),
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analisada_em" TIMESTAMP(3),

    CONSTRAINT "denuncia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_status_idx" ON "usuario"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sessao_token_hash_key" ON "sessao"("token_hash");

-- CreateIndex
CREATE INDEX "sessao_usuario_id_idx" ON "sessao"("usuario_id");

-- CreateIndex
CREATE INDEX "sessao_expira_em_idx" ON "sessao"("expira_em");

-- CreateIndex
CREATE UNIQUE INDEX "token_recuperacao_senha_token_hash_key" ON "token_recuperacao_senha"("token_hash");

-- CreateIndex
CREATE INDEX "token_recuperacao_senha_usuario_id_idx" ON "token_recuperacao_senha"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_cpf_key" ON "cliente"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "profissional_cpf_key" ON "profissional"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "profissional_cnpj_key" ON "profissional"("cnpj");

-- CreateIndex
CREATE INDEX "profissional_ativo_cidade_idx" ON "profissional"("ativo", "cidade");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nome_key" ON "categoria"("nome");

-- CreateIndex
CREATE INDEX "especialidade_categoria_id_status_idx" ON "especialidade"("categoria_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "especialidade_categoria_id_nome_key" ON "especialidade"("categoria_id", "nome");

-- CreateIndex
CREATE INDEX "profissional_categoria_categoria_id_idx" ON "profissional_categoria"("categoria_id");

-- CreateIndex
CREATE INDEX "profissional_especialidade_especialidade_id_idx" ON "profissional_especialidade"("especialidade_id");

-- CreateIndex
CREATE INDEX "solicitacao_cliente_id_status_idx" ON "solicitacao"("cliente_id", "status");

-- CreateIndex
CREATE INDEX "solicitacao_categoria_id_status_idx" ON "solicitacao"("categoria_id", "status");

-- CreateIndex
CREATE INDEX "foto_solicitacao_solicitacao_id_idx" ON "foto_solicitacao"("solicitacao_id");

-- CreateIndex
CREATE INDEX "orcamento_solicitacao_id_status_idx" ON "orcamento"("solicitacao_id", "status");

-- CreateIndex
CREATE INDEX "orcamento_profissional_id_status_idx" ON "orcamento"("profissional_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "orcamento_solicitacao_id_profissional_id_key" ON "orcamento"("solicitacao_id", "profissional_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacao_orcamento_id_key" ON "avaliacao"("orcamento_id");

-- CreateIndex
CREATE INDEX "avaliacao_profissional_id_idx" ON "avaliacao"("profissional_id");

-- CreateIndex
CREATE INDEX "avaliacao_cliente_id_idx" ON "avaliacao"("cliente_id");

-- CreateIndex
CREATE INDEX "denuncia_profissional_id_status_idx" ON "denuncia"("profissional_id", "status");

-- CreateIndex
CREATE INDEX "denuncia_status_idx" ON "denuncia"("status");

-- AddForeignKey
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_recuperacao_senha" ADD CONSTRAINT "token_recuperacao_senha_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional" ADD CONSTRAINT "profissional_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especialidade" ADD CONSTRAINT "especialidade_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especialidade" ADD CONSTRAINT "especialidade_profissional_sugeriu_id_fkey" FOREIGN KEY ("profissional_sugeriu_id") REFERENCES "profissional"("usuario_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_categoria" ADD CONSTRAINT "profissional_categoria_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_categoria" ADD CONSTRAINT "profissional_categoria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_especialidade" ADD CONSTRAINT "profissional_especialidade_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissional_especialidade" ADD CONSTRAINT "profissional_especialidade_especialidade_id_fkey" FOREIGN KEY ("especialidade_id") REFERENCES "especialidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao" ADD CONSTRAINT "solicitacao_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacao" ADD CONSTRAINT "solicitacao_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foto_solicitacao" ADD CONSTRAINT "foto_solicitacao_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_orcamento_id_fkey" FOREIGN KEY ("orcamento_id") REFERENCES "orcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncia" ADD CONSTRAINT "denuncia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncia" ADD CONSTRAINT "denuncia_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissional"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncia" ADD CONSTRAINT "denuncia_analisado_por_id_fkey" FOREIGN KEY ("analisado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Regras de integridade (CHECK constraints) do ConsertAí
ALTER TABLE "avaliacao"
  ADD CONSTRAINT "chk_avaliacao_nota_range" CHECK ("nota" >= 1 AND "nota" <= 5);

ALTER TABLE "orcamento"
  ADD CONSTRAINT "chk_orcamento_valor_nao_negativo" CHECK ("valor" >= 0);

ALTER TABLE "solicitacao"
  ADD CONSTRAINT "chk_solicitacao_preco_novo_nao_negativo"
  CHECK ("preco_produto_novo" IS NULL OR "preco_produto_novo" >= 0);

ALTER TABLE "foto_solicitacao"
  ADD CONSTRAINT "chk_foto_tamanho_positivo" CHECK ("tamanho_bytes" > 0);

ALTER TABLE "profissional"
  ADD CONSTRAINT "chk_profissional_documento_por_tipo" CHECK (
    ("tipo_pessoa" = 'PF' AND "cpf" IS NOT NULL AND "cnpj" IS NULL) OR
    ("tipo_pessoa" = 'PJ' AND "cnpj" IS NOT NULL AND "cpf" IS NULL)
  );
