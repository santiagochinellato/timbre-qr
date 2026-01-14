import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  // Prevent caching
  const headers = new Headers();
  headers.set("Cache-Control", "no-store, max-age=0");

  const cameraUser = process.env.CAMERA_USER || "admin";
  const cameraPass = process.env.CAMERA_PASSWORD || "";
  
  // 1. Priority: Explicit RTSP URL from Env
  // If not set, try a default guess (which might fail, as we saw)
  let rtspUrl = process.env.CAMERA_RTSP_URL;
  
  if (!rtspUrl) {
     // Default guess if env is missing
     // We construct it safely here just in case
     rtspUrl = `rtsp://${cameraUser}:${cameraPass}@186.0.212.50:554/live/main`;
  }

  // 2. Check for HTTP Snapshot URL override
  const httpSnapshotUrl = process.env.CAMERA_SNAPSHOT_URL;
  
  // If we have an HTTP Snapshot URL attempting that might be faster/easier if the user provides it
  if (httpSnapshotUrl) {
    try {
        const fetchOptions: RequestInit = {};
        // Only add Basic Auth if user/pass are needed and not embedded in URL
        if (cameraUser && cameraPass && !httpSnapshotUrl.includes(cameraUser)) {
             const auth = Buffer.from(`${cameraUser}:${cameraPass}`).toString("base64");
             fetchOptions.headers = { Authorization: `Basic ${auth}` };
        }
        
        const response = await fetch(httpSnapshotUrl, fetchOptions);
        if (response.ok) {
            const buffer = await response.arrayBuffer();
            return new NextResponse(buffer, {
                headers: {
                    "Content-Type": response.headers.get("content-type") || "image/jpeg",
                    "Cache-Control": "no-store, max-age=0"
                }
            });
        }
        console.error("HTTP Snapshot failed:", response.status);
    } catch (e) {
        console.error("HTTP Snapshot error:", e);
    }
    // If HTTP fails, fall through to RTSP
  }

  // 3. FFMPEG Capture for RTSP
  return new Promise<NextResponse>((resolve) => {
    const tmpFile = join("/tmp", `snap-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);
    
    // Use spawn to avoid shell quoting issues with "$" in passwords
    // ffmpeg -y -rtsp_transport tcp -i URL -vframes 1 tmpFile
    const args = [
        "-y",
        "-rtsp_transport", "tcp",
        "-i", rtspUrl!, 
        "-vframes", "1",
        tmpFile
    ];
    
    // We do NOT print the full command to avoid leaking password in logs if possible, 
    // but for debugging it's useful.
    // console.log("Spawning FFMPEG..."); 

    const child = spawn("ffmpeg", args);
    
    child.on('error', (err) => {
        console.error("Failed to start ffmpeg:", err);
        resolve(new NextResponse("FFmpeg failed to start", { status: 500 }));
    });

    child.on('close', (code) => {
        if (code === 0 && fs.existsSync(tmpFile)) {
            const fileBuffer = fs.readFileSync(tmpFile);
            fs.unlinkSync(tmpFile);
            resolve(new NextResponse(fileBuffer, {
                headers: {
                    "Content-Type": "image/jpeg",
                    "Cache-Control": "no-store, max-age=0"
                }
            }));
        } else {
            console.error(`FFmpeg exited with code ${code}. Check if RTSP URL is correct.`);
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
            resolve(new NextResponse("Stream Capture Failed", { status: 502 }));
        }
    });
  });
}
