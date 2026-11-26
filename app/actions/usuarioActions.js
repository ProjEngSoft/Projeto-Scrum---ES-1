"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  criarSessao,
  encerrarSessao,
  obterUsuarioSessao,
} from "../../lib/auth.js";
import {
  alterarSenhaUsuario,
  atualizarDadosUsuario,
  autenticarUsuario,
  excluirContaUsuario,
  registrarCliente,
} from "../../lib/services/usuarioService.js";

function extrairCamposFormData(dados, campos) {
  const objeto = {};
  for (const campo of campos) {
    const valor = dados.get(campo);
    objeto[campo] = typeof valor === "string" ? valor : "";
  }
  return objeto;
}

function serializarDadosConta(conta) {
  if (!conta) return null;
  return {
    ...conta,
    criadoEm: conta.criadoEm instanceof Date ? conta.criadoEm.toISOString() : conta.criadoEm,
    atualizadoEm:
      conta.atualizadoEm instanceof Date
        ? conta.atualizadoEm.toISOString()
        : conta.atualizadoEm,
  };
}

export async function validarLogin(dados) {
  try {
    const entrada = extrairCamposFormData(dados, ["email", "senha"]);
    const resultado = await autenticarUsuario(entrada);

    if (!resultado.ok) {
      return { ok: false, erro: resultado.erro };
    }

    await criarSessao(resultado.usuario.id);
    return { ok: true };
  } catch (error) {
    console.error("Erro ao validar login:", error);
    return {
      ok: false,
      erro: "Não foi possível realizar o login no momento. Tente novamente.",
    };
  }
}

export async function cadastrarUsuario(dados) {
  try {
    const entrada = extrairCamposFormData(dados, [
      "nome",
      "email",
      "senha",
      "telefone",
    ]);
    const resultado = await registrarCliente(entrada);

    if (!resultado.ok) {
      return { ok: false, erro: resultado.erro };
    }

    await criarSessao(resultado.usuario.id);
    return { ok: true };
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    return {
      ok: false,
      erro: "Não foi possível concluir o cadastro no momento. Tente novamente.",
    };
  }
}

export async function encerrarSessaoAction() {
  await encerrarSessao();
  redirect("/");
}

export async function atualizarDadosContaAction(dados) {
  try {
    const usuario = await obterUsuarioSessao();
    if (!usuario) {
      return {
        ok: false,
        erro: "Sua sessão expirou. Faça login novamente.",
        sessaoExpirada: true,
      };
    }

    const entrada = extrairCamposFormData(dados, ["nome", "email", "telefone"]);
    if (dados.has("cpf")) {
      const cpfValor = dados.get("cpf");
      entrada.cpf = typeof cpfValor === "string" ? cpfValor : "";
    }

    const resultado = await atualizarDadosUsuario(usuario.id, entrada);
    if (!resultado.ok) {
      return { ok: false, erro: resultado.erro };
    }

    revalidatePath("/home");
    return {
      ok: true,
      usuario: serializarDadosConta(resultado.usuario),
    };
  } catch (error) {
    console.error("Erro ao atualizar dados da conta:", error);
    return {
      ok: false,
      erro: "Não foi possível atualizar seus dados no momento. Tente novamente.",
    };
  }
}

export async function alterarSenhaAction(dados) {
  try {
    const usuario = await obterUsuarioSessao();
    if (!usuario) {
      return {
        ok: false,
        erro: "Sua sessão expirou. Faça login novamente.",
        sessaoExpirada: true,
      };
    }

    const entrada = extrairCamposFormData(dados, [
      "senhaAtual",
      "novaSenha",
      "confirmarNovaSenha",
    ]);

    const resultado = await alterarSenhaUsuario(usuario.id, entrada);
    if (!resultado.ok) {
      return { ok: false, erro: resultado.erro };
    }

    return { ok: true };
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return {
      ok: false,
      erro: "Não foi possível alterar sua senha no momento. Tente novamente.",
    };
  }
}

export async function excluirContaAction(dados) {
  try {
    const usuario = await obterUsuarioSessao();
    if (!usuario) {
      return {
        ok: false,
        erro: "Sua sessão expirou. Faça login novamente.",
        sessaoExpirada: true,
      };
    }

    const entrada = extrairCamposFormData(dados, ["senha"]);
    const resultado = await excluirContaUsuario(usuario.id, entrada);

    if (!resultado.ok) {
      return { ok: false, erro: resultado.erro };
    }

    await encerrarSessao();
    return { ok: true };
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    return {
      ok: false,
      erro: "Não foi possível excluir sua conta no momento. Tente novamente.",
    };
  }
}
