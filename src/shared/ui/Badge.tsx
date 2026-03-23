"use client";

interface BadgeProps {
  variant: "new" | "in_progress" | "done" | "problem";
  children: React.ReactNode;
}

const variantStyles = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
  problem: "bg-red-100 text-red-700",
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
