var Mpeg1Muxer, child_process, events, util

child_process = require('child_process')
util = require('util')
events = require('events')

Mpeg1Muxer = function(options) {
  this.url = options.url
  this.exitCode = undefined
  
  // STRICT JSMPEG COMPATIBLE ARGUMENTS
  // We explicitly ignore options.ffmpegOptionsMain to prevent external pollution
  this.spawnOptions = [
    "-rtsp_transport", "tcp", // FORCE TCP: Crucial for stable RTSP in Docker/Cloud
    "-i", this.url,           // Input URL
    "-f", "mpegts",           // Format: MPEG-TS (Required by JSMpeg)
    "-codec:v", "mpeg1video", // Video Codec: MPEG1 (Required by JSMpeg)
    "-b:v", "1000k",          // Bitrate: 1000k (Stable quality/bandwidth balance)
    "-maxrate", "1000k",      // Cap max bitrate to prevent stalls
    "-bufsize", "2000k",      // Buffer size control
    "-bf", "0",               // No B-Frames: Reduces latency significantly
    "-r", "30",               // Framerate: 30fps
    "-g", "30",               // GOP: 1 keyframe per second
    "-an",                    // No Audio: Disable audio to isolate video issues
    "-pix_fmt", "yuv420p",    // Color space (Critical for JSMpeg)
    "-s", "640x360",          // Hardcoded Resolution (Matches VideoStream header)
    "-"                       // Output to STDOUT
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
