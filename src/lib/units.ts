// Unidades de medida dos alimentos. O valor salvo é sempre o do campo `value` (singular);
// o plural só existe na exibição. Itens antigos podem ter qualquer outro texto, que
// continua valendo e aparece como "Outro" ao editar.
export const UNIT_OPTIONS = [
  { value: "g", label: "g (gramas)" },
  { value: "kg", label: "kg (quilos)" },
  { value: "ml", label: "ml (mililitros)" },
  { value: "l", label: "l (litros)" },
  { value: "unidade", label: "unidade" },
  { value: "fatia", label: "fatia" },
  { value: "porção", label: "porção" },
  { value: "dose", label: "dose" },
] as const;

// Valor interno do item "Outro" no menu (nunca é salvo).
export const OTHER_UNIT = "__outro__";

const PLURALS: Record<string, string> = {
  unidade: "unidades",
  fatia: "fatias",
  porção: "porções",
  dose: "doses",
};

export function isKnownUnit(unit: string): boolean {
  return UNIT_OPTIONS.some((option) => option.value === unit);
}

// "2 unidades", "1 fatia", "0,5 porção", "1,5 doses", "200 g". Em português, o plural vale
// para quantidades maiores que 1 (0,5 e 1 ficam no singular).
export function formatQuantity(quantity: number, unit: string): string {
  const value = Number(quantity);
  const text = value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const label = value > 1 ? (PLURALS[unit] ?? unit) : unit;
  return `${text} ${label}`;
}
