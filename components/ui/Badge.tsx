interface BadgeProps {
  children: React.ReactNode;
  variant?: "ingreso" | "egreso" | "neutral";
}

const variants = {
  ingreso: "bg-green-100 text-green-700",
  egreso: "bg-red-100 text-red-700",
  neutral: "bg-gray-100 text-gray-700",
};

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
