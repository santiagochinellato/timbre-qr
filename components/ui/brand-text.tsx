import React from "react";
import { cn } from "@/lib/utils";

interface BrandTextProps {
  className?: string;
  as?: React.ElementType; // Te permite cambiar la etiqueta HTML (h1, h2, span, etc.)
}

export const BrandText = ({
  className = "",
  as: Component = "span", // Por defecto es un <span>
}: BrandTextProps) => {
  // La "Fórmula Secreta" de estilos
  const baseStyles = "font-sans font-bold tracking-tighter select-none";

  return <Component className={cn(baseStyles, className)}>Llegue!</Component>;
};
