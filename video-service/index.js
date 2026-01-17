const express = require('express');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const http = require('http');

// --- CONFIGURACIÓN ---
const PORT = process.env.PORT || 8080;

// La URL RTSP viene de las variables de entorno de Railway
// Formato esperado: rtsp://admin:Univers0@186.0.212.50:2000/cam/realmonitor?channel=1&subtype=0
const RTSP_URL = process.env.RTSP_STREAM_URL;

if (!RTSP_URL) {
    console.error("❌ ERROR CRÍTICO: Falta la variable de entorno RTSP_STREAM_URL");
    process.exit(1);
}

const app = express();

// Endpoint de salud para que Railway sepa que estamos vivos
app.get('/', (req, res) => res.send('Video Relay Service Online 🟢'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let ffmpegProcess = null;

// --- FUNCIÓN DE STREAMING ---
function startFfmpeg() {
    if (ffmpegProcess) return;

    console.log(`[FFMPEG] 🎬 Iniciando conversión de stream...`);
    // Mask password in logs
    const safeUrl = RTSP_URL.replace(/:[^:@]+@/, ':****@');
    console.log(`[FFMPEG] Target: ${safeUrl}`);

    const args = [
        '-rtsp_transport', 'tcp', // CRÍTICO: Usar TCP para evitar cortes por internet
        '-i', RTSP_URL,
        '-f', 'mpegts',           // Formato compatible con JSMpeg
        '-codec:v', 'mpeg1video', // Codec video
        '-r', '25',               // FPS fluidos
        '-s', '640x360',          // Resolución optimizada para móviles (ahorra ancho de banda)
        '-b:v', '1000k',          // Bitrate máximo 1mb
        '-bf', '0',               // Latencia cero
        '-an',                    // Sin audio (quitar si necesitas audio)
        '-'                       // Salida standard
    ];

    ffmpegProcess = spawn('ffmpeg', args);

    ffmpegProcess.on('error', (err) => {
        console.error('[FFMPEG ERROR] Failed to spawn process:', err);
    });

    ffmpegProcess.stdout.on('data', (data) => {
        // Broadcast a todos los clientes conectados
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(data);
                } catch (e) {
                    console.error('[WS ERROR] Send failed:', e);
                }
            }
        });
    });

    ffmpegProcess.stderr.on('data', (data) => {
        const msg = data.toString();
        // Log all FFmpeg output to debug startup issues
        if (process.env.DEBUG_FFMPEG || msg.includes('Error') || msg.includes('fail') || msg.includes('panic')) {
            console.log(`[FFMPEG LOG] ${msg.trim()}`);
        }
    });

    ffmpegProcess.on('close', (code) => {
        console.log(`[FFMPEG] 🛑 Proceso terminó (Código: ${code})`);
        ffmpegProcess = null;
        // Reiniciar automáticamente si hay clientes esperando
        if (wss.clients.size > 0) {
            console.log("🔄 Reintentando en 2 segundos...");
            setTimeout(startFfmpeg, 2000);
        }
    });
}

// --- GESTIÓN DE WEBSOCKETS ---
wss.on('connection', (ws, req) => {
    console.log(`[CLIENTE] 👋 Nueva conexión desde ${req.socket.remoteAddress}`);
    
    // Si es el primer cliente, arrancamos FFmpeg
    if (!ffmpegProcess) {
        startFfmpeg();
    }

    ws.on('close', () => {
        console.log('[CLIENTE] 🔌 Desconectado');
        // Opcional: Si no quedan clientes, matar FFmpeg para ahorrar CPU en Railway
        if (wss.clients.size === 0 && ffmpegProcess) {
            console.log("[AHORRO] 💤 Sin clientes, apagando FFmpeg...");
            ffmpegProcess.kill('SIGINT');
            ffmpegProcess = null;
        }
    });
});

server.listen(PORT, () => {
    console.log(`✅ Servidor de Video listo en puerto ${PORT}`);
});
