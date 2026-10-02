import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um email válido"),
  password: z.string().min(1, "Informe a senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const cadastroSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome completo"),
  email: z.string().email("Informe um email válido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export type CadastroInput = z.infer<typeof cadastroSchema>;

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
