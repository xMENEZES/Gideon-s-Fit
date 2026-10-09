import { describe, expect, it } from "vitest";
import { formatQuantity, isKnownUnit } from "@/lib/units";

describe("formatQuantity", () => {
  it("usa o plural quando a quantidade é maior que 1", () => {
    expect(formatQuantity(2, "unidade")).toBe("2 unidades");
    expect(formatQuantity(3, "fatia")).toBe("3 fatias");
    expect(formatQuantity(2, "porção")).toBe("2 porções");
    expect(formatQuantity(2, "dose")).toBe("2 doses");
  });

  it("mantém o singular para 1 e para frações menores que 1", () => {
    expect(formatQuantity(1, "unidade")).toBe("1 unidade");
    expect(formatQuantity(0.5, "porção")).toBe("0,5 porção");
    expect(formatQuantity(0, "fatia")).toBe("0 fatia");
  });

  it("usa plural em decimais maiores que 1", () => {
    expect(formatQuantity(1.5, "fatia")).toBe("1,5 fatias");
  });

  it("não altera unidades de medida abreviadas", () => {
    expect(formatQuantity(200, "g")).toBe("200 g");
    expect(formatQuantity(1.5, "l")).toBe("1,5 l");
    expect(formatQuantity(250, "ml")).toBe("250 ml");
    expect(formatQuantity(2, "kg")).toBe("2 kg");
  });

  it("preserva unidades antigas digitadas à mão", () => {
    expect(formatQuantity(2, "scoop")).toBe("2 scoop");
    expect(formatQuantity(1, "colher de sopa")).toBe("1 colher de sopa");
  });

  it("formata milhares e até duas casas decimais no padrão brasileiro", () => {
    expect(formatQuantity(1250, "g")).toBe("1.250 g");
    expect(formatQuantity(0.25, "kg")).toBe("0,25 kg");
  });
});

describe("isKnownUnit", () => {
  it("reconhece as unidades da lista e rejeita as demais", () => {
    expect(isKnownUnit("g")).toBe(true);
    expect(isKnownUnit("porção")).toBe(true);
    expect(isKnownUnit("scoop")).toBe(false);
    expect(isKnownUnit("")).toBe(false);
  });
});
