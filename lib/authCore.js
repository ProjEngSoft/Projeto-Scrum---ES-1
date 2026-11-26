import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

const BCRYPT_ROUNDS = 10;
const DEFAULT_TTL_DAYS = 7;

export function getSessionCookieName() {
  return process.env.SESSION_COOKIE_NAME || "conserta_session";
}

function getSessionTtlMs() {
  const days = Number(process.env.SESSION_TTL_DAYS || DEFAULT_TTL_DAYS);
  const validDays = Number.isFinite(days) && days > 0 ? days : DEFAULT_TTL_DAYS;
  return validDays * 24 * 60 * 60 * 1000;
}

/**
 * Gera hash bcrypt seguro da senha em texto puro.
 */
export async function hashSenha(senha) {
  return bcrypt.hash(senha, BCRYPT_ROUNDS);
}

/**
 * Compara senha em texto puro com o hash armazenado no banco.
 */
export async function verificarSenha(senha, senhaHash) {
  return bcrypt.compare(senha, senhaHash);
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Gera token aleatório de sessão e seu hash SHA-256 para persistência segura.
 */
export function gerarTokenSessao() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

/**
 * Cria um registro de sessão no PostgreSQL e retorna o token bruto + expiração.
 */
export async function criarSessaoNoBanco(usuarioId) {
  const { token, tokenHash } = gerarTokenSessao();
  const expiraEm = new Date(Date.now() + getSessionTtlMs());

  await prisma.sessao.create({
    data: {
      usuarioId,
      tokenHash,
      expiraEm,
    },
  });

  return { token, expiraEm };
}

/**
 * Busca uma sessão válida pelo token bruto; retorna o usuário ativo ou null.
 */
export async function buscarUsuarioPorTokenSessao(token) {
  if (!token) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          perfil: true,
          status: true,
          criadoEm: true,
        },
      },
    },
  });

  if (!sessao) return null;

  if (sessao.expiraEm <= new Date() || sessao.usuario.status !== "ATIVO") {
    await prisma.sessao.delete({ where: { id: sessao.id } }).catch(() => {});
    return null;
  }

  return sessao.usuario;
}

/**
 * Remove a sessão do banco a partir do token bruto.
 */
export async function revogarSessaoPorToken(token) {
  if (!token) return;
  await prisma.sessao.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}
