# CLAUDE.md — personal-finance-app

Instrucciones y contexto para Claude Code. Leer siempre antes de tocar el proyecto.

---

## Stack

- **Next.js 14.2.35** (App Router) + TypeScript
- **PostgreSQL / Neon** + Prisma 5
- **NextAuth v4** — Credentials (email + password)
- **Tailwind CSS** + Recharts v3 + React Hook Form + Zod
- **Vitest 4.x** — tests unitarios e integración

---

## Comandos clave

```bash
npm run dev          # Desarrollo local
npm test             # Vitest (57 tests)
npm run test:watch   # Vitest en modo watch
npm run build        # prisma generate && next build
npm run db:push      # Aplicar schema a la DB (requiere .env.local con DATABASE_URL)
npm run db:seed      # Seed de demo (demo@finanzas.com / password123)
npm run lint         # ESLint
```

Para `db:push` desde la terminal bash en Windows, cargar el `.env.local` primero:
```bash
set -a && source .env.local && set +a && npx prisma db push
```

---

## Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `prisma/schema.prisma` | Modelos: User, Movimiento, Miembro, Deuda |
| `lib/types.ts` | Enum `Tipo` client-safe — NO importar de `@prisma/client` en componentes cliente |
| `lib/categorias.ts` | `CATEGORIAS_POR_TIPO` — fuente de verdad de categorías |
| `lib/tiposDeuda.ts` | `TIPOS_DEUDA` con labels/icons del enum TipoDeuda |
| `lib/validations.ts` | Zod schemas: movimientoSchema, deudaSchema, aporteAhorroSchema |
| `lib/formatters.ts` | `formatCOP`, `formatDate`, `toInputDate` |
| `lib/auth.ts` | NextAuth authOptions |
| `middleware.ts` | Protege todas las rutas excepto `/login`, `/api/auth`, `/api/register` |
| `next.config.mjs` | Config Next.js (`.mjs`, NO `.ts`) |
| `vitest.config.ts` | Config Vitest — environment: node, alias `@/` → raíz |

---

## Data model

### Enums
- `Tipo`: `INGRESO` | `EGRESO`
- `TipoDeuda`: `TARJETA_CREDITO` | `ADDI` | `SISTECREDITO` | `PRESTAMO_BANCARIO` | `OTRO`

### Categorías
- **INGRESO**: Sueldo, Negocio, Inversiones, Arriendo, Bonificaciones, Otro
- **EGRESO**: Vivienda, Servicios, Alimentación, Transporte, Salud, Educación, Entretenimiento, Ropa, Deudas, Ahorro, Tecnología, Familia, Otro

### Modelo Movimiento
Campos relevantes: `userId`, `miembroId?`, `deudaId?` (FK → Deuda, `onDelete: SetNull`), `fecha`, `tipo`, `categoria`, `concepto`, `monto`.

### Modelo Deuda
Campos relevantes: `userId`, `miembroId?`, `tipo: TipoDeuda`, `descripcion?`, `monto` (saldo actual), `pagado: Boolean`.

**Regla:** `monto` en Deuda siempre refleja el saldo pendiente real. Se actualiza automáticamente via transacciones cuando se crea/edita/elimina un Movimiento con `deudaId`.

---

## Sincronización Finanzas ↔ Deudas

Cuando un `Movimiento` con `categoria="Deudas"` tiene un `deudaId`:
- **POST**: descuenta `movimiento.monto` de `Deuda.monto` en transacción
- **PATCH**: restaura el efecto anterior y aplica el nuevo delta en transacción
- **DELETE**: restaura `movimiento.monto` al saldo de la Deuda en transacción
- Si `Deuda.monto` llega a 0 → `pagado = true` automáticamente
- Toda la lógica vive en los API routes (backend), nunca en el frontend

---

## Convenciones de código

- Comentarios en **español**
- Moneda: **COP**, siempre positiva (`tipo` lleva el signo)
- `mes` derivado de `fecha` (no campo separado)
- Componentes cliente: `"use client"` en primera línea
- No importar `Tipo`/`TipoDeuda` de `@prisma/client` en componentes cliente — usar `lib/types.ts`
- Validaciones Zod: `movimientoBaseSchema.partial()` para updates (NO `.refine().partial()`)
- API routes usan `prisma.$transaction()` cuando hay que modificar dos modelos a la vez

---

## Testing

- Runner: **Vitest** (`npm test`)
- Archivos en `__tests__/lib/` y `__tests__/api/`
- **57 tests, todos en verde**
- Patrón de mock para Prisma:
  ```ts
  const mockPrisma = vi.hoisted(() => ({ movimiento: {...}, deuda: {...}, $transaction: vi.fn() }))
  vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
  // En beforeEach:
  mockPrisma.$transaction.mockImplementation((fn) => fn(mockPrisma))
  ```
- **NO** usar `const mockX = {}` a nivel de módulo dentro de `vi.mock` factories — usar `vi.hoisted()`

---

## PWA (Android)

- `app/manifest.ts` — manifiesto generado por Next.js (auto-inyecta `<link rel="manifest">`)
- `public/sw.js` — service worker: network-first para `/api/*`, cache-first para `/_next/static/`
- `components/PwaRegistration.tsx` — registra el SW en el cliente
- `public/icons/icon.svg` + `icon-maskable.svg` — íconos SVG (Chrome 93+ Android)
- La app es instalable desde Chrome Android una vez desplegada en Vercel (HTTPS)

---

## Gotchas

- `next.config.mjs` debe ser `.mjs`, no `.ts` (Next.js 14 no soporta config `.ts`)
- Recharts v3: el `value` del Tooltip formatter es `ValueType | undefined` — castear con `typeof value === "number"`
- `prisma/seed.ts` usa categoría "Gastos" (legacy) que ya no es válida — no correr el seed en producción
- En Windows, matar el puerto 3000 requiere PowerShell: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess`
- Mezclar `next build` y `next dev` corrompe `.next/` — borrar la carpeta si hay errores raros de caché

---

## Deploy (Vercel)

1. DB en Neon o Vercel Postgres
2. Variables de entorno: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
3. Build command: `prisma generate && prisma db push && next build`
