"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Bot, User } from "lucide-react";
import { toast } from "sonner";

export function SupportChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "agent",
      text: "¡Hola! Soy el asistente de soporte. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      role: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // Simulate response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "agent",
          text: "Gracias por tu mensaje. Un técnico revisará tu consulta en breve.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      toast.success("Imagen adjuntada (Simulación)");
      // Here we would handle the real upload
    }
  };

  return (
    <div className="flex flex-col h-[500px] lg:h-[600px] bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-zinc-900/80 backdrop-blur flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white">Soporte Técnico</h3>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En línea
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user"
                  ? "bg-zinc-700 text-white"
                  : "bg-cyan-500/10 text-cyan-400"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-cyan-600 text-white rounded-tr-sm"
                  : "bg-zinc-800 text-zinc-200 rounded-tl-sm border border-white/5"
              }`}
            >
              <p>{msg.text}</p>
              <span className="text-[10px] opacity-50 mt-1 block">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/80 backdrop-blur">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-zinc-800/50 border border-white/5 rounded-xl px-4 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-zinc-600"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
