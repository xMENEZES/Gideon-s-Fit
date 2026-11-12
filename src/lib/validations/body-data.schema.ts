import { z } from "zod";
import { todayBR } from "@/lib/dates";
import { HEIGHT_CM, MIN_AGE, WEIGHT_KG, birthDateStatus } from "@/lib/body-data";

// Campo em branco vale "não informado" (sem isso, "" virava 0).
const emptyToUndefined = (value: unknown) =>
  value === "" || value == null || (typeof value === "string" && value.trim() === "") ? undefined : value;

// Peso aceita vírgula ("72,5"), como a pessoa escreve.
const decimalText = (value: unknown) => {
  const cleaned = emptyToUndefined(value);
  return typeof cleaned === "string" ? cleaned.trim().replace(",", ".") : cleaned;
};

export const bodyDataSchema = z.object({
  // A data de nascimento é obrigatória: é ela que garante a idade mínima.
  birthDate: z
    .string("Informe a data de nascimento")
    .min(1, "Informe a data de nascimento")
    .superRefine((value, ctx) => {
      const status = birthDateStatus(value, todayBR());
      if (status === "invalid") ctx.addIssue({ code: "custom", message: "Informe uma data de nascimento válida" });
      if (status === "underage") {
        ctx.addIssue({ code: "custom", message: `Os dados de saúde são só para maiores de ${MIN_AGE} anos` });
      }
      if (status === "too_old") ctx.addIssue({ code: "custom", message: "Informe uma data de nascimento válida" });
    }),
  heightCm: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number("Altura: informe um número inteiro em cm")
      .int("Altura: informe um número inteiro em cm")
      .min(HEIGHT_CM.min, `Altura entre ${HEIGHT_CM.min} e ${HEIGHT_CM.max} cm`)
      .max(HEIGHT_CM.max, `Altura entre ${HEIGHT_CM.min} e ${HEIGHT_CM.max} cm`)
      .optional()
  ),
  weightKg: z.preprocess(
    decimalText,
    z.coerce
      .number("Peso: informe um número em kg (ex.: 72,5)")
      .min(WEIGHT_KG.min, `Peso entre ${WEIGHT_KG.min} e ${WEIGHT_KG.max} kg`)
      .max(WEIGHT_KG.max, `Peso entre ${WEIGHT_KG.min} e ${WEIGHT_KG.max} kg`)
      .refine((value) => Math.round(value * 10) / 10 === value, "Use no máximo uma casa decimal (ex.: 72,5)")
      .optional()
  ),
});
export type BodyDataInput = z.infer<typeof bodyDataSchema>;
export type BodyDataFormInput = z.input<typeof bodyDataSchema>;
