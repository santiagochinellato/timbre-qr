const net = require('net');
const { spawn } = require('child_process');

const CAMERA_CONFIG = {
    host: '192.168.1.34',
    port: 554,
    rtspUrl: 'rtsp://gnet:GNet0126@192.168.1.34:554/live/ch0'
};

console.log(`Testing connection to Camera at ${CAMERA_CONFIG.host}:${CAMERA_CONFIG.port}...`);

const socket = new net.Socket();
socket.setTimeout(3000);

socket.on('connect', () => {
    console.log('✅ TCP Connection successful (Port 554 is open).');
    socket.destroy();
    testStream();
});

socket.on('timeout', () => {
    console.log('❌ TCP Connection timed out.');
    socket.destroy();
});

socket.on('error', (err) => {
    console.log(`❌ TCP Connection error: ${err.message}`);
});

socket.connect(CAMERA_CONFIG.port, CAMERA_CONFIG.host);

function testStream() {
    console.log(`\nTesting RTSP Stream Handshake: ${CAMERA_CONFIG.rtspUrl}`);
    // Using ffmpeg to just probe
    const ffmpeg = spawn('ffmpeg', [
        '-v', 'error',
        '-rtsp_transport', 'tcp',
        '-i', CAMERA_CONFIG.rtspUrl,
        '-t', '1', // Read 1 second
        '-f', 'null',
        '-'
    ]);

    let stderr = '';
    ffmpeg.stderr.on('data', d => stderr += d);

    ffmpeg.on('close', (code) => {
        if (code === 0) {
            console.log('✅ FFmpeg successfully connected and read stream.');
        } else {
            console.log(`❌ FFmpeg failed to connect (Exit Code ${code}).`);
            console.log(`   Error Log:\n${stderr}`);
        }
    });

    ffmpeg.on('error', (err) => {
        console.log(`❌ FFmpeg process could not start: ${err.message}`);
        console.log('   (Make sure ffmpeg is installed)');
    });
}
