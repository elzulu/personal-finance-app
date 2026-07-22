# Finanzas Personales

App web para reemplazar el Excel de control de ingresos y egresos. Registra movimientos desde el celular, visualiza el saldo del mes en tiempo real, compara presupuesto vs. real y analiza tendencias por categoría.

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Base de datos**: PostgreSQL via Neon o Vercel Postgres
- **ORM**: Prisma
- **Auth**: NextAuth.js (Credentials: email + password)
- **Estilos**: Tailwind CSS
- **Gráficas**: Recharts
- **Formularios**: React Hook Form + Zod

## Instalación local

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repo>
cd personal-finance-app
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
DATABASE_URL="postgresql://user:password@host:5432/personal_finance?schema=public"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**Para generar `NEXTAUTH_SECRET`:**
```bash
openssl rand -base64 32
```

### 3. Crear la base de datos

```bash
# Genera el cliente Prisma
npm run db:generate

# Crea las tablas (primera vez)
npm run db:migrate
# Escribe un nombre para la migración, ej: "init"

# O en produccion / Vercel usa db push:
# npm run db:push
```

### 4. (Opcional) Cargar datos de ejemplo

```bash
npm run db:seed
```

Crea el usuario `demo@finanzas.com` / `password123` con 5 meses de movimientos de ejemplo.

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Comandos disponibles

| Comando | Descripcion |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion |
| `npm run db:migrate` | Crear migracion nueva |
| `npm run db:push` | Aplicar schema sin migracion (Vercel) |
| `npm run db:seed` | Cargar datos de ejemplo |
| `npm run db:studio` | Abrir Prisma Studio |

---

## Deploy en Vercel

### Paso 1: Conectar el repo

1. Sube el repo a GitHub
2. En [vercel.com](https://vercel.com), crea un nuevo proyecto y conecta el repo
3. Vercel detecta Next.js automaticamente

### Paso 2: Base de datos

**Opcion A - Neon (recomendado):**
1. Crea una cuenta en [neon.tech](https://neon.tech)
2. Crea una base de datos
3. Copia la connection string (formato: `postgresql://...`)

**Opcion B - Vercel Postgres:**
1. En el dashboard de Vercel, ve a Storage > Create Database
2. Selecciona Postgres
3. Las variables se agregan automaticamente al proyecto

### Paso 3: Variables de entorno en Vercel

En Settings > Environment Variables, agrega:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Tu connection string de PostgreSQL |
| `NEXTAUTH_SECRET` | Resultado de `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Tu URL de Vercel, ej: `https://tu-app.vercel.app` |

### Paso 4: Aplicar el schema en produccion

En Vercel, ve a tu proyecto > Settings > Functions y agrega en Build Command:
```
prisma generate && prisma db push && next build
```

O en el panel de Neon/Postgres ejecuta directamente:
```bash
DATABASE_URL="tu-url-de-produccion" npm run db:push
```

### Que falta configurar manualmente antes del primer deploy

1. **Crear la base de datos** en Neon o Vercel Postgres
2. **Agregar las 3 variables de entorno** en el panel de Vercel (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
3. El build command ya incluye `prisma generate` en `package.json > scripts.build`, por lo que las tablas se crean automaticamente con `db push` en el primer deploy si lo incluyes en el build command

---

## Modelo de datos

### Categorias por tipo

| Tipo | Categorias |
|---|---|
| INGRESO | Sueldo, Negocio, Otro |
| EGRESO | Servicios, Gastos, Deudas, Ahorro |

### Formato de montos

Todos los montos se muestran en pesos colombianos (COP) sin decimales.

---

## Funcionalidades

- Registro rapido de movimientos (optimizado para movil)
- Dashboard mensual con selector de mes
- Tarjetas de ingresos, egresos y saldo con semaforo visual
- Presupuesto vs. real por categoria con barras de progreso
- Grafica de torta: gastos por categoria
- Grafica de barras: evolucion mensual (ultimos 12 meses)
- Top 5 conceptos con mayor gasto
- Tabla de movimientos filtrable y ordenable con paginacion
- Edicion y eliminacion de registros
- Exportacion a CSV con BOM (compatible con Excel)
- Autenticacion email + password
