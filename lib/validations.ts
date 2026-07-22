import { z } from "zod";
import { CATEGORIAS_POR_TIPO } from "./categorias";

// Base object schema without the refine (allows .partial() for PATCH routes)
export const movimientoBaseSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  tipo: z.enum(["INGRESO", "EGRESO"], { required_error: "El tipo es requerido" }),
  categoria: z.string().min(1, "La categoría es requerida"),
  concepto: z
    .string()
    .min(1, "El concepto es requerido")
    .max(200, "El concepto es demasiado largo"),
  presupuesto: z
    .number({ invalid_type_error: "Ingresa un número válido" })
    .positive("El presupuesto debe ser positivo")
    .optional()
    .nullable(),
  monto: z
    .number({
      required_error: "El monto es requerido",
      invalid_type_error: "Ingresa un número válido",
    })
    .positive("El monto debe ser mayor a 0"),
});

// Full schema with cross-field validation (for POST / frontend)
export const movimientoSchema = movimientoBaseSchema.refine(
  (data) =>
    CATEGORIAS_POR_TIPO[data.tipo as "INGRESO" | "EGRESO"]?.includes(
      data.categoria
    ),
  {
    message: "La categoría no es válida para el tipo seleccionado",
    path: ["categoria"],
  }
);

export type MovimientoInput = z.infer<typeof movimientoSchema>;

// Partial schema for PATCH (allows partial updates without the refine constraint)
export const movimientoUpdateSchema = movimientoBaseSchema.partial();
export type MovimientoUpdate = z.infer<typeof movimientoUpdateSchema>;

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
