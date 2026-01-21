var Mpeg1Muxer, child_process, events, util

child_process = require('child_process')
util = require('util')
events = require('events')

Mpeg1Muxer = function(options) {
  this.url = options.url
  this.exitCode = undefined
  
  // STRICT JSMPEG COMPATIBLE ARGUMENTS (Low Latency / Stable)
  // STRICT JSMPEG COMPATIBLE ARGUMENTS (Low Latency / Stable)
  this.spawnOptions = [
    "-rtsp_transport", "tcp", // Force TCP to prevent artifacting
    "-i", this.url,
    "-f", "mpegts",           // JSMpeg container
    "-codec:v", "mpeg1video", // JSMpeg codec
    
    // TUNED FOR STABILITY (1000kbps)
    "-b:v", "1000k",          // Bitrate: 1000k (Stable for mobile/wifi)
    "-maxrate", "1000k",      // Burst limit
    "-bufsize", "1000k",      // Strict buffer
    "-bf", "0",               // No B-Frames (Lowest latency)
    "-r", "25",               // 25 FPS (Standard PAL/Security)
    "-g", "25",               // GOP = 1 second recovery
    "-an",                    // Disable audio
    "-pix_fmt", "yuv420p",    // Compliance
    "-s", "640x360",          // Hardcoded Scaling (Matches VideoStream header)
    "-loglevel", "info",      // <--- CHANGED: Set to info for debugging
    
    "-"                       // STDOUT
  ];
  
  console.log('FFmpeg Spawn Options:', this.spawnOptions.join(' '))

  this.stream = child_process.spawn(options.ffmpegPath, this.spawnOptions, {
    detached: false
  })
  
  this.inputStreamStarted = true
  this.stream.stdout.on('data', (data) => {
    return this.emit('mpeg1data', data)
  })
  this.stream.stderr.on('data', (data) => {
    // Log stderr for debugging if needed, but beware of spam
    console.log(`FFmpeg Log: ${data.toString()}`); 
    return this.emit('ffmpegStderr', data)
  })
  this.stream.on('exit', (code, signal) => {
    if (code === 1) {
      console.error('RTSP stream exited with error')
      this.exitCode = 1
      return this.emit('exitWithError')
    }
  })
  return this
}

util.inherits(Mpeg1Muxer, events.EventEmitter)

module.exports = Mpeg1Muxer
