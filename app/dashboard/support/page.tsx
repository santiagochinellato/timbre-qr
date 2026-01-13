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
          <h1 className="text-2xl font-bold text-white">Centro de Ayuda</h1>
          <p className="text-zinc-400">
            Encuentra respuestas, manuales y soporte técnico en un solo lugar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: FAQ & Manual */}
        <div className="lg:col-span-1 space-y-8">
          {/* Section 1: FAQ */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
            <FAQAccordion />
          </div>

          {/* Section 2: User Manual */}
          <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Book className="w-6 h-6 text-amber-400" />
              <h3 className="text-lg font-bold text-white">
                Manual de Usuario
              </h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Descargue el manual completo para aprender a utilizar todas las
              funcionalidades del sistema.
            </p>
            <button className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-white/5">
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
