"use server";

import { redirect } from "next/navigation";
import { criarSessao, encerrarSessao } from "../../lib/auth.js";
import {
  autenticarUsuario,
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
