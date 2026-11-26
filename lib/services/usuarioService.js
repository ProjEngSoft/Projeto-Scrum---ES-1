import { prisma } from "../prisma.js";
import { hashSenha, verificarSenha } from "../authCore.js";
import {
  alterarSenhaSchema,
  atualizarDadosSchema,
  cadastroUsuarioSchema,
  excluirContaSchema,
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

/**
 * Consulta os dados completos da conta ativa sem expor o hash da senha.
 */
export async function obterDadosConta(usuarioId) {
  if (!usuarioId) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      perfil: true,
      status: true,
      criadoEm: true,
      atualizadoEm: true,
      cliente: {
        select: {
          usuarioId: true,
          cpf: true,
        },
      },
      profissional: {
        select: {
          usuarioId: true,
          tipoPessoa: true,
          cpf: true,
          cnpj: true,
          descricao: true,
          regiaoAtendimento: true,
          uf: true,
          cidade: true,
          bairro: true,
          horarioAtendimento: true,
          ativo: true,
        },
      },
    },
  });

  if (!usuario || usuario.status !== "ATIVO") {
    return null;
  }

  return usuario;
}

/**
 * Atualiza os dados cadastrais do usuário autenticado com validação e checagem de unicidade.
 */
export async function atualizarDadosUsuario(usuarioId, input) {
  const parsed = atualizarDadosSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: extrairMensagemErroZod(parsed.error) };
  }

  const { nome, email, telefone, cpf } = parsed.data;

  const usuarioAtual = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      status: true,
      cliente: {
        select: { usuarioId: true },
      },
    },
  });

  if (!usuarioAtual || usuarioAtual.status !== "ATIVO") {
    return { ok: false, erro: "Conta não encontrada ou inativa." };
  }

  const emailEmUso = await prisma.usuario.findFirst({
    where: {
      email,
      id: { not: usuarioId },
    },
    select: { id: true },
  });

  if (emailEmUso) {
    return { ok: false, erro: "Já existe outra conta cadastrada com este e-mail." };
  }

  const deveAtualizarCpf =
    Boolean(usuarioAtual.cliente) &&
    Object.prototype.hasOwnProperty.call(input ?? {}, "cpf");

  if (deveAtualizarCpf && cpf) {
    const cpfEmUso = await prisma.cliente.findFirst({
      where: {
        cpf,
        usuarioId: { not: usuarioId },
      },
      select: { usuarioId: true },
    });

    if (cpfEmUso) {
      return { ok: false, erro: "Já existe outra conta cadastrada com este CPF." };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          nome,
          email,
          telefone: telefone || null,
        },
      });

      if (deveAtualizarCpf) {
        await tx.cliente.update({
          where: { usuarioId },
          data: {
            cpf: cpf || null,
          },
        });
      }
    });
  } catch (error) {
    if (error?.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target || "");
      if (target.includes("cpf")) {
        return { ok: false, erro: "Já existe outra conta cadastrada com este CPF." };
      }
      return { ok: false, erro: "Já existe outra conta cadastrada com este e-mail." };
    }
    throw error;
  }

  const usuarioAtualizado = await obterDadosConta(usuarioId);
  return { ok: true, usuario: usuarioAtualizado };
}

/**
 * Altera a senha do usuário após validar a senha atual.
 */
export async function alterarSenhaUsuario(usuarioId, input) {
  const parsed = alterarSenhaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: extrairMensagemErroZod(parsed.error) };
  }

  const { senhaAtual, novaSenha } = parsed.data;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      senhaHash: true,
      status: true,
    },
  });

  if (!usuario || usuario.status !== "ATIVO") {
    return { ok: false, erro: "Conta não encontrada ou inativa." };
  }

  const senhaConfere = await verificarSenha(senhaAtual, usuario.senhaHash);
  if (!senhaConfere) {
    return { ok: false, erro: "A senha atual informada está incorreta." };
  }

  const mesmaSenha = await verificarSenha(novaSenha, usuario.senhaHash);
  if (mesmaSenha) {
    return { ok: false, erro: "A nova senha deve ser diferente da senha atual." };
  }

  const novoHash = await hashSenha(novaSenha);
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { senhaHash: novoHash },
  });

  return { ok: true };
}

/**
 * Realiza exclusão lógica da conta, anonimiza dados pessoais e revoga sessões ativas.
 */
export async function excluirContaUsuario(usuarioId, input) {
  const parsed = excluirContaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: extrairMensagemErroZod(parsed.error) };
  }

  const { senha } = parsed.data;

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      senhaHash: true,
      status: true,
      cliente: { select: { usuarioId: true } },
      profissional: { select: { usuarioId: true } },
    },
  });

  if (!usuario || usuario.status !== "ATIVO") {
    return { ok: false, erro: "Conta não encontrada ou já excluída." };
  }

  const senhaConfere = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return { ok: false, erro: "Senha incorreta. A conta não foi excluída." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.sessao.deleteMany({
      where: { usuarioId },
    });

    await tx.tokenRecuperacaoSenha.deleteMany({
      where: { usuarioId },
    });

    if (usuario.cliente) {
      await tx.cliente.update({
        where: { usuarioId },
        data: { cpf: null },
      });
    }

    if (usuario.profissional) {
      await tx.profissional.update({
        where: { usuarioId },
        data: { ativo: false },
      });
    }

    await tx.usuario.update({
      where: { id: usuarioId },
      data: {
        status: "EXCLUIDO",
        excluidoEm: new Date(),
        email: `excluido_${usuarioId}_${Date.now()}@excluido.local`,
        telefone: null,
      },
    });
  });

  return { ok: true };
}
