"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { AlertCircle, CheckCircle, Play, Square, Terminal } from "lucide-react";

declare global {
  interface Window {
    JSMpeg: any;
  }
}

export default function CameraTestPage() {
  const [url, setUrl] = useState("wss://timbre-qr-production.up.railway.app");
  const [logs, setLogs] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "connected" | "error" | "closed"
  >("idle");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const testConnection = () => {
    if (!url) return;
    setConnectionStatus("connecting");
    addLog(`Testing connection to: ${url}`);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setConnectionStatus("connected");
        addLog("✅ WebSocket Connection Opened!");
        ws.close();
      };

      ws.onerror = (e) => {
        setConnectionStatus("error");
        addLog("❌ WebSocket Error. Check console for details.");
        console.error("WS Test Error:", e);
      };

      ws.onclose = (e) => {
        if (connectionStatus !== "error") {
          setConnectionStatus("closed");
        }
        addLog(
          `WebSocket connection closed. Code: ${e.code}, Reason: ${e.reason}`
        );
      };
    } catch (e: any) {
      setConnectionStatus("error");
      addLog(`❌ Exception: ${e.message}`);
    }
  };

  const startStream = () => {
    if (!url || !canvasRef.current || !window.JSMpeg) {
      addLog("Cannot start stream: Missing URL, Canvas, or JSMpeg library.");
      return;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    addLog(`Starting JSMpeg player...`);
    setIsPlaying(true);

    try {
      playerRef.current = new window.JSMpeg.Player(url, {
        canvas: canvasRef.current,
        autoplay: true,
        audio: false,
        onVideoDecode: () => {
          addLog("🎥 Video Frame Decoded!");
        },
        onPlay: () => {
          addLog("▶️ Player Started");
        },
        onPause: () => {
          addLog("⏸️ Player Paused");
        },
        onEnded: () => {
          addLog("⏹️ Player Ended");
        },
        onStalled: () => {
          addLog("⚠️ Player Stalled (No Data?)");
        },
      });
    } catch (e: any) {
      addLog(`❌ Player Init Error: ${e.message}`);
      setIsPlaying(false);
    }
  };

  const stopStream = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setIsPlaying(false);
    addLog("Player stopped manually.");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 text-white min-h-screen bg-black font-sans">
      <Script
        src="https://cdn.jsdelivr.net/gh/phoboslab/jsmpeg@master/jsmpeg.min.js"
        strategy="afterInteractive"
        onLoad={() => addLog("📚 JSMpeg Library Loaded")}
      />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white">
          Herramienta de Diagnóstico de Cámara
        </h1>
        <p className="text-zinc-400">
          Usa esta herramienta para verificar si tu dispositivo puede conectarse
          al servidor de video.
        </p>
      </div>

      {/* URL Input */}
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-4">
        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500">
          WebSocket URL (Railway)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 font-mono text-sm focus:border-blue-500 outline-none transition-colors"
            placeholder="wss://..."
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={testConnection}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
          >
            {connectionStatus === "connecting" ? (
              <span className="w-4 h-4 rounded-full border-2 border-zinc-500 border-t-white animate-spin" />
            ) : (
              <Terminal className="w-4 h-4" />
            )}
            Probar Conexión
          </button>

          <div className="flex-1 flex items-center justify-end gap-2 text-sm">
            Status:
            <span
              className={`font-bold uppercase ${
                connectionStatus === "connected"
                  ? "text-green-500"
                  : connectionStatus === "error"
                  ? "text-red-500"
                  : connectionStatus === "connecting"
                  ? "text-yellow-500"
                  : "text-zinc-500"
              }`}
            >
              {connectionStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Player */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-zinc-400">
              Vista Previa
            </h3>
            <div className="flex gap-2">
              <button
                onClick={startStream}
                disabled={isPlaying}
                className="p-2 bg-green-900/30 text-green-500 rounded hover:bg-green-900/50 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={stopStream}
                disabled={!isPlaying}
                className="p-2 bg-red-900/30 text-red-500 rounded hover:bg-red-900/50 disabled:opacity-50"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="aspect-video bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden relative flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                <span className="text-xs uppercase font-bold">
                  Player Inactivo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Logs Console */}
        <div className="space-y-4 flex flex-col h-full">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-zinc-400">
              Logs del Sistema
            </h3>
            <button
              onClick={() => setLogs([])}
              className="text-[10px] text-zinc-500 hover:text-white"
            >
              LIMPIAR
            </button>
          </div>
          <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 overflow-y-auto max-h-[300px] flex flex-col-reverse">
            {logs.length === 0 && (
              <span className="opacity-30 italic">Esperando eventos...</span>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                className="mb-1 border-b border-white/5 pb-1 last:border-0 last:pb-0"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
