var Routes = require('routes')
var router = Routes()
var path = require('path')
var fs = require('fs')
var templates = require('templateking')({directory:'public'})
var hscript = require('virtual-dom/h')

var db = require('./dbpools.js')
var idpattern = '[a-z0-9]{32}'

module.exports = router

router.addRoute('/', function (m, res) {
    templates(
        ['layout.html', 'home.html', hscript('span', 'Welcome!')],
        { '#header': 'Tuition Pool' }, res
    )
})

// pools list
router.addRoute('/pools', function (m, res) {
    var message = 'Starting...'
    db.pools({token:1}, function (poolsobj) {
        var pools = poolsobj.results
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
                '#scripts': {_mapprepend: {
                    'script': [
                        {'script':{src:undefined, _html:'var test = "fun"'}},
                        {'script':{src:'/js/list.js'}}
                    ]
                }}
            }, res
        )
    })
})

// pool requests list
router.addRoute('/pools/:pool(' + idpattern + ')', function (m, res) {
    var message = 'Starting...'
    db.pool({token:1, pool:m.params.pool}, function (poolobj) {
        var pool = poolobj.results
        if ( !pool[0] ) {
            message = 'Pool not found.'
            templates(['layout.html', 'poolswrap.html', hscript('div', message)], {}, res)
        }
        else if ( pool[0] ) {
            pool = pool[0]
            db.requests({token:1, pool:m.params.pool}, function (requestsobj) {
                var requests = requestsobj.results
                if ( !requests[0] ) {
                    //console.log('no requests found')
                    message = 'No requests found.'
                    poolrequests(requests, pool)
                }
                else if ( requests[0] ) {
                        //message = 'Requests found for Pool ' + m.params.pool + ': '
                        poolrequests(requests, pool)
                }
            })
        }
    })

    function poolrequests (requests, pool) {
        templates(
            ['layout.html', 'poolswrap.html', 'requests.html'],
            {
                'head': {_mapappend: {
                    'link': [{'link':{href:'/css/list.css'}}]
                }},
                '#countrequests': requests.length || '0',
                '#poolname': {href: '/pools/' + m.params.pool + '/edit', _text: pool.poolname}, 
                '#datetime_start': pool.datetime_start_text, '#datetime_end': pool.datetime_end_text,
                '#listrequests': {_map: {'.rowrequest': requests}},
                '#scripts': {_mapappend: {
                    'script': [{'script':{src:'/js/requests.js'}}]
                }},
            }, res
        )
   } 
})

// pool edit
router.addRoute('/pools/:pool(' + idpattern + ')/edit|/pools/edit', function (m, res) {
    var message = 'Starting...'
    if ( !m.params.pool ) {
        m.params.pool = ''
        poolform({poolname: '', datetime_start: '', datetime_end: ''})
    }
    else {
        db.pool({token:1, pool:m.params.pool}, function (poolobj) {
            var pool = poolobj.results
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
            ['layout.html', 'poolswrap.html', 'pool_form.html'],
            {
                'head': {_mapappend: {
                    'link': [{'link':{href:'/css/form.css'}}, {'link': {href:'/css/datepickr.css'}}]
                }},
                '#poolname': {value: pool.poolname},
                '#datetime_start_text': {value: pool.datetime_start_text},
                '#datetime_end_text': {value: pool.datetime_end_text},
                '#datetime_start': {value: pool.datetime_start*1000},
                '#datetime_end': {value: pool.datetime_end*1000},
                '#pool': m.params.pool,
                '#scripts': {_mapappend: {
                    'script': [{'script':{src:'/js/pool_form.js'}}]
                }}
            }, res
        )
    }
})

// pool post
router.addRoute('/pools/:pool(' + idpattern + ')/post|/pools/post', function (m, res) {
    var message = 'Starting...'
    if ( !m.params.pool ) {
        db.poolinsert({token:1, post:m.params}, function (poolinsertobj) {
            //console.log('pool inserted')
            message = 'Pool inserted.'
            poolsredirect('/pools')
        })
    }
    else {
        db.pool({token:1, pool:m.params.pool}, function (poolobj) {
            var pool = poolobj.results
            if ( !pool[0] ) {
                //console.log('no pool found')
                message = 'Pool not found.'
                templates(
                    ['layout.html', 'poolswrap.html', 'message.html'],
                    {'#message': message,
                    '#pool': m.params.pool}, res
                )
            }
            else if ( pool[0] ) {
                db.poolupdate({token:1, pool:m.params.pool, post:m.params}, function (poolupdateobj) {
                    //console.log('pool updated')
                    message = 'Pool updated.'
                    poolsredirect('/pools/' + m.params.pool)
                })
            }
        })
    }

    function poolsredirect (where) {
        res.writeHead(307, {'Location': where})
        res.end()
    }
})

// request form
router.addRoute('/:pool(' + idpattern + ')', function (m, res) {
    db.poolinfo({pool:m.params.pool}, function (poolobj) {
        var pool = poolobj.results
        if ( !pool[0] ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'poolrequestmsg.html'],
                {'#message': message, '#pool': 'not found'},
                res
            )
        }
        else if ( pool[0] ) {
            db.poolcurr({pool:m.params.pool}, function (poolcurrobj) {
                var poolcurr = poolcurrobj.results
                if ( !poolcurr[0] ) {
                    //console.log('pool not active')
                    message = 'Pool not active.'
                    templates(
                        ['layout.html', 'poolrequestmsg.html'],
                        {
                            '#message': message,
                            '#pool': pool[0].poolname +
                                '<p>Starts: ' + pool[0].datetime_start +
                                '<br>Ends: '  + pool[0].datetime_end +
                                '</p>'
                        },
                        res
                    )
                }
                else if ( poolcurr[0] ) {
                    templates(
                        ['layout.html', 'request_form.html'],
                        {
                            'head': {_mapappend: {'link': [{'link':{href:'/css/form.css'}}]}},
                            '#poolname': pool[0].poolname, '#pool': m.params.pool,
                            '#scripts': {_mapappend: {
                                'script': [{'script':{src:'/js/request_form.js'}}]
                            }}
                        },
                        res
                    )
                }
            })
        }
    })
})

// request post
router.addRoute('/:pool(' + idpattern + ')/post', function (m, res) {
    var message = 'Starting...'
    db.poolcurr({pool:m.params.pool}, function (poolobj) {
        var pool = poolobj.results
        if ( !pool[0] ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'message.html'],
                {'#message': message, '#pool': m.params.pool, '#email': m.params.email}, res
            )
        }
        else if ( pool[0] ) {
            db.request({pool:m.params.pool, email:m.params.email}, function (requestobj) {
                var request = requestobj.results
                if ( !request[0] ) {
                    //console.log('no record found')
                    message = 'Okay to make request.'
                    db.requestinsert({post:m.params}, function (requestinsertobj) {
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

