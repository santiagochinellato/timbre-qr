"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "¿Cómo puedo cambiar mi contraseña?",
    answer:
      "Para cambiar su contraseña, diríjase a la sección 'Perfil' en el menú lateral. Allí encontrará la opción para actualizar sus credenciales de seguridad.",
  },
  {
    question: "¿Cómo creo una invitación para una visita?",
    answer:
      "Si tiene permisos de administrador o propietario, puede ir a la sección 'Configuración' (Admin) o usar la funcionalidad de Invitados en su panel principal para generar accesos temporales.",
  },
  {
    question: "¿Qué hago si el timbre no funciona?",
    answer:
      "Verifique su conexión a internet. Si el problema persiste, utilice el chat de soporte técnico en esta misma página para reportar la incidencia con una foto del error si es posible.",
  },
  {
    question: "¿Puedo tener múltiples propiedades?",
    answer:
      "Sí, el sistema permite gestionar múltiples unidades. Contacte al administrador del consorcio para que asigne las nuevas unidades a su usuario.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-bold text-text-main">
          Preguntas Frecuentes
        </h3>
      </div>

      <div className="grid gap-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden transition-all duration-200 shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className="font-medium text-text-main">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              )}
            </button>

            {openIndex === index && (
              <div className="px-4 pb-4 pt-0 text-text-muted text-sm leading-relaxed border-t border-border-subtle mt-2 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
