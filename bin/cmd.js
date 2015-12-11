#!/usr/bin/env node

var minimist = require('minimist')
var isroot = require('is-root')
var argv = minimist(process.argv.slice(2), {
  alias: { p: 'port', u: 'uid', g: 'gid' },
  default: { port: isroot() ? 80 : 8000 }
})

if (argv._[0] === 'init') {
  var createApp = require('../')
  var app = createApp()
  app.setup()
  //return
}

var alloc = require('tcp-bind')
var fd = alloc(argv.port)

if (argv.gid) process.setuid(argv.gid)
if (argv.uid) process.setuid(argv.uid)

var http = require('http')
var createApp = require('../')
var app = createApp()
var server = http.createServer(function (req, res) {
  app.handle(req, res)
})
server.listen({ fd: fd }, function () {
  console.log('listening on :' + server.address().port)
})

var wsock = require('websocket-stream')
wsock.createServer({ server: server }, function (stream) {
  stream.pipe(app.createStream()).pipe(stream)
})
