import { prisma } from "../prisma.js";
import { hashSenha, verificarSenha } from "../authCore.js";
import {
  cadastroUsuarioSchema,
  loginSchema,
} from "../validators/usuarioValidator.js";

/**
 * Formata o primeiro erro do Zod para exibição segura ao usuário.
 */
function extrairMensagemErroZod(parsedError) {
  const firstIssue = parsedError.issues?.[0];
  return firstIssue?.message || "Dados inválidos.";
}

/**
 * Autentica credenciais contra a tabela USUARIO usando hash bcrypt.
 */
export async function autenticarUsuario(input) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: extrairMensagemErroZod(parsed.error) };
  }

  const { email, senha } = parsed.data;
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: {
      id: true,
      nome: true,
      email: true,
      senhaHash: true,
      perfil: true,
      status: true,
    },
  });

  if (!usuario) {
    return { ok: false, erro: "E-mail ou senha inválidos." };
  }

  if (usuario.status === "BLOQUEADO") {
    return { ok: false, erro: "Esta conta está bloqueada. Contate o suporte." };
  }

  if (usuario.status !== "ATIVO") {
    return { ok: false, erro: "E-mail ou senha inválidos." };
  }

  const senhaConfere = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return { ok: false, erro: "E-mail ou senha inválidos." };
  }

  return {
    ok: true,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    },
  };
}

/**
 * Cadastra um novo usuário com perfil inicial CLIENTE dentro de uma transação.
 */
export async function registrarCliente(input) {
  const parsed = cadastroUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: extrairMensagemErroZod(parsed.error) };
  }

  const { nome, email, senha, telefone } = parsed.data;

  const existente = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existente) {
    return { ok: false, erro: "Já existe uma conta cadastrada com este e-mail." };
  }

  const senhaHash = await hashSenha(senha);

  const usuario = await prisma.$transaction(async (tx) => {
    const novoUsuario = await tx.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        telefone: telefone || null,
        perfil: "CLIENTE",
        status: "ATIVO",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        status: true,
        criadoEm: true,
      },
    });

    await tx.cliente.create({
      data: {
        usuarioId: novoUsuario.id,
      },
    });

    return novoUsuario;
  });

  return { ok: true, usuario };
}
