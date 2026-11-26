import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Informe o e-mail." })
    .trim()
    .toLowerCase()
    .email("E-mail inválido.")
    .max(150, "E-mail muito longo."),
  senha: z
    .string({ required_error: "Informe a senha." })
    .min(1, "Informe a senha.")
    .max(128, "Senha muito longa."),
});

export const cadastroUsuarioSchema = z.object({
  nome: z
    .string({ required_error: "Informe o nome." })
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),
  email: z
    .string({ required_error: "Informe o e-mail." })
    .trim()
    .toLowerCase()
    .email("E-mail inválido.")
    .max(150, "E-mail muito longo."),
  senha: z
    .string({ required_error: "Informe a senha." })
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(128, "A senha deve ter no máximo 128 caracteres."),
  telefone: z
    .string()
    .trim()
    .max(20, "Telefone muito longo.")
    .optional()
    .or(z.literal("")),
});

export function limparDigitos(valor) {
  if (typeof valor !== "string") return "";
  return valor.replace(/\D/g, "");
}

export function validarCpf(valor) {
  const digitos = limparDigitos(valor);
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(digitos[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(digitos[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(digitos[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(digitos[10]);
}

export const atualizarDadosSchema = z.object({
  nome: z
    .string({ required_error: "Informe o nome." })
    .trim()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),
  email: z
    .string({ required_error: "Informe o e-mail." })
    .trim()
    .toLowerCase()
    .email("E-mail inválido.")
    .max(150, "E-mail muito longo."),
  telefone: z
    .string()
    .trim()
    .max(20, "Telefone muito longo.")
    .optional()
    .or(z.literal("")),
  cpf: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((valor) => limparDigitos(valor || ""))
    .refine((valor) => valor === "" || validarCpf(valor), {
      message: "CPF inválido. Informe um CPF válido com 11 dígitos.",
    }),
});

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z
      .string({ required_error: "Informe a senha atual." })
      .min(1, "Informe a senha atual.")
      .max(128, "Senha atual muito longa."),
    novaSenha: z
      .string({ required_error: "Informe a nova senha." })
      .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
      .max(128, "A nova senha deve ter no máximo 128 caracteres."),
    confirmarNovaSenha: z
      .string({ required_error: "Confirme a nova senha." })
      .min(1, "Confirme a nova senha.")
      .max(128, "Confirmação de senha muito longa."),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
    message: "A confirmação da nova senha não confere.",
    path: ["confirmarNovaSenha"],
  });

export const excluirContaSchema = z.object({
  senha: z
    .string({ required_error: "Informe sua senha atual para confirmar a exclusão." })
    .min(1, "Informe sua senha atual para confirmar a exclusão.")
    .max(128, "Senha muito longa."),
});
