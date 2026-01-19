const express = require('express');
const Stream = require('./custom-rtsp-stream/videoStream');
const app = require('express')();
const server = require('http').createServer(app);

// CONFIGURACIÓN ROBUSTA
const CONFIG = {
    // En Railway, el puerto público se inyecta en PORT. Lo usaremos para el WebSocket (Video).
    wsPort: process.env.PORT || 9999,
    // El puerto HTTP DEBE usar process.env.PORT para que Railway enrute el tráfico correctamente
    httpPort: process.env.PORT || 3001,
    rtspUrl: process.env.RTSP_URL,
    circuitBreaker: {
        failureThreshold: 3,    // Máximo fallos seguidos
        cooldownMs: 30000,      // Tiempo de espera (30s) si se abre el circuito
        resetTimeoutMs: 60000   // Tiempo para resetear contador si todo va bien
    }
};

class StreamManager {
    constructor() {
        this.stream = null;
        this.failures = 0;
        this.state = 'IDLE'; // IDLE, STREAMING, COOLDOWN
        this.cooldownTimer = null;
        this.lastFailure = null;
    }

    log(level, message, data = {}) {
        // Logging Estructurado (JSON) para producción
        // En entorno local (no-json) podemos hacerlo más legible si se quiere
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            state: this.state,
            failures: this.failures,
            ...data
        }));
    }

    start() {
        if (this.state === 'COOLDOWN') {
            const remaining = Math.ceil((this.cooldownTimer - Date.now()) / 1000);
            this.log('WARN', `Circuit Breaker ABIERTO. Ignorando solicitud. Espera ${remaining}s.`);
            return;
        }

        if (this.state === 'STREAMING') {
            this.log('INFO', 'Stream ya activo. Reutilizando.');
            return;
        }

        if (!CONFIG.rtspUrl) {
            this.log('ERROR', 'No RTSP_URL provided');
            return;
        }

        try {
            this.log('INFO', 'Iniciando proceso FFmpeg...');
            
            this.stream = new Stream({
                name: 'timbre-qr-stream',
                streamUrl: CONFIG.rtspUrl,
                server: server, // Attach to main HTTP server (Port 8080/Railway PORT)
                ffmpegOptions: {
                    '-stats': '', 
                }
            });

            this.state = 'STREAMING';

            // node-rtsp-stream no expone un evento 'exit' claro del proceso ffmpeg
            // confiamos en que Docker reinicie si el proceso principal de node muere,
            // pero internamente, si el stream falla, la librería suele intentar reconectar o lanzar error.
            
        } catch (error) {
            this.handleFailure(error);
        }
    }

    stop() {
        if (this.stream) {
            // La librería node-rtsp-stream a veces no limpia bien
            try {
                this.stream.stop();
            } catch (e) {
                this.log('WARN', 'Error stopping stream', { error: e.message });
            }
            this.stream = null;
            this.state = 'IDLE';
            this.log('INFO', 'Stream detenido manualmente.');
        }
    }

    handleFailure(err) {
        this.failures++;
        this.lastFailure = Date.now();
        this.stop(); // Limpieza forzosa

        this.log('ERROR', 'Fallo detectado en Stream', { error: err.message });

        if (this.failures >= CONFIG.circuitBreaker.failureThreshold) {
            this.openCircuit();
        } else {
            // Reintento rápido (backoff simple)
            const delay = 2000 * this.failures;
            this.log('INFO', `Reintentando en ${delay}ms...`);
            setTimeout(() => this.start(), delay);
        }
    }

    openCircuit() {
        this.state = 'COOLDOWN';
        this.cooldownTimer = Date.now() + CONFIG.circuitBreaker.cooldownMs;
        this.log('CRITICAL', '⚠️ CIRCUIT BREAKER ACTIVADO. Pausando intentos de video.', {
            reason: 'Umbral de fallos excedido'
        });

        setTimeout(() => {
            this.log('INFO', 'Circuit Breaker: Enfriamiento terminado. Estado: HALF-OPEN');
            this.failures = 0;
            this.state = 'IDLE';
            // Auto-retomar intentando reiniciar
            this.start();
        }, CONFIG.circuitBreaker.cooldownMs);
    }
}

const manager = new StreamManager();

// API simple para healthcheck y control
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        videoState: manager.state, 
        failures: manager.failures 
    });
});

// Arrancar servidor HTTP auxiliar
server.listen(CONFIG.httpPort, () => {
    console.log(`Video Service Control API running on port ${CONFIG.httpPort}`);
    // Iniciar stream automáticamente al arrancar el contenedor
    manager.start();
});

// Manejo de señales para evitar procesos zombies en Docker
process.on('SIGTERM', () => {
    manager.stop();
    process.exit(0);
});
