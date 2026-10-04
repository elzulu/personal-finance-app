"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
type LoginInput = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  name: z.string().optional(),
});
type RegisterInput = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function handleLogin(data: LoginInput) {
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Email o contraseña incorrectos");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleRegister(data: RegisterInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al registrarse");
        setLoading(false);
        return;
      }
      // Auto-login after register
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      router.push("/");
      router.refresh();
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  const tab = (active: boolean) =>
    `flex-1 min-h-11 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
      active ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <main className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 text-xl font-bold shadow-lg shadow-cyan-500/20">
            $
          </div>
          <h1 className="text-2xl font-bold text-white">Finanzas Personales</h1>
          <p className="text-slate-400 text-sm mt-1">Control de ingresos y egresos</p>
        </div>

        <div className="bg-slate-900/70 rounded-2xl shadow-lg shadow-black/20 border border-slate-800 backdrop-blur-sm p-6">
          {/* Pestañas */}
          <div role="tablist" aria-label="Acceso" className="flex rounded-lg bg-slate-950/60 p-1 mb-6">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={tab(mode === "login")}
            >
              Ingresar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={tab(mode === "register")}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-4 p-3 bg-rose-400/10 border border-rose-400/20 text-rose-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4" noValidate>
              <Input
                label="Email"
                {...loginForm.register("email")}
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                error={loginForm.formState.errors.email?.message}
              />
              <Input
                label="Contraseña"
                {...loginForm.register("password")}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={loginForm.formState.errors.password?.message}
              />
              <Button type="submit" size="lg" fullWidth loading={loading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4" noValidate>
              <Input
                label="Nombre (opcional)"
                {...registerForm.register("name")}
                type="text"
                autoComplete="name"
                placeholder="Tu nombre"
              />
              <Input
                label="Email"
                {...registerForm.register("email")}
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                error={registerForm.formState.errors.email?.message}
              />
              <Input
                label="Contraseña"
                {...registerForm.register("password")}
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                error={registerForm.formState.errors.password?.message}
              />
              <Button type="submit" size="lg" fullWidth loading={loading}>
                {loading ? "Registrando..." : "Crear cuenta"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
