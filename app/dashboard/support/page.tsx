import { FAQAccordion } from "@/components/support/faq-accordion";
import { SupportChat } from "@/components/support/support-chat";
import { Book, LifeBuoy } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
          <LifeBuoy className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-main">Centro de Ayuda</h1>
          <p className="text-text-muted">
            Encuentra respuestas, manuales y soporte técnico en un solo lugar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: FAQ & Manual */}
        <div className="lg:col-span-1 space-y-8">
          {/* Section 1: FAQ */}
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 shadow-sm">
            <FAQAccordion />
          </div>

          {/* Section 2: User Manual */}
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Book className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-text-main">
                Manual de Usuario
              </h3>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Descargue el manual completo para aprender a utilizar todas las
              funcionalidades del sistema.
            </p>
            <button className="w-full py-3 px-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-text-main rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-border-subtle">
              <Book className="w-4 h-4" />
              Descargar PDF
            </button>
          </div>
        </div>

        {/* Right Column: Chat */}
        <div className="lg:col-span-2">
          <SupportChat />
        </div>
      </div>
    </div>
  );
}
