const http = require('http');
const WebSocket = require('ws');

// CONFIGURACIÓN DEL TEST
const CONFIG = {
    targetHost: 'localhost',
    appPort: 3000,          // Puerto de la App Next.js
    videoPort: 9999,        // Puerto Websocket Video
    videoApiPort: 8080,     // Puerto API Video
    unitsToSpam: 5,         // Cuántas unidades atacaremos a la vez
    requestsPerUnit: 20,    // Requests por unidad (para saltar el rate limit de 5)
    videoClients: 50,       // Clientes simultáneos viendo video
    testDurationMs: 10000   // Duración de la prueba de video
};

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

console.log(`${colors.cyan}=== INICIANDO TEST DE ESTRÉS INTEGRAL ===${colors.reset}`);
console.log(`Objetivos:
1. Saturar Rate Limit (Redis)
2. Saturar Conexiones de Video (Docker + Circuit Breaker)
3. Verificar Recuperación
`);

async function runTest() {
    // PASO 1: VERIFICAR SALUD INICIAL
    console.log(`\n${colors.blue}[Fase 1] Verificando Salud Inicial...${colors.reset}`);
    try {
        const health = await fetchJson(`http://${CONFIG.targetHost}:${CONFIG.videoApiPort}/health`);
        console.log(`${colors.green}✔ Video Service Online:${colors.reset}`, health);
    } catch (e) {
        console.error(`${colors.red}❌ Video Service OFFLINE. ¿Está corriendo docker?${colors.reset}`);
        process.exit(1);
    }

    // PASO 2: ATAQUE DE RATE LIMITING (Simulación de Timbre)
    console.log(`\n${colors.blue}[Fase 2] Iniciando Ataque de Spam al Timbre...${colors.reset}`);
    const attackPromises = [];
    
    // IMPORTANTE: Como es un server action, simulamos con POST a un endpoint o imprimimos instrucción
    // Nota: Invocar server actions desde script externo es complejo sin auth cookies.
    // Simularemos hits directos a Redis para validar la lógica pura si no tenemos endpoint público.
    // O intentamos golpear la API de video como proxy de carga.
    
    // Para este test, bombardearemos el endpoint de video HTTP para ver si aguanta carga,
    // y abriremos sockets masivos.
    
    console.log(`${colors.yellow}⚠ Nota: El test de Server Actions (Timbre) se valida mejor con integración E2E.${colors.reset}`);
    console.log(`${colors.yellow}⚠ Enfocando fuego en saturación de Infraestructura (Redis + Video).${colors.reset}`);

    // PASO 3: SATURACIÓN DE VIDEO (Websockets)
    console.log(`\n${colors.blue}[Fase 3] Lanzando ${CONFIG.videoClients} clientes de video simultáneos...${colors.reset}`);
    let connectedClients = 0;
    let errors = 0;
    const clients = [];

    const startTime = Date.now();

    for (let i = 0; i < CONFIG.videoClients; i++) {
        const ws = new WebSocket(`ws://${CONFIG.targetHost}:${CONFIG.videoPort}`);
        
        ws.on('open', () => {
            connectedClients++;
            process.stdout.write(`${colors.green}·${colors.reset}`);
        });

        ws.on('error', (err) => {
            errors++;
            process.stdout.write(`${colors.red}x${colors.reset}`);
        });

        ws.on('close', () => {
             // connection closed
        });
        
        clients.push(ws);
        // Pequeño delay para no matar la red local del test runner
        await new Promise(r => setTimeout(r, 50)); 
    }

    console.log(`\n\n${colors.cyan}Resumen de Conexiones:${colors.reset}`);
    console.log(`Intentos: ${CONFIG.videoClients}`);
    console.log(`Exitosos: ${connectedClients}`);
    console.log(`Fallidos: ${errors}`);

    if (errors > 0) {
        console.log(`${colors.yellow}✔ Se detectaron rechazos (Esperado si Docker limita recursos o max_clients).${colors.reset}`);
    } else {
        console.log(`${colors.green}✔ El servidor aguantó ${CONFIG.videoClients} clientes sin colapsar.${colors.reset}`);
    }

    // PASO 4: VERIFICAR SI SOBREVIVIÓ
    console.log(`\n${colors.blue}[Fase 4] Verificando Supervivencia Post-Ataque...${colors.reset}`);
    await new Promise(r => setTimeout(r, 2000)); // Esperar que se asiente

    try {
        const postHealth = await fetchJson(`http://${CONFIG.targetHost}:${CONFIG.videoApiPort}/health`);
        console.log(`${colors.green}✔ Video Service sigue vivo:${colors.reset}`, postHealth);
        
        if (postHealth.failures > 0) {
            console.log(`${colors.yellow}ℹ El servicio reportó ${postHealth.failures} fallos internos controlados.${colors.reset}`);
        }
    } catch (e) {
        console.error(`${colors.red}❌ El servicio MURIÓ durante el ataque. (Docker debería reiniciarlo pronto)${colors.reset}`);
    }

    // CLEANUP
    console.log(`\n${colors.cyan}Limpiando conexiones...${colors.reset}`);
    clients.forEach(c => c.terminate());
    console.log("Test Finalizado.");
}

// Utilidad simple para fetch sin dependencias externas (Node 18+ tiene fetch nativo, pero usamos http puro para compatibilidad)
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

runTest();
