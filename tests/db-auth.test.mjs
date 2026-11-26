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
  alterarSenhaUsuario,
  atualizarDadosUsuario,
  autenticarUsuario,
  excluirContaUsuario,
  obterDadosConta,
  registrarCliente,
} from "../lib/services/usuarioService.js";

const TEST_PREFIX = `test_db_${Date.now()}`;
const createdUserIds = new Set();

async function limparDadosDeTeste() {
  const usuariosTeste = await prisma.usuario.findMany({
    where: { email: { startsWith: TEST_PREFIX } },
    select: { id: true },
  });
  const ids = Array.from(
    new Set([...createdUserIds, ...usuariosTeste.map((u) => u.id)])
  );

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

test("Home: consultar dados da conta, editar dados, alterar senha e excluir conta", async () => {
  const email1 = `${TEST_PREFIX}_home1@example.com`;
  const email2 = `${TEST_PREFIX}_home2@example.com`;
  const senhaInicial = "SenhaHome@123";

  const cad1 = await registrarCliente({
    nome: "Usuário Home",
    email: email1,
    senha: senhaInicial,
    telefone: "84988887777",
  });
  assert.equal(cad1.ok, true);
  createdUserIds.add(cad1.usuario.id);

  const cad2 = await registrarCliente({
    nome: "Outro Usuário",
    email: email2,
    senha: senhaInicial,
  });
  assert.equal(cad2.ok, true);
  createdUserIds.add(cad2.usuario.id);

  // 1. Consulta sem vazar senhaHash
  const conta = await obterDadosConta(cad1.usuario.id);
  assert.ok(conta);
  assert.equal(conta.email, email1);
  assert.equal("senhaHash" in conta, false);
  assert.ok(conta.cliente);

  // 2. Edição com e-mail já utilizado por outro usuário deve falhar
  const edicaoEmailDuplicado = await atualizarDadosUsuario(cad1.usuario.id, {
    nome: "Usuário Home Atualizado",
    email: email2,
    telefone: "84911112222",
    cpf: "529.982.247-25",
  });
  assert.equal(edicaoEmailDuplicado.ok, false);

  // 3. Edição válida atualiza nome, e-mail, telefone e CPF do cliente
  const novoEmail = `${TEST_PREFIX}_home1_editado@example.com`;
  const edicaoValida = await atualizarDadosUsuario(cad1.usuario.id, {
    nome: "Usuário Home Atualizado",
    email: novoEmail,
    telefone: "84911112222",
    cpf: "529.982.247-25",
  });
  assert.equal(edicaoValida.ok, true);
  assert.equal(edicaoValida.usuario.nome, "Usuário Home Atualizado");
  assert.equal(edicaoValida.usuario.email, novoEmail);
  assert.equal(edicaoValida.usuario.telefone, "84911112222");
  assert.equal(edicaoValida.usuario.cliente.cpf, "52998224725");

  // 4. CPF duplicado em outra conta deve falhar
  const edicaoCpfDuplicado = await atualizarDadosUsuario(cad2.usuario.id, {
    nome: "Outro Usuário",
    email: email2,
    telefone: "",
    cpf: "52998224725",
  });
  assert.equal(edicaoCpfDuplicado.ok, false);

  // 5. Alteração de senha rejeita senha atual incorreta e mesma senha
  const senhaErrada = await alterarSenhaUsuario(cad1.usuario.id, {
    senhaAtual: "Errada@123",
    novaSenha: "NovaSenha@456",
    confirmarNovaSenha: "NovaSenha@456",
  });
  assert.equal(senhaErrada.ok, false);

  const mesmaSenha = await alterarSenhaUsuario(cad1.usuario.id, {
    senhaAtual: senhaInicial,
    novaSenha: senhaInicial,
    confirmarNovaSenha: senhaInicial,
  });
  assert.equal(mesmaSenha.ok, false);

  const novaSenha = "NovaSenha@456";
  const senhaAlterada = await alterarSenhaUsuario(cad1.usuario.id, {
    senhaAtual: senhaInicial,
    novaSenha,
    confirmarNovaSenha: novaSenha,
  });
  assert.equal(senhaAlterada.ok, true);

  const loginNovaSenha = await autenticarUsuario({
    email: novoEmail,
    senha: novaSenha,
  });
  assert.equal(loginNovaSenha.ok, true);

  // 6. Exclusão da conta exige senha correta, anonimiza dados e revoga sessões
  const { token } = await criarSessaoNoBanco(cad1.usuario.id);
  assert.ok(await buscarUsuarioPorTokenSessao(token));

  const exclusaoSenhaErrada = await excluirContaUsuario(cad1.usuario.id, {
    senha: "SenhaIncorreta@000",
  });
  assert.equal(exclusaoSenhaErrada.ok, false);

  const exclusaoOk = await excluirContaUsuario(cad1.usuario.id, {
    senha: novaSenha,
  });
  assert.equal(exclusaoOk.ok, true);

  const sessaoAposExclusao = await buscarUsuarioPorTokenSessao(token);
  assert.equal(sessaoAposExclusao, null);

  const contaAposExclusao = await obterDadosConta(cad1.usuario.id);
  assert.equal(contaAposExclusao, null);

  const registroExcluido = await prisma.usuario.findUnique({
    where: { id: cad1.usuario.id },
    include: { cliente: true },
  });
  assert.equal(registroExcluido.status, "EXCLUIDO");
  assert.ok(registroExcluido.excluidoEm);
  assert.equal(registroExcluido.telefone, null);
  assert.equal(registroExcluido.cliente.cpf, null);
  assert.match(registroExcluido.email, /^excluido_/);

  const loginAposExclusao = await autenticarUsuario({
    email: novoEmail,
    senha: novaSenha,
  });
  assert.equal(loginAposExclusao.ok, false);
});
