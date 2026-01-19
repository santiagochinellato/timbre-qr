const Stream = require('./custom-rtsp-stream/videoStream');
const dotenv = require('dotenv');
dotenv.config();

const RTSP_URL = process.env.RTSP_URL;
// Railway exposes PORT. If running locally, use 9999.
const PORT = process.env.PORT || 9999; 

if (!RTSP_URL) {
  console.error("❌ RTSP_URL is missing in environment variables.");
  process.exit(1);
}

console.log(`🎥 Starting Simplified Video Service on port ${PORT}...`);

// Mask password for logging
const maskedUrl = RTSP_URL.replace(/:([^:@]+)@/, ':****@');
console.log(`🔗 Target RTSP: ${maskedUrl}`); 

const stream = new Stream({
  name: 'doorbell',
  streamUrl: RTSP_URL,
  wsPort: parseInt(PORT), // Critical: Bind to the correct port directly
  ffmpegOptions: { 
    // These options are actually ignored by our custom muxer which uses strict hardcoded args,
    // but we pass them for compatibility/documentation.
    '-rtsp_transport': 'tcp', 
    '-f': 'mpegts',
    '-codec:v': 'mpeg1video',
    '-b:v': '800k',
    '-bf': '0'
  }
});

console.log(`✅ Stream Initialized on port ${PORT}.`);
