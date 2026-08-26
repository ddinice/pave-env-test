import { z } from "zod";

const finiteDecimal = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

export const manualValueSchema = z
  .object({
    value: z.string().trim(),
    unit: z.string().trim(),
  })
  .superRefine(({ value, unit }, context) => {
    if (!finiteDecimal.test(value) || !Number.isFinite(Number(value))) {
      context.addIssue({ code: "custom", path: ["value"], message: "Value must be a finite decimal." });
    }

    if (unit.length === 0) {
      context.addIssue({ code: "custom", path: ["unit"], message: "Unit is required." });
    }
  });

export type ManualValue = z.infer<typeof manualValueSchema>;

export function parseManualValue(input: unknown): ManualValue {
  return manualValueSchema.parse(input);
}
