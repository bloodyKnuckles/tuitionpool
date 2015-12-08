var url = require('url')
var queryObject = require('urlquery-to-object')
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

Server.prototype.handle = function (req, res) {
    var urlobj = url.parse(req.url),
        queryobj = queryObject(urlobj.query),
        result, rm = router.match(urlobj.pathname),
        rmx = xtend(rm, { state: { url: req.url, query: queryobj || undefined } })
    if ( rm && 'POST' === req.method ) {
        body(req, res, function (err, pvars) {
            rmx = xtend(rmx, { params: xtend(rmx.params, pvars) })
            result = rm.fn(req, res, rmx)
        })
    }
    else if (rm) { result = rm.fn(req, res, rmx) }
    else { this.st(req, res) }
}

Server.prototype.createStream = function () {
    // websocket feed goes here
}

Server.prototype.setup = function (cb) {
    //db.setup(cb)
}

