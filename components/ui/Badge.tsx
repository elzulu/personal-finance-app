interface BadgeProps {
  children: React.ReactNode;
  variant?: "ingreso" | "egreso" | "neutral";
}

const variants = {
  ingreso: "bg-emerald-400/10 text-emerald-400 ring-1 ring-inset ring-emerald-400/20",
  egreso: "bg-rose-400/10 text-rose-400 ring-1 ring-inset ring-rose-400/20",
  neutral: "bg-slate-400/10 text-slate-300 ring-1 ring-inset ring-slate-400/20",
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
