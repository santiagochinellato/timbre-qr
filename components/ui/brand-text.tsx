import React from "react";

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

  return (
    <Component
      className={`${baseStyles} ${className}`}
      // Aseguramos que Geist Sans tenga prioridad si está configurada en tu layout
      style={{
        fontFamily:
          "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
        fontFeatureSettings: '"ss01", "cv02"',
      }}
    >
      Llegue!
    </Component>
  );
};
