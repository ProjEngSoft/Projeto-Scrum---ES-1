import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma.js";
import {
  buscarUsuarioPorTokenSessao,
  criarSessaoNoBanco,
  revogarSessaoPorToken,
  verificarSenha,
} from "../lib/authCore.js";
import {
  autenticarUsuario,
  registrarCliente,
} from "../lib/services/usuarioService.js";

const TEST_PREFIX = `test_db_${Date.now()}`;

async function limparDadosDeTeste() {
  const usuariosTeste = await prisma.usuario.findMany({
    where: { email: { startsWith: TEST_PREFIX } },
    select: { id: true },
  });
  const ids = usuariosTeste.map((u) => u.id);

  if (ids.length > 0) {
    await prisma.avaliacao.deleteMany({
      where: {
        OR: [{ clienteId: { in: ids } }, { profissionalId: { in: ids } }],
      },
    });
    await prisma.orcamento.deleteMany({
      where: { profissionalId: { in: ids } },
    });
    await prisma.solicitacao.deleteMany({
      where: { clienteId: { in: ids } },
    });
    await prisma.usuario.deleteMany({
      where: { id: { in: ids } },
    });
  }

  await prisma.categoria.deleteMany({
    where: { nome: { startsWith: TEST_PREFIX } },
  });
}

test.after(async () => {
  await limparDadosDeTeste();
  await prisma.$disconnect();
});

test("Cadastro, hash bcrypt, login e sessão no PostgreSQL", async () => {
  const email = `${TEST_PREFIX}_cliente@example.com`;
  const senha = "SenhaSegura@123";

  const cadastro = await registrarCliente({
    nome: "Cliente Teste",
    email,
    senha,
    telefone: "84999990000",
  });

  assert.equal(cadastro.ok, true);
  assert.equal(cadastro.usuario.email, email);
  assert.equal(cadastro.usuario.perfil, "CLIENTE");

  const usuarioNoBanco = await prisma.usuario.findUnique({
    where: { email },
    include: { cliente: true },
  });

  assert.ok(usuarioNoBanco);
  assert.ok(usuarioNoBanco.cliente);
  assert.notEqual(usuarioNoBanco.senhaHash, senha);
  assert.equal(await verificarSenha(senha, usuarioNoBanco.senhaHash), true);

  const duplicado = await registrarCliente({
    nome: "Outro Nome",
    email,
    senha,
  });
  assert.equal(duplicado.ok, false);

  const loginInvalido = await autenticarUsuario({
    email,
    senha: "SenhaErrada@999",
  });
  assert.equal(loginInvalido.ok, false);

  const loginValido = await autenticarUsuario({ email, senha });
  assert.equal(loginValido.ok, true);
  assert.equal(loginValido.usuario.id, usuarioNoBanco.id);

  const { token } = await criarSessaoNoBanco(usuarioNoBanco.id);
  const usuarioSessao = await buscarUsuarioPorTokenSessao(token);
  assert.ok(usuarioSessao);
  assert.equal(usuarioSessao.email, email);

  await revogarSessaoPorToken(token);
  const aposLogout = await buscarUsuarioPorTokenSessao(token);
  assert.equal(aposLogout, null);

  await prisma.usuario.update({
    where: { id: usuarioNoBanco.id },
    data: { status: "BLOQUEADO", motivoBloqueio: "Teste de bloqueio" },
  });

  const loginBloqueado = await autenticarUsuario({ email, senha });
  assert.equal(loginBloqueado.ok, false);
});

test("Constraints CHECK e integridade relacional no PostgreSQL", async () => {
  const emailCli = `${TEST_PREFIX}_cli2@example.com`;
  const emailProf = `${TEST_PREFIX}_prof@example.com`;

  const resCli = await registrarCliente({
    nome: "Cliente Fluxo",
    email: emailCli,
    senha: "SenhaSegura@123",
  });
  assert.equal(resCli.ok, true);

  const categoria = await prisma.categoria.create({
    data: { nome: `${TEST_PREFIX}_Cat` },
  });

  const profUsuario = await prisma.usuario.create({
    data: {
      nome: "Profissional Teste",
      email: emailProf,
      senhaHash: "$2b$10$abcdefghijklmnopqrstuv123456789012345678901234567890",
      perfil: "PROFISSIONAL",
    },
  });

  // PF sem CPF deve violar chk_profissional_documento_por_tipo
  await assert.rejects(
    () =>
      prisma.profissional.create({
        data: {
          usuarioId: profUsuario.id,
          tipoPessoa: "PF",
          cpf: null,
          cnpj: null,
        },
      }),
    /chk_profissional_documento_por_tipo|check constraint/i
  );

  await prisma.profissional.create({
    data: {
      usuarioId: profUsuario.id,
      tipoPessoa: "PF",
      cpf: String(Date.now()).slice(-11),
      cidade: "Caicó",
      uf: "RN",
    },
  });

  // Preço produto novo negativo deve violar chk_solicitacao_preco_novo_nao_negativo
  await assert.rejects(
    () =>
      prisma.solicitacao.create({
        data: {
          clienteId: resCli.usuario.id,
          categoriaId: categoria.id,
          objeto: "Notebook",
          descricaoDefeito: "Não liga",
          localizacao: "Caicó - RN",
          precoProdutoNovo: -100,
        },
      }),
    /chk_solicitacao_preco_novo_nao_negativo|check constraint/i
  );

  const solicitacao = await prisma.solicitacao.create({
    data: {
      clienteId: resCli.usuario.id,
      categoriaId: categoria.id,
      objeto: "Notebook",
      descricaoDefeito: "Tela quebrada",
      localizacao: "Caicó - RN",
      precoProdutoNovo: 3500,
    },
  });

  // Valor de orçamento negativo deve violar chk_orcamento_valor_nao_negativo
  await assert.rejects(
    () =>
      prisma.orcamento.create({
        data: {
          solicitacaoId: solicitacao.id,
          profissionalId: profUsuario.id,
          valor: -50,
          descricao: "Troca de tela",
        },
      }),
    /chk_orcamento_valor_nao_negativo|check constraint/i
  );

  const orcamento = await prisma.orcamento.create({
    data: {
      solicitacaoId: solicitacao.id,
      profissionalId: profUsuario.id,
      valor: 450,
      descricao: "Troca de tela original",
      status: "ACEITO",
    },
  });

  // Nota fora de 1..5 deve violar chk_avaliacao_nota_range
  await assert.rejects(
    () =>
      prisma.avaliacao.create({
        data: {
          clienteId: resCli.usuario.id,
          profissionalId: profUsuario.id,
          orcamentoId: orcamento.id,
          nota: 6,
        },
      }),
    /chk_avaliacao_nota_range|check constraint/i
  );

  const avaliacao = await prisma.avaliacao.create({
    data: {
      clienteId: resCli.usuario.id,
      profissionalId: profUsuario.id,
      orcamentoId: orcamento.id,
      nota: 5,
      comentario: "Serviço excelente!",
    },
  });
  assert.equal(avaliacao.nota, 5);
});
