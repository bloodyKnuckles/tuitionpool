var Routes = require('routes')
var router = Routes()
var path = require('path')
var fs = require('fs')
var templates = require('templateking')({directory:'public'})
var hscript = require('virtual-dom/h')

var db = require('./dbpools.js')
var idpattern = '[a-z0-9]{32}'

module.exports = router

router.addRoute('/', function (req, res, rm) {
    templates(
        ['layout.html', 'home.html', hscript('span', 'Welcome!')],
        { '#header': 'Tuition Pool' }, res
    )
})

// pools list
router.addRoute('/pools', function (req, res, rm) {
    var message = 'Starting...'
    db.pools({token:1}, function (err, pools) {
        if ( 0 === pools.length ) {
            //console.log('no pools found')
            message = 'No pools found.'
        }
        else if ( 0 < pools.length ) {
            //console.log('pools found')
            message = 'Pools found: '
            pools = pools.map(function (poolinfo) {
                return {
                    '.poolname': {
                        _text: poolinfo.poolname, 'href': '/pools/' + poolinfo.pooltoken
                    },
                    '.datetime_start': poolinfo.datetime_start,
                    '.datetime_end': poolinfo.datetime_end,
                    '.requestscount': poolinfo.requestscount
                }
            })
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
router.addRoute('/pools/:pooltoken(' + idpattern + ')', function (req, res, rm) {
    var message = 'Starting...'
    db.poolinfo({token:1, pooltoken:rm.params.pooltoken}, function (err, poolinfo) {
        if ( 0 === poolinfo.length ) {
            message = 'Pool not found.'
            templates(['layout.html', 'poolswrap.html', hscript('div', message)], {}, res)
        }
        else if ( 0 < poolinfo.length ) {
            poolinfo = poolinfo[0]
            var poolargs = {token:1, pooltoken:rm.params.pooltoken, active:[true,false]}
            db.requests(poolargs, function (err, requests) {
                if ( 0 === requests.length ) {
                    //console.log('no requests found')
                    message = 'No requests found.'
                    poolrequests(requests, poolinfo)
                }
                else if ( 0 < requests.length ) {
                    //message = 'Requests found for Pool ' + rm.params.pooltoken + ': '
                    requests = requests.map(function (request) {
                        var retrequest = {
                            'td': {class:{append: request.active? '': ' strikeme'}},
                            '.name': request.name,
                            '.email': request.email,
                            '.datetime_text': request.datetime,
                            '.datetime': request.datetime,
                            '.coursenumber': request.coursenumber,
                            '.coursename': request.coursename,
                            '.universityname': ' - ' + request.universityname,
                            '.coursetype': request.coursetype,
                            '.coursedegree': request.coursedegree? 'degree': ''
                        }
                        retrequest['.provisional'] = 1 === request.provisional
                            ? { checked: 'checked'}: ''
                        return retrequest
                    })
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
                '#datetime_start': poolinfo.datetime_start_short,
                '#datetime_end'  : poolinfo.datetime_end_short,
                '#listrequests': {_map: {'.rowrequest': requests}},
                '#pooltoken': rm.params.pooltoken,
                '#requestdeleteform': {action:'/pools/'+ rm.params.pooltoken + '/request/deactivate'},
                '#scripts': {_mapappend: {
                    'script': [{'script':{src:'/js/requests.js'}}]
                }},
            }
            , res
        )
   } 
})

// pool edit
router.addRoute('/pools/:pooltoken(' + idpattern + ')/edit|/pools/edit', function (req, res, rm) {
    var message = 'Starting...'
    if ( !rm.params.pooltoken ) {
        rm.params.pooltoken = ''
        poolform({poolname: '', datetime_start: '', datetime_end: ''})
    }
    else {
        db.poolinfo({token:1, pooltoken:rm.params.pooltoken}, function (err, poolinfo) {
            if ( 0 === poolinfo.length ) {
                message = 'Pool not found.'
                poolinfo = {poolname: '', datetime_start: '', datetime_end: ''}
            }
            else if ( 0 < poolinfo.length ) {
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
                '#datetime_start_text': {value: poolinfo.datetime_start_db},
                '#datetime_end_text': {value: poolinfo.datetime_end_db},
                '#datetime_start': {value: poolinfo.datetime_start*1000},
                '#datetime_end': {value: poolinfo.datetime_end*1000},
                '#pooltoken': rm.params.pooltoken,
                '#scripts': {_mapappend: {
                    'script': [{'script':{src:'/js/pool_form.js'}}]
                }}
            }
            , res
        )
    }
})

// pool post
router.addRoute('/pools/:pooltoken(' + idpattern + ')/post|/pools/post', function (req, res, rm) {
    var message = 'Starting...'
    if ( !rm.params.pooltoken ) {
        db.poolinsert({token:1, post:rm.params}, function (err, poolinsert) {
            //console.log('pool inserted')
            message = 'Pool inserted.'
            redirect(res, '/pools')
        })
    }
    else {
        db.poolinfo({token:1, pooltoken:rm.params.pooltoken}, function (err, poolinfo) {
            if ( 0 === poolinfo.length ) {
                //console.log('no pool found')
                message = 'Pool not found.'
                templates(
                    ['layout.html', 'poolswrap.html', 'message.html'],
                    {'#message': message,
                    '#pooltoken': rm.params.pooltoken}, res
                )
            }
            else if ( 0 < poolinfo.length ) {
                var poolargs = {token:1, pooltoken:rm.params.pooltoken, post:rm.params}
                db.poolupdate(poolargs, function (err, poolupdateobj) {
                    //console.log('pool updated')
                    message = 'Pool updated.'
                    redirect(res, '/pools/' + rm.params.pooltoken)
                })
            }
        })
    }
})

// request delete
router.addRoute('/pools/:pooltoken(' + idpattern + ')/request/:deletetype([dr]eactivate|delete)', deleteOptions)

function deleteOptions (req, res, rm) {
    var message = 'Starting...',
        pooltoken = rm.params.pooltoken, email = rm.params.email, datetime = rm.params.datetime
    db['request' + rm.params.deletetype]({
        token:1, post:rm.params
    }, function (err, request) {
        if ( err || 0 === request.affectedRows ) {
            console.log(pooltoken, email, datetime)
            message = 'Request deactivation failed.'
            templates(
                ['layout.html', 'requestswrap.html', 'poolrequestmsg.html'],
                {
                    '.requests': {href: '/pools/' + rm.params.pooltoken},
                    '#message': message, '#poolname': 'request NOT ' + rm.params.deletetype + 'd'
                }, res
            )
        }
        else if ( 0 < request.affectedRows ) {
            //console.log('request ' + rm.params.deletetype)
            message = 'Request ' + rm.params.deletetype
            redirect(res, '/pools/' + rm.params.pooltoken)
        }
    })
}

// request form
router.addRoute('/:pooltoken(' + idpattern + ')', function (req, res, rm) {
    db.poolinfo({pooltoken:rm.params.pooltoken}, function (err, poolinfo) {
        if ( 0 === poolinfo.length ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'poolrequestmsg.html'],
                {'#message': message, '#poolname': 'not found'},
                res
            )
        }
        else if ( 0 < poolinfo.length ) {
            poolinfo = poolinfo[0]
            db.poolcurr({pooltoken:rm.params.pooltoken}, function (err, poolcurr) {
                if ( 0 === poolcurr.length ) {
                    //console.log('pool not active')
                    message = 'Pool not active.'
                    templates(
                        ['layout.html', 'poolrequestmsg.html'],
                        {
                            '#message': message,
                            '#poolname': poolinfo.poolname +
                                '<p>Starts: ' + poolinfo.datetime_start_short +
                                '<br>Ends: '  + poolinfo.datetime_end_short +
                                '</p>'
                        },
                        res
                    )
                }
                else if ( 0 < poolcurr.length ) {
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
router.addRoute('/:pooltoken(' + idpattern + ')/post', function (req, res, rm) {
    var message = 'Starting...'
    db.poolcurr({pooltoken:rm.params.pooltoken}, function (err, poolinfo) {
        if ( 0 === poolinfo.length ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'message.html'],
                {'#message': message, '#pooltoken': rm.params.pooltoken, '#email': rm.params.email}, res
            )
        }
        else if ( 0 < poolinfo.length ) {
            var poolargs = {pooltoken:rm.params.pooltoken, email:rm.params.email}
            db.request(poolargs, function (err, request) {
                if ( 0 === request.length ) {
                    //console.log('no record found')
                    message = 'Okay to make request.'
                    db.requestinsert({post:rm.params}, function (err, requestinsertobj) {
                        //console.log('request inserted')
                        message = 'Request accepted.'
                        templates(
                            ['layout.html', 'message.html'],
                            {'#message': message, '#pooltoken': rm.params.pooltoken, '#email': rm.params.email}, res
                        )
                    })
                }
                else if ( 0 < request.length ) {
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

