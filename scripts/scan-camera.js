const { spawn } = require('child_process');

const HOST = '186.0.212.50';
const PORT = 2000;
const USER = 'admin';
const PASS = 'Univers0'; 
const PASS_ENC = 'Univers0';
const PASS_TYPO_O = 'Univers0';

const CANDIDATES = [
    { name: "Verified Link",       url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/cam/realmonitor?channel=1&subtype=0` },
    { name: "Dahua Main",          url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/cam/realmonitor?channel=1&subtype=0` },
    { name: "Dahua Sub",           url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/cam/realmonitor?channel=1&subtype=1` },
    { name: "Hikvision Main",      url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/Streaming/Channels/101` },
    { name: "Hikvision Sub",       url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/Streaming/Channels/102` },
    { name: "Tapoc C200",          url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/stream1` },
    { name: "Generic Live",        url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/live` },
    { name: "Generic Media",       url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/media/video1` },
];

async function testUrl(candidate) {
    return new Promise(resolve => {
        console.log(`\nTesting: ${candidate.name}`);
        console.log(`URL:     ${candidate.url}`);
        
        const ffmpeg = spawn('ffmpeg', [
            '-v', 'error',
            '-rtsp_transport', 'tcp', // TCP usually more stable/required
            '-i', candidate.url,
            '-t', '1',
            '-f', 'null',
            '-'
        ]);

        let stderr = '';
        ffmpeg.stderr.on('data', d => stderr += d.toString());

        const timeout = setTimeout(() => {
            ffmpeg.kill();
            console.log("❌ Timeout (5s)");
            resolve(false);
        }, 5000);

        ffmpeg.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                console.log('✅ SUCCESS!');
                resolve(true);
            } else {
                console.log(`❌ Failed (Code ${code})`);
                if (stderr.includes('401 Unauthorized')) console.log('   Reason: 401 Unauthorized');
                else if (stderr.includes('Connection refused')) console.log('   Reason: Connection Refused');
                else console.log(`   Log: ${stderr.trim()}`);
                resolve(false);
            }
        });
    });
}

async function run() {
    console.log("🔍 Starting RTSP Candidate Scan...");
    
    for (const candidate of CANDIDATES) {
        const works = await testUrl(candidate);
        if (works) {
            console.log("\n🎯 MATCH FOUND!");
            console.log(`Working URL: ${candidate.url}`);
            process.exit(0);
        }
    }
    
    console.log("\n❌ All candidates failed.");
}

run();
