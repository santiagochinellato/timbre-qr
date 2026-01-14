import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";

export const dynamic = 'force-dynamic';

// --- HYBRID ARCHITECTURE ---
// PROXY MODE (Preferred): Forwards request to robust Video Microservice (Docker)
// LOCAL FALLBACK: Uses local FFmpeg (Serverless compliant) if external service is not configured

// --- LOCAL CACHE (Fallback only) ---
interface CachedSnapshot {
  buffer: Buffer;
  timestamp: number;
}
let globalSnapshotCache: CachedSnapshot | null = null;
let globalSnapshotPromise: Promise<Buffer> | null = null;
const CACHE_TTL_MS = 1500;

export async function GET(_req: NextRequest) {
  const cameraUser = process.env.CAMERA_USER || "admin";
  const cameraPass = process.env.CAMERA_PASSWORD || "";
  
  // Resolve RTSP URL
  let rtspUrl = process.env.CAMERA_RTSP_URL;
  if (!rtspUrl) {
     rtspUrl = `rtsp://${cameraUser}:${cameraPass}@186.0.212.50:554/live/main`;
  }

  // --- STRATEGY 1: PROXY TO MICROSERVICE (Production) ---
  const videoServiceUrl = process.env.VIDEO_SERVICE_URL; // e.g., https://my-video-service.up.railway.app
  const videoSecretKey = process.env.VIDEO_SECRET_KEY;

  if (videoServiceUrl && videoSecretKey) {
      try {
          // Forward request to microservice
          const targetUrl = `${videoServiceUrl}/snapshot?url=${encodeURIComponent(rtspUrl)}`;
          
          const response = await fetch(targetUrl, {
              headers: { 'x-api-key': videoSecretKey },
              cache: 'no-store'
          });

          if (response.ok) {
              const buffer = await response.arrayBuffer();
              return new NextResponse(new Uint8Array(buffer), {
                  headers: {
                      "Content-Type": "image/jpeg",
                      "Cache-Control": "public, max-age=1",
                      "X-Served-By": "Video-Microservice"
                  }
              });
          } else {
              console.error(`Video Service failed: ${response.status} - Falling back to local.`);
          }
      } catch (err) {
          console.error("Video Service unreachable - Falling back to local:", err);
      }
  }

  // --- STRATEGY 2: LOCAL FALLBACK (Original Logic) ---
  // If we are here, either the service is not configured OR it failed.
  // We use the local mutex/cache logic.

  const now = Date.now();

  // 1. FAST PATH: Serve from Cache if fresh
  if (globalSnapshotCache && (now - globalSnapshotCache.timestamp < CACHE_TTL_MS)) {
    return new NextResponse(new Uint8Array(globalSnapshotCache.buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=1, stale-while-revalidate=1",
        "X-Cache-Status": "HIT-LOCAL",
      }
    });
  }

  // 2. MUTEX PATH
  if (globalSnapshotPromise) {
    try {
      const buffer = await globalSnapshotPromise;
      return new NextResponse(new Uint8Array(buffer), {
         headers: {
            "Content-Type": "image/jpeg",
            "X-Cache-Status": "COALESCED-LOCAL",
         }
      });
    } catch (err) {
      return new NextResponse("Snapshot failed", { status: 502 });
    }
  }

  // 3. GENERATION PATH
  globalSnapshotPromise = generateLocalSnapshot(rtspUrl);

  try {
      const buffer = await globalSnapshotPromise;
      globalSnapshotCache = { buffer: buffer, timestamp: Date.now() };

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=1",
            "X-Cache-Status": "MISS-LOCAL",
        }
      });
  } catch (err) {
      console.error("Local Snapshot generation failed:", err);
      return new NextResponse("Snapshot generation failed", { status: 502 });
  } finally {
      globalSnapshotPromise = null;
  }
}

/**
 * Local FFmpeg logic (Fallback)
 */
async function generateLocalSnapshot(url: string): Promise<Buffer> {
    // Mock Mode Support
    if (process.env.MOCK_CAMERA === "true") {
        await new Promise(r => setTimeout(r, 500));
        return Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=\n", "base64");
    }

    // HTTP Snapshot Strategy first
    const httpSnapshotUrl = process.env.CAMERA_SNAPSHOT_URL;
    if (httpSnapshotUrl) {
         try {
            const cameraUser = process.env.CAMERA_USER || "admin";
            const cameraPass = process.env.CAMERA_PASSWORD || "";
            const fetchOptions: RequestInit = {};
            if (cameraUser && cameraPass && !httpSnapshotUrl.includes(cameraUser)) {
                 const auth = Buffer.from(`${cameraUser}:${cameraPass}`).toString("base64");
                 fetchOptions.headers = { Authorization: `Basic ${auth}` };
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(httpSnapshotUrl, { ...fetchOptions, signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) return Buffer.from(await response.arrayBuffer());
         } catch (e) { /* ignore */ }
    }

    return new Promise<Buffer>((resolve, reject) => {
        const tmpFile = join("/tmp", `snap-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);
        let cmd = ffmpegPath;
        if (!cmd || !fs.existsSync(cmd)) cmd = "ffmpeg";

        const args = ["-y", "-rtsp_transport", "tcp", "-i", url, "-vframes", "1", "-f", "image2", tmpFile];
        const child = spawn(cmd, args);

        const killTimeout = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error("FFmpeg process timed out (4s)"));
        }, 4000);

        child.on('error', (err) => { clearTimeout(killTimeout); reject(err); });
        child.on('close', (code) => {
            clearTimeout(killTimeout);
            if (code === 0 && fs.existsSync(tmpFile)) {
                try {
                    const fileBuffer = fs.readFileSync(tmpFile);
                    fs.unlinkSync(tmpFile);
                    resolve(fileBuffer);
                } catch (readErr) { reject(readErr); }
            } else {
                if (fs.existsSync(tmpFile)) try { fs.unlinkSync(tmpFile); } catch {}
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
    });
}
