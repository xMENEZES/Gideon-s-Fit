import { describe, expect, it } from "vitest";
import { LOGIN_THROTTLE_POLICY, formatWait, normalizeEmail } from "@/lib/login-throttle";
import { clientIp, throttleKeys } from "@/lib/login-throttle-keys";

// Mesma conta do banco (login_throttle_lock_seconds): a cada `step` tentativas sobe um degrau.
function lockAfter(count: number, step: number, schedule: number[]) {
  if (count <= 0 || count % step !== 0) return 0;
  return schedule[Math.min(count / step, schedule.length) - 1];
}

describe("política", () => {
  const [ip, ei, em] = LOGIN_THROTTLE_POLICY;

  it("e-mail + IP: 3 tentativas -> 1 min, 6 -> 5 min, 9 -> 15 min, 12 em diante -> 1 h", () => {
    const waits = [1, 2, 3, 4, 5, 6, 9, 12, 15, 18].map((n) => lockAfter(n, ei.step, ei.schedule));
    expect(waits).toEqual([0, 0, 60, 0, 0, 300, 900, 3600, 3600, 3600]);
  });

  it("IP: limite mais alto que o do e-mail + IP, e só conta depois do erro", () => {
    expect(ip.step).toBeGreaterThan(ei.step);
    expect(ip.count_now).toBe(false);
    expect(lockAfter(20, ip.step, ip.schedule)).toBe(60);
  });

  it("e-mail de qualquer IP: limite alto e espera de no máximo 15 min", () => {
    expect(em.step).toBeGreaterThan(ei.step);
    expect(Math.max(...em.schedule)).toBeLessThanOrEqual(15 * 60);
    expect(em.count_now).toBe(true);
  });

  it("as esperas só crescem", () => {
    for (const c of LOGIN_THROTTLE_POLICY) {
      expect([...c.schedule].sort((a, b) => a - b)).toEqual(c.schedule);
    }
  });
});

describe("throttleKeys", () => {
  const secret = "segredo-de-teste";

  it("não guarda e-mail nem IP puros", () => {
    const keys = throttleKeys("Ana@Example.com", "203.0.113.7", secret).join(" ");
    expect(keys).not.toMatch(/ana|example|203\.0\.113/i);
    for (const key of throttleKeys("a@b.com", "1.1.1.1", secret)) expect(key.length).toBeLessThanOrEqual(100);
  });

  it("e-mail em maiúsculas ou com espaço cai no mesmo contador", () => {
    expect(throttleKeys(" Ana@Example.com ", "1.1.1.1", secret)).toEqual(throttleKeys("ana@example.com", "1.1.1.1", secret));
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com");
  });

  it("muda o IP: troca o do IP e o do e-mail + IP, mas não o do e-mail", () => {
    const [ip1, ei1, em1] = throttleKeys("a@b.com", "1.1.1.1", secret);
    const [ip2, ei2, em2] = throttleKeys("a@b.com", "2.2.2.2", secret);
    expect(ip1).not.toBe(ip2);
    expect(ei1).not.toBe(ei2);
    expect(em1).toBe(em2);
  });

  it("muda o e-mail: mantém o do IP", () => {
    const [ip1, ei1, em1] = throttleKeys("a@b.com", "1.1.1.1", secret);
    const [ip2, ei2, em2] = throttleKeys("c@d.com", "1.1.1.1", secret);
    expect(ip1).toBe(ip2);
    expect(ei1).not.toBe(ei2);
    expect(em1).not.toBe(em2);
  });

  it("segredo diferente gera chaves diferentes", () => {
    expect(throttleKeys("a@b.com", "1.1.1.1", "x")).not.toEqual(throttleKeys("a@b.com", "1.1.1.1", "y"));
  });
});

describe("clientIp", () => {
  const headers = (init: Record<string, string>) => new Headers(init);

  it("usa x-real-ip, depois o primeiro do x-forwarded-for", () => {
    expect(clientIp(headers({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }))).toBe("1.2.3.4");
    expect(clientIp(headers({ "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(clientIp(headers({}))).toBe("desconhecido");
  });
});

describe("formatWait", () => {
  it("mostra minutos e segundos, e a hora quando passa de 1 h", () => {
    expect(formatWait(60)).toBe("1:00");
    expect(formatWait(45)).toBe("0:45");
    expect(formatWait(59.2)).toBe("1:00");
    expect(formatWait(900)).toBe("15:00");
    expect(formatWait(3600)).toBe("1:00:00");
    expect(formatWait(-5)).toBe("0:00");
  });
});
