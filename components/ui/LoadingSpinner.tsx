export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400`}
      role="status"
      aria-label="Cargando"
    />
  );
}
