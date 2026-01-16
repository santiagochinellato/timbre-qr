const { spawn } = require('child_process');

const HOST = '192.168.1.34';
const PORT = 554;
const USER = 'thaf';
const PASS = 'u7u43m'; // confirmed by user

const CANDIDATES = [
    { name: "User Provided", url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/live/ch0` },
    { name: "Admin User",    url: `rtsp://admin:${PASS}@${HOST}:${PORT}/live/ch0` },
    { name: "No Auth",       url: `rtsp://${HOST}:${PORT}/live/ch0` },
    { name: "Substream",     url: `rtsp://${USER}:${PASS}@${HOST}:${PORT}/live/ch1` },
    { name: "V380 Default",  url: `rtsp://${HOST}:${PORT}/live/ch0` } // same as no auth but labeling
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
