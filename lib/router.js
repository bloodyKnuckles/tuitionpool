var Routes = require('routes')
var router = Routes()
var path = require('path')
var fs = require('fs')
var templates = require('templateking')({directory:'public'})
var hscript = require('virtual-dom/h')

var db = require('./dbpools.js')
var idpattern = '[a-z0-9]{32}'

module.exports = router

router.addRoute('/', function (rm, res) {
    templates(
        ['layout.html', 'home.html', hscript('span', 'Welcome!')],
        { '#header': 'Tuition Pool' }, res
    )
})

// pools list
router.addRoute('/pools', function (rm, res) {
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
router.addRoute('/pools/:pooltoken(' + idpattern + ')', function (rm, res) {
    var message = 'Starting...'
    db.poolinfo({token:1, pooltoken:rm.params.pooltoken}, function (poolobj) {
        var poolinfo = poolobj.results
        if ( !poolinfo[0] ) {
            message = 'Pool not found.'
            templates(['layout.html', 'poolswrap.html', hscript('div', message)], {}, res)
        }
        else if ( poolinfo[0] ) {
            poolinfo = poolinfo[0]
            db.requests({token:1, pooltoken:rm.params.pooltoken, active:[true,false]}, function (requestsobj) {
                var requests = requestsobj.results
                if ( !requests[0] ) {
                    //console.log('no requests found')
                    message = 'No requests found.'
                    poolrequests(requests, poolinfo)
                }
                else if ( requests[0] ) {
                        //message = 'Requests found for Pool ' + rm.params.pooltoken + ': '
                        poolrequests(requests, poolinfo)
                }
            })
        }
    })

    function poolrequests (requests, poolinfo) {
        templates(
            ['layout.html', 'poolswrap.html', 'requests.html'],
            {
                'head': {_mapappend: {
                    'link': [{'link':{href:'/css/list.css'}}]
                }},
                '#countrequests': requests.length || '0',
                '#poolname': {href: '/pools/' + rm.params.pooltoken + '/edit', _text: poolinfo.poolname}, 
                '#datetime_start': poolinfo.datetime_start_text, '#datetime_end': poolinfo.datetime_end_text,
                '#listrequests': {_map: {'.rowrequest': requests}},
                '#pooltoken': rm.params.pooltoken,
                '#requestdeleteform': {action:'/pools/'+ rm.params.pooltoken + '/request/deactivate'},
                '#scripts': {_mapappend: {
                    'script': [{'script':{src:'/js/requests.js'}}]
                }},
            }, res
        )
   } 
})

// pool edit
router.addRoute('/pools/:pooltoken(' + idpattern + ')/edit|/pools/edit', function (rm, res) {
    var message = 'Starting...'
    if ( !rm.params.pooltoken ) {
        rm.params.pooltoken = ''
        poolform({poolname: '', datetime_start: '', datetime_end: ''})
    }
    else {
        db.poolinfo({token:1, pooltoken:rm.params.pooltoken}, function (poolobj) {
            var poolinfo = poolobj.results
            if ( !poolinfo[0] ) {
                message = 'Pool not found.'
                poolinfo = {poolname: '', datetime_start: '', datetime_end: ''}
            }
            else if ( poolinfo[0] ) {
                poolinfo = poolinfo[0]
            }
            poolform(poolinfo)
        })
    }

    function poolform (poolinfo) {
        templates(
            ['layout.html', 'poolswrap.html', 'pool_form.html'],
            {
                'head': {_mapappend: {
                    'link': [{'link':{href:'/css/form.css'}}, {'link': {href:'/css/datepickr.css'}}]
                }},
                '#poolname': {value: poolinfo.poolname},
                '#datetime_start_text': {value: poolinfo.datetime_start_text},
                '#datetime_end_text': {value: poolinfo.datetime_end_text},
                '#datetime_start': {value: poolinfo.datetime_start*1000},
                '#datetime_end': {value: poolinfo.datetime_end*1000},
                '#pooltoken': rm.params.pooltoken,
                '#scripts': {_mapappend: {
                    'script': [{'script':{src:'/js/pool_form.js'}}]
                }}
            }, res
        )
    }
})

// pool post
router.addRoute('/pools/:pooltoken(' + idpattern + ')/post|/pools/post', function (rm, res) {
    var message = 'Starting...'
    if ( !rm.params.pooltoken ) {
        db.poolinsert({token:1, post:rm.params}, function (poolinsertobj) {
            //console.log('pool inserted')
            message = 'Pool inserted.'
            redirect(res, '/pools')
        })
    }
    else {
        db.poolinfo({token:1, pooltoken:rm.params.pooltoken}, function (poolobj) {
            var poolinfo = poolobj.results
            if ( !poolinfo[0] ) {
                //console.log('no pool found')
                message = 'Pool not found.'
                templates(
                    ['layout.html', 'poolswrap.html', 'message.html'],
                    {'#message': message,
                    '#pooltoken': rm.params.pooltoken}, res
                )
            }
            else if ( poolinfo[0] ) {
                db.poolupdate({token:1, pooltoken:rm.params.pooltoken, post:rm.params}, function (poolupdateobj) {
                    //console.log('pool updated')
                    message = 'Pool updated.'
                    redirect(res, '/pools/' + rm.params.pooltoken)
                })
            }
        })
    }
})

// request deactivate
router.addRoute('/pools/:pooltoken(' + idpattern + ')/request/deactivate', function (rm, res) {
    var message = 'Starting...',
        pooltoken = rm.params.pooltoken, email = rm.params.email, datetime = rm.params.datetime
    db.requestdeactivate({
        token:1, post:rm.params //pooltoken:rm.params.pooltoken, email:rm.params.email, datetime:rm.params.datetime
    }, function (requestobj) {
        var request = requestobj.results, err = requestobj.err
        if ( err || 0 === request.affectedRows ) {
            console.log(pooltoken, email, datetime)
            message = 'Request deactivation failed.'
            templates(
                ['layout.html', 'requestswrap.html', 'poolrequestmsg.html'],
                {
                    '.requests': {href: '/pools/' + rm.params.pooltoken},
                    '#message': message, '#poolname': 'request deactivation failed'
                }, res
            )
        }
        else if ( 0 < request.affectedRows ) {
            //console.log('request deactivated')
            message = 'Request deactivated'
            redirect(res, '/pools/' + rm.params.pooltoken)
        }
    })
})

// request reactivate
router.addRoute('/pools/:pooltoken(' + idpattern + ')/request/reactivate', function (rm, res) {
    var message = 'Starting...',
        pooltoken = rm.params.pooltoken, email = rm.params.email, datetime = rm.params.datetime
    db.requestreactivate({
        token:1, post:rm.params //pooltoken:rm.params.pooltoken, email:rm.params.email, datetime:rm.params.datetime
    }, function (requestobj) {
        var request = requestobj.results, err = requestobj.err
        if ( err || 0 === request.affectedRows ) {
            console.log(pooltoken, email, datetime)
            message = 'Request reactivation failed.'
            templates(
                ['layout.html', 'requestswrap.html', 'poolrequestmsg.html'],
                {
                    '.requests': {href: '/pools/' + rm.params.pooltoken},
                    '#message': message, '#poolname': 'request reactivation failed'
                }, res
            )
        }
        else if ( 0 < request.affectedRows ) {
            //console.log('request reactivated')
            message = 'Request reactivated'
            redirect(res, '/pools/' + rm.params.pooltoken)
        }
    })
})

// request delete
router.addRoute('/pools/:pooltoken(' + idpattern + ')/request/delete', function (rm, res) {
    var message = 'Starting...',
        pooltoken = rm.params.pooltoken, email = rm.params.email, datetime = rm.params.datetime
    db.requestdelete({
        token:1, post:rm.params //pooltoken:rm.params.pooltoken, email:rm.params.email, datetime:rm.params.datetime
    }, function (requestobj) {
        var request = requestobj.results, err = requestobj.err
        if ( err || 0 === request.affectedRows ) {
            console.log(pooltoken, email, datetime)
            message = 'Request delete failed.'
            templates(
                ['layout.html', 'requestswrap.html', 'poolrequestmsg.html'],
                {
                    '.requests': {href: '/pools/' + rm.params.pooltoken},
                    '#message': message, '#poolname': 'request delete failed'
                }, res
            )
        }
        else if ( 0 < request.affectedRows ) {
            //console.log('request deleted')
            message = 'Request deleted'
            redirect(res, '/pools/' + rm.params.pooltoken)
        }
    })
})

// request form
router.addRoute('/:pooltoken(' + idpattern + ')', function (rm, res) {
    db.poolinfo({pooltoken:rm.params.pooltoken}, function (poolobj) {
        var poolinfo = poolobj.results[0]
        if ( !poolinfo ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'poolrequestmsg.html'],
                {'#message': message, '#poolname': 'not found'},
                res
            )
        }
        else if ( poolinfo ) {
            db.poolcurr({pooltoken:rm.params.pooltoken}, function (poolcurrobj) {
                var poolcurr = poolcurrobj.results
                if ( !poolcurr[0] ) {
                    //console.log('pool not active')
                    message = 'Pool not active.'
                    templates(
                        ['layout.html', 'poolrequestmsg.html'],
                        {
                            '#message': message,
                            '#poolname': poolinfo.poolname +
                                '<p>Starts: ' + poolinfo.datetime_start +
                                '<br>Ends: '  + poolinfo.datetime_end +
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
                            '#poolname': poolinfo.poolname, '#pooltoken': rm.params.pooltoken,
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
router.addRoute('/:pooltoken(' + idpattern + ')/post', function (rm, res) {
    var message = 'Starting...'
    db.poolcurr({pooltoken:rm.params.pooltoken}, function (poolobj) {
        var poolinfo = poolobj.results
        if ( !poolinfo[0] ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'message.html'],
                {'#message': message, '#pooltoken': rm.params.pooltoken, '#email': rm.params.email}, res
            )
        }
        else if ( poolinfo[0] ) {
            db.request({pooltoken:rm.params.pooltoken, email:rm.params.email}, function (requestobj) {
                var request = requestobj.results
                if ( !request[0] ) {
                    //console.log('no record found')
                    message = 'Okay to make request.'
                    db.requestinsert({post:rm.params}, function (requestinsertobj) {
                        //console.log('request inserted')
                        message = 'Request accepted.'
                        templates(
                            ['layout.html', 'message.html'],
                            {'#message': message, '#pooltoken': rm.params.pooltoken, '#email': rm.params.email}, res
                        )
                    })
                }
                else if ( request[0] ) {
                    //console.log('record found')
                    message = 'Request NOT accepted. Only one request per day allowed.'
                    templates(
                        ['layout.html', 'message.html'],
                        {'#message': message, '#pooltoken': rm.params.pooltoken, '#email': rm.params.email}, res
                    )
                }
            })
        }
    })
})

function redirect (res, where) {
    res.writeHead(307, {'Location': where})
    res.end()
}

