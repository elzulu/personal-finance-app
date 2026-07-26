"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

  const inputClass =
    "w-full px-3 py-2.5 border border-slate-700 bg-slate-950/60 text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";
  const errorClass = "text-rose-400 text-xs mt-1";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 text-xl font-bold shadow-lg shadow-cyan-500/20">
            $
          </div>
          <h1 className="text-2xl font-bold text-white">Finanzas Personales</h1>
          <p className="text-slate-400 text-sm mt-1">Control de ingresos y egresos</p>
        </div>

        <div className="bg-slate-900/70 rounded-2xl shadow-lg shadow-black/20 border border-slate-800 backdrop-blur-sm p-6">
          {/* Tabs */}
          <div className="flex rounded-lg bg-slate-950/60 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "register"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-400/10 border border-rose-400/20 text-rose-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  {...loginForm.register("email")}
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  placeholder="tu@email.com"
                />
                {loginForm.formState.errors.email && (
                  <p className={errorClass}>
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Contraseña</label>
                <input
                  {...loginForm.register("password")}
                  type="password"
                  autoComplete="current-password"
                  className={inputClass}
                  placeholder="••••••••"
                />
                {loginForm.formState.errors.password && (
                  <p className={errorClass}>
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-lg text-sm font-semibold transition-all"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div>
                <label className={labelClass}>Nombre (opcional)</label>
                <input
                  {...registerForm.register("name")}
                  type="text"
                  autoComplete="name"
                  className={inputClass}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  {...registerForm.register("email")}
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  placeholder="tu@email.com"
                />
                {registerForm.formState.errors.email && (
                  <p className={errorClass}>
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Contraseña</label>
                <input
                  {...registerForm.register("password")}
                  type="password"
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Mínimo 8 caracteres"
                />
                {registerForm.formState.errors.password && (
                  <p className={errorClass}>
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 disabled:opacity-50 text-slate-950 rounded-lg text-sm font-semibold transition-all"
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
