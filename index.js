var url = require('url')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var router = require('./lib/router.js')
var ecstatic = require('ecstatic')
var body = require('body/any')
var path = require('path')
var xtend = require('xtend')

inherits(Server, EventEmitter)
module.exports = Server

function Server (opts) {
  if (!(this instanceof Server)) return new Server(opts)
  if (!opts) opts = {}
  this.st = ecstatic(path.join(__dirname, 'public'))
}

var ns = require('node-session')
var tsession = new ns({
  secret: require('./config.js').secret,
  'lifetime': 7 * 24 * 60 * 60 * 1000, // days
  'secure': true,
  'encrypt': true
})

Server.prototype.handle = function (req, res) {
  var result, rm = router.match(url.parse(req.url).pathname)
  var rmx = xtend(rm, { state: { url: req.url } })

  if ( rm ) {
    tsession.startSession(req, res, function () {
    if ( 'POST' === req.method ) {
      body(req, res, function (err, pvars) {
        rmx = xtend(rmx, { params: xtend(rmx.params, pvars) })
        result = rm.fn(req, res, rmx)
      })
    }
    else {
      result = rm.fn(req, res, rmx)
    }
    })
  }
  else {
    this.st(req, res)
  }
}

Server.prototype.createStream = function () {
  // websocket feed goes here
}

Server.prototype.setup = function (cb) {
  //db.setup(cb)
}

