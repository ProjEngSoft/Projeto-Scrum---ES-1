import { cookies } from "next/headers";
import {
  buscarUsuarioPorTokenSessao,
  criarSessaoNoBanco,
  getSessionCookieName,
  revogarSessaoPorToken,
} from "./authCore.js";

/**
 * Cria sessão no banco e grava cookie HttpOnly no navegador.
 */
export async function criarSessao(usuarioId) {
  const { token, expiraEm } = await criarSessaoNoBanco(usuarioId);
  const cookieStore = await cookies();

  cookieStore.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEm,
  });
}

/**
 * Obtém o usuário autenticado a partir do cookie da requisição atual.
 */
export async function obterUsuarioSessao() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  return buscarUsuarioPorTokenSessao(token);
}

/**
 * Revoga a sessão atual no banco e remove o cookie de autenticação.
 */
export async function encerrarSessao() {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();
  const token = cookieStore.get(cookieName)?.value;

  await revogarSessaoPorToken(token);
  cookieStore.delete(cookieName);
}
