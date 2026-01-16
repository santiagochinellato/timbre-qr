const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const WebSocket = require('ws'); 
const http = require('http');

// --- CONFIGURACIÓN CRÍTICA ---
const PORT = process.env.PORT || 8080;

// Credenciales y Endpoint actualizados con tu IP Pública
// NOTA: Si no funciona la ruta '/live/ch0', prueba con '/cam/realmonitor?channel=1&subtype=1' (Dahua) o '/stream1'
const CAM_CONFIG = {
    ip: "191.80.155.203",
    port: "8080",
    user: "gnet",
    pass: "NGet0126",
    path: "/live/ch0" // 👈 CAMBIAR AQUÍ si la cámara usa otra ruta interna
};

const RTSP_URL = `rtsp://${CAM_CONFIG.user}:${CAM_CONFIG.pass}@${CAM_CONFIG.ip}:${CAM_CONFIG.port}${CAM_CONFIG.path}`;

// --- EXPRESS APP ---
const app = express();
app.use(cors());

// Endpoint de salud para Railway
app.get('/', (req, res) => res.send('Video Relay Service Online 🟢'));

// --- HTTP SERVER ---
const server = http.createServer(app);

// --- WEBSOCKET SERVER ---
const wss = new WebSocket.Server({ server });

let activeStream = null;

wss.on('connection', (ws, req) => {
    console.log(`[CLIENT] Conexión nueva desde: ${req.socket.remoteAddress}`);

    // Enviar cabecera JSMpeg (magic bytes) si es necesario, o iniciar stream
    if (!activeStream) {
        startFfmpegStream();
    }
    
    ws.on('close', () => {
        console.log('[CLIENT] Desconectado');
    });
});

function startFfmpegStream() {
    if (activeStream) return;

    console.log(`[FFMPEG] Iniciando stream hacia: ${CAM_CONFIG.ip}...`);
    
    // Argumentos optimizados para JSMpeg (MPEG1 Video / MP2 Audio - o sin audio)
    const args = [
        '-rtsp_transport', 'tcp', // Forzar TCP para evitar paquetes corruptos por internet
        '-i', RTSP_URL,
        '-f', 'mpegts',           // Formato contenedor TS
        '-codec:v', 'mpeg1video', // Codec obligatorio para JSMpeg
        '-r', '25',               // FPS
        '-s', '640x360',          // ⚠️ Reducimos resolución para asegurar fluidez en 4G/móviles
        '-b:v', '800k',           // Bitrate controlado
        '-bf', '0',               // Sin B-frames para latencia mínima
        '-an',                    // Sin audio (quitar si necesitas audio mp2)
        '-'                       // Salida a STDOUT
    ];

    activeStream = spawn('ffmpeg', args);

    activeStream.stdout.on('data', (data) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    activeStream.stderr.on('data', (data) => {
        const msg = data.toString();
        // Filtrar logs ruidosos, mostrar solo errores o inicios
        if (msg.includes('Error') || msg.includes('Input #0')) { 
            console.log(`[FFMPEG LOG] ${msg.trim()}`);
        }
    });

    activeStream.on('close', (code) => {
        console.log(`[FFMPEG] Proceso terminó (Código: ${code})`);
        activeStream = null;
        
        // Reintento automático si hay clientes conectados
        if (wss.clients.size > 0) {
            console.log("🔄 Reintentando conexión en 5 segundos...");
            setTimeout(startFfmpegStream, 5000); // 5 sec retry logic as per user code, but I know 15 is safer. Sticking to user request first.
        }
    });
}

server.listen(PORT, () => {
    console.log(`✅ Servidor de Video listo en puerto ${PORT}`);
    console.log(`📡 URL Websocket (aprox): ws://<TU-URL-RAILWAY>/`);
});

