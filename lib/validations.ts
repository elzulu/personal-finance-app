import { z } from "zod";
import { CATEGORIAS_POR_TIPO } from "./categorias";
import { TIPOS_DEUDA } from "./tiposDeuda";

export const movimientoBaseSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  tipo: z.enum(["INGRESO", "EGRESO"], { required_error: "El tipo es requerido" }),
  categoria: z.string().min(1, "La categoría es requerida"),
  concepto: z
    .string()
    .min(1, "El concepto es requerido")
    .max(200, "El concepto es demasiado largo"),
  monto: z
    .number({
      required_error: "El monto es requerido",
      invalid_type_error: "Ingresa un número válido",
    })
    .positive("El monto debe ser mayor a 0"),
  miembroId: z.string().optional().nullable(),
  deudaId: z.string().optional().nullable(),
});

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

export const movimientoUpdateSchema = movimientoBaseSchema.partial();
export type MovimientoUpdate = z.infer<typeof movimientoUpdateSchema>;

export const aporteAhorroSchema = movimientoBaseSchema.omit({ tipo: true, categoria: true });
export type AporteAhorroInput = z.infer<typeof aporteAhorroSchema>;

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const miembroSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(60),
});
export type MiembroInput = z.infer<typeof miembroSchema>;

const TIPOS_DEUDA_VALUES = TIPOS_DEUDA.map((t) => t.value) as [string, ...string[]];

export const deudaSchema = z.object({
  miembroId: z.string().optional().nullable(),
  tipo: z.enum(TIPOS_DEUDA_VALUES, { required_error: "El tipo de deuda es requerido" }),
  descripcion: z.string().max(200).optional().nullable(),
  monto: z
    .number({
      required_error: "El monto es requerido",
      invalid_type_error: "Ingresa un número válido",
    })
    .positive("El monto debe ser mayor a 0"),
});
export type DeudaInput = z.infer<typeof deudaSchema>;

export const deudaUpdateSchema = deudaSchema.partial();
export type DeudaUpdate = z.infer<typeof deudaUpdateSchema>;
