import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import { PassThrough } from 'stream';

// Ensure ffmpeg path is set
if (pathToFfmpeg) {
    ffmpeg.setFfmpegPath(pathToFfmpeg);
}

// Config - Using verified Dahua path
const RTSP_URL = process.env.CAMERA_RTSP_URL || "rtsp://admin:Univer$0@186.0.212.50:9081/cam/realmonitor?channel=1&subtype=1";

export async function GET() {
    
    // Create a PassThrough stream to pipe the image data
    const passthrough = new PassThrough();
    
    // We need to return the response immediately with the stream
    const response = new NextResponse(passthrough as any, {
        headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'no-store, max-age=0',
        },
    });

    console.log(`📸 Taking snapshot from: ${RTSP_URL.replace(/:[^:]*@/, ":****@")}`);

    // Spawn ffmpeg process
    const command = ffmpeg(RTSP_URL)
        .inputOptions([
            '-rtsp_transport tcp', // Force TCP for reliability
            '-ss 0',               // Seek to start immediately
        ])
        .outputOptions([
            '-vframes 1',          // Capture 1 frame
            '-f image2',           // Output format image
            '-q:v 5',              // Quality (1-31, 5 is high)
        ])
        .on('error', (err) => {
            console.error('❌ FFmpeg Error:', err.message);
            // If the stream is still open, we might want to end it or log
            // Note: Next.js Response stream might be closed by browser already
        })
        .on('end', () => {
             // console.log('✅ Snapshot captured');
        });

    // Pipe directly to the response stream
    command.pipe(passthrough, { end: true });

    return response;
}
