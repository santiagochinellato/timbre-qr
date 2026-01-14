const express = require('express');
const { spawn } = require('child_process');
const app = express();

// --- CONFIGURATION ---
const PORT = process.env.PORT || 8080;
// Note: In production you MUST set VIDEO_SECRET_KEY
const SECRET_KEY = process.env.VIDEO_SECRET_KEY || "dev-secret"; 

// --- CACHE IN MEMORY ---
// Map<RTSP_URL, { buffer: Buffer|null, timestamp: number, pendingPromise: Promise|null }>
const cache = new Map();
const CACHE_TTL_MS = 2000; // 2 seconds cache duration

app.get('/health', (req, res) => {
    res.send('OK');
});

/**
 * GET /snapshot
 * Query Params: ?url=<RTSP_URL>
 * Headers: x-api-key: <SECRET_KEY>
 */
app.get('/snapshot', async (req, res) => {
    const rtspUrl = req.query.url;
    const apiKey = req.headers['x-api-key'];

    // 1. Security Check
    if (apiKey !== SECRET_KEY) {
        console.warn(`[AUTH FAIL] IP: ${req.ip}`);
        return res.status(401).send('Unauthorized');
    }
    if (!rtspUrl) {
        return res.status(400).send('Missing "url" query parameter');
    }

    const now = Date.now();
    let cachedEntry = cache.get(rtspUrl);

    // 2. CHECK CACHE (HIT)
    if (cachedEntry && cachedEntry.buffer && (now - cachedEntry.timestamp < CACHE_TTL_MS)) {
        console.log(`⚡ HIT: ${rtspUrl.slice(-15)}`);
        res.set('Content-Type', 'image/jpeg');
        res.set('X-Cache-Status', 'HIT');
        return res.send(cachedEntry.buffer);
    }

    // 3. CHECK PENDING (COALESCING)
    if (cachedEntry && cachedEntry.pendingPromise) {
        console.log(`🔗 COALESCE: ${rtspUrl.slice(-15)}`);
        try {
            const buffer = await cachedEntry.pendingPromise;
            res.set('Content-Type', 'image/jpeg');
            res.set('X-Cache-Status', 'COALESCED');
            return res.send(buffer);
        } catch (err) {
            return res.status(502).send('Stream Error (Pending)');
        }
    }

    // 4. GENERATE (MISS)
    console.log(`🎥 SPAWN: ${rtspUrl.slice(-15)}`);
    
    // Create a deferred promise to act as the lock/mutex
    let resolvePromise, rejectPromise;
    const processingPromise = new Promise((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    });

    // Update cache map to indicate "Processing"
    cache.set(rtspUrl, { 
        timestamp: now, 
        pendingPromise: processingPromise, 
        buffer: null 
    });

    try {
        const buffer = await captureSnapshot(rtspUrl);
        
        // Success: Update cache with real data
        cache.set(rtspUrl, { 
            timestamp: Date.now(), 
            buffer: buffer, 
            pendingPromise: null 
        });
        
        // Notify others
        resolvePromise(buffer);

        res.set('Content-Type', 'image/jpeg');
        res.set('X-Cache-Status', 'MISS');
        res.send(buffer);
    } catch (err) {
        // Failure: Remove from cache so retry is possible
        cache.delete(rtspUrl);
        rejectPromise(err);
        
        console.error(`❌ FFMPEG ERROR: ${rtspUrl.slice(-15)}`, err.message);
        res.status(502).send('Camera Unreachable');
    }
});

/**
 * Spawns FFmpeg to capture a single frame from RTSP.
 * Enforces timeouts to prevent zombie processes.
 */
function captureSnapshot(url) {
    // --- MOCK MODE SUPPORT ---
    if (process.env.MOCK_CAMERA === "true") {
        return new Promise(resolve => {
            setTimeout(() => {
                // Return 1x1 gray pixel
                resolve(Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=\n", "base64"));
            }, 500);
        });
    }

    return new Promise((resolve, reject) => {
        // Using global 'ffmpeg' command (installed in Docker)
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-rtsp_transport', 'tcp', // Force TCP for stability
            '-i', url,
            '-f', 'image2',
            '-vframes', '1',
            '-q:v', '5', // Quality (1-31, 5 is good/fast)
            'pipe:1' // Output to stdout
        ]);

        let buffers = [];
        ffmpeg.stdout.on('data', (chunk) => buffers.push(chunk));
        
        ffmpeg.on('close', (code) => {
            if (code === 0 && buffers.length > 0) {
                resolve(Buffer.concat(buffers));
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });

        ffmpeg.on('error', (err) => reject(err));

        // Hard timeout: Kill if it takes too long (8s)
        setTimeout(() => {
            if (ffmpeg.exitCode === null) {
                ffmpeg.kill('SIGKILL');
                reject(new Error('FFmpeg Timeout (8s)'));
            }
        }, 8000);
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Video Microservice running on port ${PORT}`);
});
