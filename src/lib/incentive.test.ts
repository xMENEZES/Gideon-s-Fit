import { describe, expect, it } from "vitest";
import {
  bodiesFor,
  dietDayComplete,
  eventFor,
  fillMessage,
  firstName,
  pickMessage,
  workoutDayComplete,
} from "@/lib/incentive";

const TODAY = "2026-10-10";
const ex = (...dates: string[]) => ({ exercise_load_logs: dates.map((logged_at) => ({ logged_at })) });

describe("workoutDayComplete", () => {
  it("exige todos os exercícios do dia registrados na data", () => {
    const days = [{ exercises: [ex(TODAY), ex(TODAY), ex(TODAY)] }];
    expect(workoutDayComplete(days, TODAY)).toBe(true);
  });

  it("um exercício sem registro de hoje deixa o dia incompleto", () => {
    expect(workoutDayComplete([{ exercises: [ex(TODAY), ex("2026-10-09")] }], TODAY)).toBe(false);
    expect(workoutDayComplete([{ exercises: [ex(TODAY), ex()] }], TODAY)).toBe(false);
  });

  it("cardio conta como exercício do dia (precisa de uma sessão)", () => {
    expect(workoutDayComplete([{ exercises: [ex(TODAY), ex(TODAY)] }], TODAY)).toBe(true);
    expect(workoutDayComplete([{ exercises: [ex(TODAY), ex()] }], TODAY)).toBe(false);
  });

  it("registros espalhados em dias diferentes do protocolo não completam nenhum", () => {
    const days = [{ exercises: [ex(TODAY), ex()] }, { exercises: [ex(), ex(TODAY)] }];
    expect(workoutDayComplete(days, TODAY)).toBe(false);
  });

  it("basta um dia do protocolo estar completo", () => {
    const days = [{ exercises: [ex(TODAY), ex()] }, { exercises: [ex(TODAY)] }];
    expect(workoutDayComplete(days, TODAY)).toBe(true);
  });

  it("dia sem exercícios e protocolo vazio não contam", () => {
    expect(workoutDayComplete([{ exercises: [] }], TODAY)).toBe(false);
    expect(workoutDayComplete([], TODAY)).toBe(false);
    expect(workoutDayComplete(null, TODAY)).toBe(false);
  });
});

describe("dietDayComplete", () => {
  const meal = (...logs: [string, boolean][]) => ({
    meal_logs: logs.map(([log_date, done]) => ({ log_date, done })),
  });

  it("todas as refeições feitas hoje", () => {
    expect(dietDayComplete([meal([TODAY, true]), meal([TODAY, true])], TODAY)).toBe(true);
  });

  it("uma refeição não feita, sem registro ou de outro dia deixa incompleto", () => {
    expect(dietDayComplete([meal([TODAY, true]), meal([TODAY, false])], TODAY)).toBe(false);
    expect(dietDayComplete([meal([TODAY, true]), meal()], TODAY)).toBe(false);
    expect(dietDayComplete([meal([TODAY, true]), meal(["2026-10-09", true])], TODAY)).toBe(false);
  });

  it("sem refeições não conta", () => {
    expect(dietDayComplete([], TODAY)).toBe(false);
    expect(dietDayComplete(undefined, TODAY)).toBe(false);
  });
});

describe("eventFor", () => {
  it("mostra a mensagem do módulo concluído", () => {
    expect(eventFor("workout", { workout: true, diet: false })).toBe("workout");
    expect(eventFor("diet", { workout: false, diet: true })).toBe("diet");
  });

  it("com treino e alimentação concluídos, vale o dia completo nas duas telas", () => {
    expect(eventFor("workout", { workout: true, diet: true })).toBe("day");
    expect(eventFor("diet", { workout: true, diet: true })).toBe("day");
  });

  it("sem conclusão ou sem o módulo, não mostra nada", () => {
    expect(eventFor("workout", { workout: false, diet: true })).toBeNull();
    expect(eventFor("workout", { workout: null, diet: true })).toBeNull();
  });

  it("quem só tem um módulo recebe a mensagem dele, não a de dia completo", () => {
    expect(eventFor("workout", { workout: true, diet: null })).toBe("workout");
    expect(eventFor("diet", { workout: null, diet: true })).toBe("diet");
  });
});

describe("bodiesFor", () => {
  const messages = [
    { owner_id: null, event: "workout" as const, body: "do sistema", active: true },
    { owner_id: "t1", event: "workout" as const, body: "do profissional", active: true },
    { owner_id: "t1", event: "workout" as const, body: "desativada", active: false },
    { owner_id: "t2", event: "workout" as const, body: "de outro profissional", active: true },
    { owner_id: null, event: "diet" as const, body: "dieta do sistema", active: true },
  ];

  it("aluno do time recebe as do profissional dele", () => {
    expect(bodiesFor(messages, "workout", "t1")).toEqual(["do profissional"]);
  });

  it("sem mensagem ativa do profissional para o evento, cai no sistema", () => {
    expect(bodiesFor(messages, "diet", "t1")).toEqual(["dieta do sistema"]);
    const allOff = messages.map((m) => (m.owner_id === "t1" ? { ...m, active: false } : m));
    expect(bodiesFor(allOff, "workout", "t1")).toEqual(["do sistema"]);
  });

  it("plano próprio recebe as do sistema, nunca as de profissional", () => {
    expect(bodiesFor(messages, "workout", null)).toEqual(["do sistema"]);
  });

  it("não usa mensagem de outro profissional", () => {
    expect(bodiesFor(messages, "workout", "t3")).toEqual(["do sistema"]);
  });
});

describe("pickMessage", () => {
  it("é estável para a mesma semente e devolve null sem mensagens", () => {
    const bodies = ["a", "b", "c", "d"];
    expect(pickMessage(bodies, "aluno-1|2026-10-10|workout")).toBe(pickMessage(bodies, "aluno-1|2026-10-10|workout"));
    expect(pickMessage([], "x")).toBeNull();
  });

  it("varia entre dias e sempre escolhe uma das opções", () => {
    const bodies = ["a", "b", "c", "d"];
    const seen = new Set<string | null>();
    for (let day = 1; day <= 28; day++) seen.add(pickMessage(bodies, `aluno-1|2026-10-${day}|workout`));
    expect(seen.size).toBeGreaterThan(1);
    for (const value of seen) expect(bodies).toContain(value);
  });
});

describe("fillMessage", () => {
  it("troca {nome} e {sequencia}", () => {
    expect(fillMessage("{sequencia} dias, muito bom, {nome}.", { nome: "Ana", sequencia: 7 })).toBe(
      "7 dias, muito bom, Ana."
    );
  });

  it("sem valor, o trecho some sem deixar espaço sobrando", () => {
    expect(fillMessage("Boa, {nome}! Dia fechado.", {})).toBe("Boa! Dia fechado.");
    expect(fillMessage("Dia fechado, {nome}.", {})).toBe("Dia fechado.");
  });

  it("não mexe em texto sem variáveis", () => {
    expect(fillMessage("O sofá perdeu essa disputa, treino feito!", { nome: "Ana" })).toBe(
      "O sofá perdeu essa disputa, treino feito!"
    );
  });
});

describe("firstName", () => {
  it("usa o apelido, senão a primeira palavra do nome", () => {
    expect(firstName("Maria da Silva", "Mari")).toBe("Mari");
    expect(firstName("Maria da Silva", "  ")).toBe("Maria");
    expect(firstName("  João  Souza ")).toBe("João");
    expect(firstName(null)).toBe("");
  });
});
