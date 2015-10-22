var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

var router = require('./lib/router.js')
var ecstatic = require('ecstatic')
var path = require('path')
var fs = require('fs')
var hstream = require('hyperstream')
var xtend = require('xtend')
var createElement = require('virtual-dom/create-element')
var db = require('./lib/db.js')
var str = require('string-to-stream')

inherits(Server, EventEmitter)
module.exports = Server

function Server (opts) {
  if (!(this instanceof Server)) return new Server(opts)
  if (!opts) opts = {}
  this.st = ecstatic(path.join(__dirname, 'public'))
}

Server.prototype.handle = function (req, res) {
  var r, m = router.match(req.url)
  var mx = xtend(m, { state: { url: req.url } })
  if (m && (r = m.fn(mx))) {
      ltemplates(r.templates)
      .pipe(hstream(procpgvars(r.pgvars)))
      .pipe(res)
  } else this.st(req, res)
}

Server.prototype.createStream = function () {
  // websocket feed goes here
}

Server.prototype.setup = function (cb) {
  db.setup(cb)
}
  
function ltemplates (templates) {
    var start = templates.reverse().shift()
    return templates.reduce(function(prev, next) {
        return vdorfile(next).pipe(hstream({'.template': prev}))
    }, vdorfile(start))
}

function procpgvars (pgvars) {
    pgvars = pgvars || {}
    Object.keys(pgvars).forEach(function (key) {
        pgvars[key] = 'string' === typeof pgvars[key]? pgvars[key]: createElement(pgvars[key]).toString()
    })
    return pgvars
}

function vdorfile (template) {
    return 'string' === typeof template? read(template): str(createElement(template).toString())
}

function read (file) {
    return fs.createReadStream(path.join(__dirname, 'public', file))
}
