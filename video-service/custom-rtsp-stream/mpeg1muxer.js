var Mpeg1Muxer, child_process, events, util

child_process = require('child_process')
util = require('util')
events = require('events')

Mpeg1Muxer = function(options) {
  this.url = options.url
  this.exitCode = undefined
  
  this.spawnOptions = [
    "-rtsp_transport", "tcp", // Forzar TCP para evitar cortes
    "-i", this.url,
    "-f", "mpegts",           // Contenedor MPEG-TS
    "-codec:v", "mpeg1video", // Codec de video
    
    // OPTIMIZACIÓN CRÍTICA
    "-hide_banner",           // 🟢 IMPORTANTE: Oculta info de texto que corrompe el stream
    "-b:v", "800k",           // Bajamos un poco el bitrate para estabilidad
    "-maxrate", "800k",
    "-bufsize", "800k",
    "-bf", "0",               // Latencia cero
    "-r", "25",               // 25 FPS
    "-g", "25",               // Un keyframe por segundo (recuperación rápida)
    "-an",                    // Sin audio
    "-pix_fmt", "yuv420p",
    
    // RESOLUCIÓN ESTÁNDAR (Múltiplo de 16)
    "-s", "640x480",          // 🟢 CAMBIO: 640x360 a veces rompe MPEG1. Usamos VGA.
    
    "-loglevel", "warning",   // Menos ruido en logs (solo warnings/errores)
    "-"                       // Salida a STDOUT (Websocket)
  ];
  
  console.log('FFmpeg Spawn Options:', this.spawnOptions.join(' '))

  this.stream = child_process.spawn(options.ffmpegPath, this.spawnOptions, {
    detached: false
  })
  
  this.inputStreamStarted = true
  
  // Enviar video limpio al WebSocket
  this.stream.stdout.on('data', (data) => {
    return this.emit('mpeg1data', data)
  })
  
  // Logs de error de FFmpeg (para debug en Railway)
  this.stream.stderr.on('data', (data) => {
    console.log(`FFmpeg: ${data.toString()}`); 
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
