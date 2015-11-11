var Routes = require('routes')
var router = Routes()
var path = require('path')
var fs = require('fs')
var hscript = require('virtual-dom/h')
var hstream = require('hyperstream')
var createElement = require('virtual-dom/create-element')
var str = require('string-to-stream')

var db = require('./pools.js')

module.exports = router

router.addRoute('/', function (m, res) {
    templates(
        ['layout.html', 'home.html', hscript('span', 'Welcome!')],
        { '#header': 'Tuition Pool' }, res
    )
})

router.addRoute('/pools', function (m, res) {
    var message = 'Starting...'
    db.pools(1, function (pools) {
        if ( !pools[0] ) {
            //console.log('no pools found')
            message = 'No pools found.'
        }
        else if ( pools[0] ) {
            //console.log('pools found')
            message = 'Pools found: '
            templates(
                ['layout.html', 'pools.html'],
                {
                    '#pagetitle': message, '#countpools': pools.length,
                    '#listpools': {_map: {'.rowpool': pools}}
                }, res
            )
        }
    })
})

router.addRoute('/pools/:pool([0-9]{6})', function (m, res) {
    var message = 'Starting...'
    var elems = [hscript('div', message)]
    db.pool(1, m.params.pool, function (pool) {
        if ( !pool[0] ) {
            //console.log('no requests found')
            message = 'No requests found.'
            elems = [hscript('div', message)]
        }
        else if ( pool[0] ) {
            message = 'Requests found for Pool ' + m.params.pool + ': '
            elems = [hscript('h3', message), hscript('br')]
            pool.forEach(function (item) {
                elems.push(hscript('div', item.email + ' ' + item.datetime))
            })
        }
        templates(
            ['layout.html', hscript('div', {class: 'centerbox'}, elems)],
            {}, res
        )
    })
})

router.addRoute('/:pool([0-9]{6})', function (m, res) {
    db.poolanon(m.params.pool, function (pool) {
        if ( !pool[0] ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'message.html'],
                {'#message': message, '#pool': m.params.pool}, res
            )
        }
        else if ( pool[0] ) {
            templates(
                ['layout.html', 'sign_in_form.html'],
                {'#poolname': pool[0].poolname, '#pool': m.params.pool}, res
            )
        }
    })
})

router.addRoute('/:pool([0-9]{6})/post', function (m, res) {
    var message = 'Starting...'
    db.poolanon(m.params.pool, function (pool) {
        if ( !pool[0] ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'message.html'],
                {'#message': message, '#pool': m.params.pool, '#email': m.params.email}, res
            )
        }
        else if ( pool[0] ) {
            db.request(m.params.pool, m.params.email, function (request) {
                if ( !request[0] ) {
                    //console.log('no record found')
                    message = 'Okay to make request.'
                    db.requestinsert(m.params, function (requestinsert) {
                        //console.log('request inserted')
                        message = 'Request accepted.'
                        templates(
                            ['layout.html', 'message.html'],
                            {'#message': message, '#pool': m.params.pool, '#email': m.params.email}, res
                        )
                    })
                }
                else if ( request[0] ) {
                    //console.log('record found')
                    message = 'Request NOT accepted. Only one request per day allowed.'
                    templates(
                        ['layout.html', 'message.html'],
                        {'#message': message, '#pool': m.params.pool, '#email': m.params.email}, res
                    )
                }
            })
        }
    })
})

function templates (templates, pgvars, res) {
    ltemplates(templates)
    .pipe(hstream(procpgvars(pgvars)))
    .pipe(res)
}

function ltemplates (templates) {
    var start = templates.reverse().shift()
    return templates.reduce(function(prev, next) {
        //return vdorfile(next).pipe(hstream({'.template': {_appendhtml:prev}}))
        return vdorfile(next).pipe(hstream({'.template': prev}))
    }, vdorfile(start))
}

function procpgvars (pgvars) {
    pgvars = pgvars || {}
    Object.keys(pgvars).forEach(function (key) {
        pgvars[key] = pgvars[key]
            ? (
                /string|number|object/.test(typeof pgvars[key])
                    ? pgvars[key]: createElement(pgvars[key]).toString()
            )
            : '~'
    })
    return pgvars
}

function vdorfile (template) {
    return 'string' === typeof template? read(template): str(createElement(template).toString())
}

function read (file) {
    return fs.createReadStream(path.join(__dirname, '../public', file))
}

