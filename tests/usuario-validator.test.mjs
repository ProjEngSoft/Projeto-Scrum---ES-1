import test from "node:test";
import assert from "node:assert/strict";
import {
  alterarSenhaSchema,
  atualizarDadosSchema,
  excluirContaSchema,
  limparDigitos,
  validarCpf,
} from "../lib/validators/usuarioValidator.js";

test("limparDigitos remove caracteres não numéricos", () => {
  assert.equal(limparDigitos("529.982.247-25"), "52998224725");
  assert.equal(limparDigitos(null), "");
  assert.equal(limparDigitos(""), "");
});

test("validarCpf aceita CPFs válidos e rejeita inválidos", () => {
  assert.equal(validarCpf("52998224725"), true);
  assert.equal(validarCpf("529.982.247-25"), true);
  assert.equal(validarCpf("111.444.777-35"), true);

  assert.equal(validarCpf("11111111111"), false);
  assert.equal(validarCpf("52998224720"), false);
  assert.equal(validarCpf("123456789"), false);
  assert.equal(validarCpf(""), false);
});

test("atualizarDadosSchema valida nome, email, telefone e cpf", () => {
  const validoCompleto = atualizarDadosSchema.safeParse({
    nome: "  Maria Souza  ",
    email: "  MARIA@Example.COM ",
    telefone: " (84) 99999-0000 ",
    cpf: "529.982.247-25",
  });
  assert.equal(validoCompleto.success, true);
  assert.equal(validoCompleto.data.nome, "Maria Souza");
  assert.equal(validoCompleto.data.email, "maria@example.com");
  assert.equal(validoCompleto.data.cpf, "52998224725");

  const semOpcionais = atualizarDadosSchema.safeParse({
    nome: "João Silva",
    email: "joao@example.com",
    telefone: "",
    cpf: "",
  });
  assert.equal(semOpcionais.success, true);
  assert.equal(semOpcionais.data.cpf, "");

  const nomeCurto = atualizarDadosSchema.safeParse({
    nome: "Ab",
    email: "joao@example.com",
  });
  assert.equal(nomeCurto.success, false);

  const emailInvalido = atualizarDadosSchema.safeParse({
    nome: "João Silva",
    email: "email-invalido",
  });
  assert.equal(emailInvalido.success, false);

  const cpfInvalido = atualizarDadosSchema.safeParse({
    nome: "João Silva",
    email: "joao@example.com",
    cpf: "111.111.111-11",
  });
  assert.equal(cpfInvalido.success, false);
});

test("alterarSenhaSchema valida tamanho mínimo e confirmação", () => {
  const valido = alterarSenhaSchema.safeParse({
    senhaAtual: "SenhaAtual@123",
    novaSenha: "NovaSenha@123",
    confirmarNovaSenha: "NovaSenha@123",
  });
  assert.equal(valido.success, true);

  const senhaCurta = alterarSenhaSchema.safeParse({
    senhaAtual: "SenhaAtual@123",
    novaSenha: "123",
    confirmarNovaSenha: "123",
  });
  assert.equal(senhaCurta.success, false);

  const confirmacaoDiferente = alterarSenhaSchema.safeParse({
    senhaAtual: "SenhaAtual@123",
    novaSenha: "NovaSenha@123",
    confirmarNovaSenha: "OutraSenha@123",
  });
  assert.equal(confirmacaoDiferente.success, false);
});

test("excluirContaSchema exige senha preenchida", () => {
  assert.equal(
    excluirContaSchema.safeParse({ senha: "MinhaSenha@123" }).success,
    true
  );
  assert.equal(excluirContaSchema.safeParse({ senha: "" }).success, false);
});
