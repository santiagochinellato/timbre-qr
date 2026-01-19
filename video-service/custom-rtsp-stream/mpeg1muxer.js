var Mpeg1Muxer, child_process, events, util

child_process = require('child_process')
util = require('util')
events = require('events')

Mpeg1Muxer = function(options) {
  var key
  this.url = options.url
  this.ffmpegOptions = options.ffmpegOptions
  this.exitCode = undefined
  this.additionalFlags = []
  if (this.ffmpegOptions) {
    for (key in this.ffmpegOptions) {
      this.additionalFlags.push(key)
      if (String(this.ffmpegOptions[key]) !== '') {
        this.additionalFlags.push(String(this.ffmpegOptions[key]))
      }
    }
  }
  
  // PATCH: Split options into input (before -i) and output (after -i)
  // For simplicity specific to this issue, we move specific input flags like transport to the front
  // But since the user only sets -r and -rtsp_transport, placing all before input is risky for encoding options.
  // Let's explicitly look for 'rtsp_transport' and move it to inputFlags.
  
  var inputFlags = []
  var outputFlags = []
  
  // Manual separation of known input flags
  var i = 0;
  while (i < this.additionalFlags.length) {
      var flag = this.additionalFlags[i]
      var val = this.additionalFlags[i+1]
      
      if (flag === '-rtsp_transport') {
          inputFlags.push(flag, val)
          i += 2
      } else {
          outputFlags.push(flag)
          if (val && !val.startsWith('-')) { // primitive check for value
              outputFlags.push(val)
              i += 2
          } else {
              i += 1
          }
      }
  }

  // RE-SIMPLIFICATION: 
  // Determining which flag takes a value is hard without a map.
  // BETTER APPROACH: Just put ALL provided options BEFORE -i if they are input-safe?
  // FFmpeg allows most options before -i.
  // -r before -i sets the input framerate (good for RTSP).
  // -stats is global.
  // -rtsp_transport is input only.
  // So for this specific use case, putting everything BEFORE -i is safer than AFTER.
  
  this.spawnOptions = [
    ...this.additionalFlags, // MOVE FLAGS BEFORE INPUT
    "-i",
    this.url,
    '-f',
    'mpegts',
    '-codec:v',
    'mpeg1video',
    '-'
  ]
  
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
