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
