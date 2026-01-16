const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const WebSocket = require('ws'); 
const http = require('http');

// --- CONFIG ---
const PORT = process.env.PORT || 8080;
const SECRET_KEY = "timbre_secret_123"; 
// Confirmed working URL - Dahua Substream
const RTSP_URL = process.env.RTSP_STREAM_URL || "rtsp://admin:Univer$0@186.0.212.50:9081/cam/realmonitor?channel=1&subtype=1";

// --- EXPRESS APP (SNAPSHOTS) ---
const app = express();
app.use(cors());

// --- HTTP SERVER ---
const server = http.createServer(app);

function captureSnapshot(url) {
    if (process.env.MOCK_CAMERA === "true") {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=\n", "base64"));
            }, 500);
        });
    }

    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-rtsp_transport', 'tcp',
            '-i', url,
            '-f', 'image2',
            '-vframes', '1',
            '-q:v', '5',
            'pipe:1'
        ]);

        let buffers = [];
        ffmpeg.stdout.on('data', (chunk) => buffers.push(chunk));
        ffmpeg.on('close', (code) => {
            if (code === 0 && buffers.length > 0) resolve(Buffer.concat(buffers));
            else reject(new Error(`FFmpeg exited with code ${code}`));
        });
        ffmpeg.on('error', (err) => reject(err));
        setTimeout(() => {
            if (ffmpeg.exitCode === null) {
                ffmpeg.kill('SIGKILL');
                reject(new Error('FFmpeg Timeout'));
            }
        }, 8000);
    });
}

// Simple cache
const cache = new Map();
app.get('/snapshot', async (req, res) => {
    const rtspUrl = req.query.url || RTSP_URL;
    
    // Check Cache
    const now = Date.now();
    const entry = cache.get(rtspUrl);
    if (entry && (now - entry.timestamp < 2000)) {
        res.set('Content-Type', 'image/jpeg');
        return res.send(entry.buffer);
    }

    try {
        const buffer = await captureSnapshot(rtspUrl);
        cache.set(rtspUrl, { timestamp: now, buffer });
        res.set('Content-Type', 'image/jpeg');
        res.send(buffer);
    } catch (err) {
        console.error("Snapshot error:", err.message);
        res.status(502).send("Camera Unreachable");
    }
});

// --- WEBSOCKET SERVER (ATTACHED TO SAME HTTP SERVER) ---
const maskedUrl = RTSP_URL.replace(/:([^:@]+)@/, ":****@");
console.log(`🚀 Starting Unified Server on port ${PORT} for ${maskedUrl}`);

const wss = new WebSocket.Server({ server });

let activeStream = null;

wss.on('connection', (ws, req) => {
    console.log(`[WS] New client connected from ${req.socket.remoteAddress}`);

    if (!activeStream) {
        startFfmpegStream();
    }
});

function startFfmpegStream() {
    console.log("[FFMPEG] Spawning process...");
    
    // Exact arguments that worked in manual verification
    const args = [
        '-rtsp_transport', 'tcp',
        '-i', RTSP_URL,
        '-f', 'mpegts',
        '-codec:v', 'mpeg1video',
        '-r', '25',
        '-s', '1280x720',
        '-b:v', '2000k',
        '-bf', '0',
        '-an', // No Audio
        '-'
    ];

    activeStream = spawn('ffmpeg', args);

    activeStream.stdout.on('data', (data) => {
        // Broadcast to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    activeStream.stderr.on('data', (data) => {
        const msg = data.toString();
        // Log startup messages or errors, ignore frequent frame stats to keep logs clean
        if (!msg.includes('frame=')) {
             console.error(`[FFMPEG Log] ${msg.trim()}`);
        }
    });

    activeStream.on('close', (code) => {
        console.log(`[FFMPEG] Process exited with code ${code}`);
        activeStream = null;
        // Auto-restart if clients exist
        if (wss.clients.size > 0) {
            setTimeout(startFfmpegStream, 2000);
        }
    });
}

// Start the Shared Server
server.listen(PORT, () => {
    console.log(`✅ Server (API + WS) listening on port ${PORT}`);
});

