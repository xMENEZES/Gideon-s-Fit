import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um email válido"),
  password: z.string().min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const cadastroSchema = z
  .object({
    role: z.enum(["trainer", "standard"], { message: "Escolha o tipo de perfil" }),
    fullName: z.string().min(2, "Informe seu nome completo").max(120, "No máximo 120 caracteres"),
    email: z.string().email("Informe um email válido"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine((value) => value === true, "Aceite a política de privacidade para continuar"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type CadastroInput = z.infer<typeof cadastroSchema>;

export const esqueciSenhaSchema = z.object({
  email: z.string().email("Informe um email válido"),
});

export type EsqueciSenhaInput = z.infer<typeof esqueciSenhaSchema>;

export const redefinirSenhaSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;

export const definirSenhaSchema = z
  .object({
    firstName: z.string().min(1, "Informe seu nome"),
    lastName: z.string().min(1, "Informe seu sobrenome"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type DefinirSenhaInput = z.infer<typeof definirSenhaSchema>;
