var Routes = require('routes')
var router = Routes()
var path = require('path')
var fs = require('fs')
var hscript = require('virtual-dom/h')
var hstream = require('hyperstream')
var createElement = require('virtual-dom/create-element')
var str = require('string-to-stream')

var db = require('./dbpools.js')

var idpattern = '[a-z0-9]{32}'
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
        }
        templates(
            ['layout.html', 'pools.html'],
            {
                'head': {_mapappend: {
                    'link': [{'link':{href:'/css/list.css'}}]
                }},
                '#pagetitle': message, '#countpools': pools.length,
                '#listpools': {_map: {'.rowpool': pools}},
                '#scripts': {_mapappend: {
                    'script': [{'script':{src:'/js/list.js'}}]
                }},
            }, res
        )
    })
})

router.addRoute('/pools/:pool(' + idpattern + ')', function (m, res) {
    var message = 'Starting...'
    db.requests(1, m.params.pool, function (requests) {
        if ( !requests[0] ) {
            //console.log('no requests found')
            message = 'No requests found.'
            templates(['layout.html', hscript('div', message)], {}, res)
        }
        else if ( requests[0] ) {
            db.poolanon(m.params.pool, function (pool) {
                pool = pool[0]
                //message = 'Requests found for Pool ' + m.params.pool + ': '
                templates(
                    ['layout.html', 'requests.html'],
                    {
                        'head': {_mapappend: {
                            'link': [{'link':{href:'/css/list.css'}}]
                        }},
                        '#countrequests': requests.length,
                        '#poolname': {href: '/pools/' + m.params.pool + '/edit', _text: pool.poolname}, 
                        '#listrequests': {_map: {'.rowrequest': requests}},
                        '#scripts': {_mapappend: {
                            'script': [{'script':{src:'/js/requests.js'}}]
                        }},
                    }, res
                )
            })
        }
    })
})

// pool edit
router.addRoute('/pools/:pool(' + idpattern + ')/edit|/pools/edit', function (m, res) {
    var message = 'Starting...'
    if ( !m.params.pool ) {
        m.params.pool = ''
        poolform({poolname: '', datetime_start: '', datetime_end: ''})
    }
    else {
        db.pool(1, m.params.pool, function (pool) {
            if ( !pool[0] ) {
                message = 'Pool not found.'
                pool = {poolname: '', datetime_start: '', datetime_end: ''}
            }
            else if ( pool[0] ) {
                pool = pool[0]
            }
            poolform(pool)
        })
    }

    function poolform (pool) {
        templates(
            ['layout.html', 'pool_form.html'],
            {
                'head': {_mapappend: {
                    'link': [{'link':{href:'/css/form.css'}}]
                }},
                '#poolname': {value: pool.poolname},
                '#datetime_start': {value: pool.datetime_start},
                '#datetime_end': {value: pool.datetime_end},
                '#pool': m.params.pool,
                '#scripts': {_mapappend: {
                    'script': [{'script':{src:'/js/pool_form.js'}}]
                }},
            }, res
        )
    }
})

// pool post
router.addRoute('/pools/:pool(' + idpattern + ')/post|/pools/post', function (m, res) {
    var message = 'Starting...'
    if ( !m.params.pool ) {
        db.poolinsert(m.params, function (poolinsert) {
            //console.log('pool inserted')
            message = 'Pool inserted.'
        })
    }
    else {
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
                db.poolupdate(m.params, function (poolupdate) {
                    //console.log('pool updated')
                    message = 'Pool updated.'
                    templates(
                        ['layout.html', 'message.html'],
                        {'#message': message, '#pool': m.params.pool}, res
                    )
                })
            }
        })
    }
})

// request form
router.addRoute('/:pool(' + idpattern + ')', function (m, res) {
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
                ['layout.html', 'request_form.html'],
                {
                    'head': {_mapappend: {'link': [{'link':{href:'/css/form.css'}}]}},
                    '#poolname': pool[0].poolname, '#pool': m.params.pool
                }, res
            )
        }
    })
})

// request post
router.addRoute('/:pool(' + idpattern + ')/post', function (m, res) {
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
            : ''
    })
    return pgvars
}

function vdorfile (template) {
    return 'string' === typeof template? read(template): str(createElement(template).toString())
}

function read (file) {
    return fs.createReadStream(path.join(__dirname, '../public', file))
}

