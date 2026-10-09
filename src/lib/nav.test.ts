import { describe, expect, it } from "vitest";
import { isNavActive } from "@/lib/nav";

// Itens do menu do profissional, como configurados em (trainer)/layout.tsx.
const alunos = { exact: true, alsoActiveFor: ["/dashboard/alunos"] };

describe("isNavActive (menu do profissional)", () => {
  it("Meus Alunos fica ativo na lista e na ficha de um aluno", () => {
    expect(isNavActive("/dashboard", "/dashboard", alunos)).toBe(true);
    expect(isNavActive("/dashboard/alunos/abc", "/dashboard", alunos)).toBe(true);
    expect(isNavActive("/dashboard/alunos/abc/treino/historico", "/dashboard", alunos)).toBe(true);
  });

  it("Meus Alunos não fica ativo nas outras telas do painel", () => {
    expect(isNavActive("/dashboard/status", "/dashboard", alunos)).toBe(false);
    expect(isNavActive("/dashboard/modelos", "/dashboard", alunos)).toBe(false);
    expect(isNavActive("/dashboard/alertas", "/dashboard", alunos)).toBe(false);
  });

  it("os demais itens ficam ativos na tela e nas telas filhas", () => {
    expect(isNavActive("/dashboard/modelos", "/dashboard/modelos")).toBe(true);
    expect(isNavActive("/dashboard/modelos/xyz", "/dashboard/modelos")).toBe(true);
    expect(isNavActive("/dashboard/status", "/dashboard/status")).toBe(true);
  });

  it("não confunde rotas com o mesmo começo", () => {
    expect(isNavActive("/dashboard/statusx", "/dashboard/status")).toBe(false);
    expect(isNavActive("/dashboard/alunosx", "/dashboard", alunos)).toBe(false);
  });

  it("um item não fica ativo na tela de outro", () => {
    expect(isNavActive("/dashboard/alertas", "/dashboard/status")).toBe(false);
    expect(isNavActive("/dashboard", "/dashboard/modelos")).toBe(false);
  });
});
