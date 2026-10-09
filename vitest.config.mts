import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Testes automáticos das regras de cálculo (sem banco e sem navegador).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
