var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

var router = require('./lib/router.js')
var ecstatic = require('ecstatic')
var path = require('path')
var fs = require('fs')
var hstream = require('hyperstream')
var xtend = require('xtend')
var createElement = require('virtual-dom/create-element')

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
      read('layout.html').pipe(hstream({
          '#content': lsections(r.sections)
      }))
      .pipe(hstream({
          '#header': 'string' === typeof r.content.header
              ? r.content.header: createElement(r.content.header).toString(),
          '#pg':     'string' === typeof r.content.pg
              ? read(r.content.pg): createElement(r.content.pg).toString()  
      }))
      .pipe(hstream(r.content.pgvar))
      .pipe(res)
  } else this.st(req, res)
}

Server.prototype.createStream = function () {
  // websocket feed goes here
}

function lsections (sections) {
    var first = sections.shift()
    return sections.reduce(function(prev, next) {
        return prev.pipe(hstream({'.section': read(next)}))
    }, read(first))
}

function read (file) {
  return fs.createReadStream(path.join(__dirname, 'public', file))
}
