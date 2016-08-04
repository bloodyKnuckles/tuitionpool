#!/usr/bin/env node

var serverconn = require('../config.js').serverconn

var fs = require('fs')
var minimist = require('minimist')
var isroot = require('is-root')
var secargv = minimist(process.argv.slice(2), {
  alias: { p: 'port', u: 'uid', g: 'gid' },
  default: { port: isroot() ? 443 : 4430 }
})

if (secargv._[0] === 'init') {
  var createApp = require('../')
  var app = createApp()
  app.setup()
  //return
}

else { // alternative to return

    var alloc = require('tcp-bind')
    var secfd = alloc(secargv.port)

    if (secargv.gid) process.setuid(secargv.gid)
    if (secargv.uid) process.setuid(secargv.uid)

    var https = require('https')
    var createApp = require('../')
    var app = createApp()
    var secserver = https.createServer({
        key : fs.readFileSync(serverconn.privkey),
        cert: fs.readFileSync(serverconn.cert)
      },
      function (req, res) {
        app.handle(req, res)
      }
    )
    secserver.listen({ fd: secfd }, function () {
      console.log('listening on :' + secserver.address().port)
    })

    var wsock = require('websocket-stream')
    wsock.createServer({ server: secserver }, function (stream) {
      stream.pipe(app.createStream()).pipe(stream)
    })

    var argv = minimist(process.argv.slice(2), {
      alias: { p: 'port', u: 'uid', g: 'gid' },
      default: { port: isroot() ? 80 : 8000 }
    })
    var fd = alloc(argv.port)
    var http = require('http')
    var server = http.createServer(function (req, res) {
      res.writeHead(301, { 'Location': serverconn.redirhttps + req.url });
      res.end();
    })
    server.listen({ fd: fd }, function () {
      console.log('listening on :' + server.address().port)
    })

}

