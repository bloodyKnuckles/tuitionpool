var queryObject = require('urlquery-to-object')
var Routes = require('routes')
var router = Routes()
var path = require('path')
var fs = require('fs')
var templates = require('templateking')({directory:'public'})
var hscript = require('virtual-dom/h')

var db = require('./dbpools.js')
var idpattern = '[a-z0-9]{32}'

module.exports = router

router.addRoute('/', function (rmx) {
    templates(
        ['layout.html', 'home.html', hscript('span', 'Welcome!')],
        { '#header': 'Tuition Pool' },
        rmx.res
    )
})

// pools list
router.addRoute('/pools', function (rmx) {
    var queryobj = queryObject(rmx.state.url.split('?')[1])
    var message = 'Starting...',
        active = queryobj && 'false' === queryobj.active? [true,false]: true
    db.pools({token:1, active:active}, function (err, pools) {
        if ( 0 === pools.length ) {
            //console.log('no pools found')
            message = 'No pools found.'
        }
        else if ( 0 < pools.length ) {
            //console.log('pools found')
            message = 'Pools found: '
            pools = pools.map(function (poolinfo) {
                return {
                    'td': {class:{append: poolinfo.active? '': ' strikeme'}},
                    '.poolname': {
                        _text: poolinfo.poolname, 'href': '/pools/' + poolinfo.pooltoken
                    },
                    '.datetime_start': poolinfo.datetime_start,
                    '.datetime_end': poolinfo.datetime_end,
                    '.requestscount': poolinfo.requestscount,
                    '.pooltoken': poolinfo.pooltoken,
                    '.requestlink': {href: '/' + poolinfo.pooltoken, _text: 'http://159.203.135.109/' + poolinfo.pooltoken}
                }
            })
        }
        templates(
            ['layout.html', 'pools.html'],
            {
                'head': {_mapappend: {
                    'link': [{'link':{href:'/css/list.css'}}]
                }},
                '#pagetitle': message, '#countitems': pools.length,
                '#listitems': {_map: {'.rowinfo': pools}},
                '#actionform': {action: '/pools/pooltoken/deactivate'},
                '#returnto': {value: '/pools'},
                '#includeactive': {
                    href: '/pools?' + queryObject.queryString(queryobj, (true === active? {active:false}: {active:true})),
                    _text: (true === active? 'Include': 'Hide') + ' deleted pools' 
                },
                '#scripts': {_mapprepend: {
                    'script': [
                        {'script':{src:undefined, _html:'var test = "fun"'}},
                        {'script':{src:'/js/pools.js'}}
                    ]
                }}
            },
            rmx.res
        )
    })
})

// pool requests list
router.addRoute('/pools/:pooltoken(' + idpattern + ')', function (rmx) {
    var queryobj = queryObject(rmx.state.url.split('?')[1])
    var message = 'Starting...',
        active = queryobj && 'false' === queryobj.active? [true,false]: true
    db.poolinfo({token:1, pooltoken:rmx.params.pooltoken}, function (err, poolinfo) {
        if ( 0 === poolinfo.length ) {
            message = 'Pool not found.'
            templates(['layout.html', 'poolswrap.html', hscript('div', message)], {}, rmx.res)
        }
        else if ( 0 < poolinfo.length ) {
            poolinfo = poolinfo[0]
            poolinfo.includeactive = {}
            poolinfo.includeactive.href = '/pools/' + rmx.params.pooltoken + '?' + (true === active? 'active=false': '')
            poolinfo.includeactive._text = (true === active? 'Include': 'Hide') + ' deleted requests'
            var poolargs = {token:1, pooltoken:rmx.params.pooltoken, active:active}
            db.requests(poolargs, function (err, requests) {
                if ( 0 === requests.length ) {
                    //console.log('no requests found')
                    message = 'No requests found.'
                    poolrequests(requests, poolinfo)
                }
                else if ( 0 < requests.length ) {
                    //message = 'Requests found for Pool ' + rmx.params.pooltoken + ': '
                    requests = requests.map(function (request) {
                        var retrequest = {
                            'td': {class:{append: request.active? '': ' strikeme'}},
                            '.name': request.name,
                            '.email': request.email,
                            '.datetime': request.datetime,
                            '.datetime_text': request.datetime_text,
                            '.datetime_prov': request.datetime_prov,
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
                '#poolname': {href: '/pools/' + rmx.params.pooltoken + '/edit', _text: poolinfo.poolname}, 
                '#datetime_start': poolinfo.datetime_start_short,
                '#datetime_end'  : poolinfo.datetime_end_short,
                '#requestlink'   : {href: '/' + rmx.params.pooltoken, _text: 'http://159.203.135.109/' + rmx.params.pooltoken},
                '#listitems': {_map: {'.rowinfo': requests}},
                '#pooltoken': rmx.params.pooltoken,
                '#actionform': {action:'/pools/'+ rmx.params.pooltoken + '/request/deactivate'},
                '#returnto': {value: '/pools/' + rmx.params.pooltoken},
                '#includeactive': poolinfo.includeactive,
                '#scripts': {_mapappend: {
                    'script': [
                        {'script':{src:'/js/requests.js'}}
                    ]
                }},
            },
            rmx.res
        )
   } 
})

// pool edit
router.addRoute('/pools/:pooltoken(' + idpattern + ')/edit|/pools/edit', function (rmx) {
    var message = 'Starting...'
    if ( !rmx.params.pooltoken ) {
        rmx.params.pooltoken = ''
        poolform({poolname: '', datetime_start: '', datetime_end: ''})
    }
    else {
        db.poolinfo({token:1, pooltoken:rmx.params.pooltoken}, function (err, poolinfo) {
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
                '#pooltoken': rmx.params.pooltoken,
                '#scripts': {_mapappend: {
                    'script': [{'script':{src:'/js/pool_form.js'}}]
                }}
            },
            rmx.res
        )
    }
})

// pool post
router.addRoute('/pools/:pooltoken(' + idpattern + ')/post|/pools/post', function (rmx) {
    var message = 'Starting...'
    if ( !rmx.params.pooltoken ) {
        db.poolinsert({token:1, post:rmx.params}, function (err, poolinsert) {
            //console.log(err, 'pool inserted')
            message = 'Pool inserted.'
            redirect(rmx.res, '/pools')
        })
    }
    else {
        db.poolinfo({token:1, pooltoken:rmx.params.pooltoken}, function (err, poolinfo) {
            if ( 0 === poolinfo.length ) {
                //console.log('no pool found')
                message = 'Pool not found.'
                templates(
                    ['layout.html', 'poolswrap.html', 'message.html'],
                    {'#message': message,
                    '#pooltoken': rmx.params.pooltoken},
                    rmx.res
                )
            }
            else if ( 0 < poolinfo.length ) {
                var poolargs = {token:1, pooltoken:rmx.params.pooltoken, post:rmx.params}
                db.poolupdate(poolargs, function (err, poolupdateobj) {
                    //console.log('pool updated')
                    message = 'Pool updated.'
                    redirect(rmx.res, '/pools/' + rmx.params.pooltoken)
                })
            }
        })
    }
})

// pool delete
router.addRoute('/pools/:pooltoken(' + idpattern + ')/:deletetype([dr]eactivate|delete)', deleteOptions)

// request delete
router.addRoute('/pools/:pooltoken(' + idpattern + ')/request/:deletetype([dr]eactivate|delete)', deleteOptions)

function deleteOptions (rmx) {
    var message = 'Starting...',
        pooltoken = rmx.params.pooltoken, email = rmx.params.email, datetime = rmx.params.datetime
    db[rmx.params.itemtype + rmx.params.deletetype]({
        token:1, post:rmx.params
    }, function (err, request) {
        if ( err || 0 === request.affectedRows ) {
            console.log(err, rmx.params)
            message = 'Request deactivation failed.'
            templates(
                ['layout.html', 'requestswrap.html', 'poolrequestmsg.html'],
                {
                    '.requests': {href: '/pools/' + rmx.params.pooltoken},
                    '#message': message, '#poolname': rmx.params.itemtype + ' NOT ' + rmx.params.deletetype + 'd'
                },
                rmx.res
            )
        }
        else if ( 0 < request.affectedRows ) {
            //console.log(rmx.params.itemtype + ' ' + rmx.params.deletetype) 
            message = rmx.params.itemtype + ' ' + rmx.params.deletetype
            redirect(rmx.res, rmx.params.returnto)
        }
    })
}

// toggle
router.addRoute('/pools/:pooltoken(' + idpattern + ')/:columnname(provisional)/toggle', toggleOptions)

function toggleOptions (rmx) {
    var message = 'Starting...',
        pooltoken = rmx.params.pooltoken, email = rmx.params.email, datetime = rmx.params.datetime
    db[rmx.params.columnname + 'toggle']({
        token:1, post:rmx.params
    }, function (err, result) {
        if ( err || 0 === result.affectedRows ) {
            console.log(rmx.params.columnname, pooltoken, email, datetime, err)
            message = 'Toggle ' + rmx.params.columnname + ' failed.'
            templates(
                ['layout.html', 'requestswrap.html', 'poolrequestmsg.html'],
                {
                    '.requests': {href: '/pools/' + rmx.params.pooltoken},
                    '#message': message, '#poolname': rmx.params.columnname + ' NOT toggled'
                },
                rmx.res
            )
        }
        else if ( 0 < result.affectedRows ) {
            //console.log(rmx.params.deletetype + ' toggle')
            message = rmx.params.deletetype + ' toggle'
            redirect(rmx.res, '/pools/' + rmx.params.pooltoken)
        }
    })
}

// request form
router.addRoute('/:pooltoken(' + idpattern + ')', function (rmx) {
    db.poolinfo({pooltoken:rmx.params.pooltoken}, function (err, poolinfo) {
        if ( 0 === poolinfo.length ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'poolrequestmsg.html'],
                {'#message': message, '#poolname': 'not found'},
                rmx.res
            )
        }
        else if ( 0 < poolinfo.length ) {
            poolinfo = poolinfo[0]
            db.poolcurr({pooltoken:rmx.params.pooltoken}, function (err, poolcurr) {
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
                        rmx.res
                    )
                }
                else if ( 0 < poolcurr.length ) {
                    templates(
                        ['layout.html', 'request_form.html'],
                        {
                            'head': {_mapappend: {'link': [{'link':{href:'/css/form.css'}}]}},
                            '#poolname': poolinfo.poolname, '#pooltoken': rmx.params.pooltoken,
                            '#scripts': {_mapappend: {
                                'script': [{'script':{src:'/js/request_form.js'}}]
                            }}
                        },
                        rmx.res
                    )
                }
            })
        }
    })
})

// request post
router.addRoute('/:pooltoken(' + idpattern + ')/post', function (rmx) {
    var message = 'Starting...'
    db.poolcurr({pooltoken:rmx.params.pooltoken}, function (err, poolinfo) {
        if ( 0 === poolinfo.length ) {
            //console.log('no pool found')
            message = 'Pool not found.'
            templates(
                ['layout.html', 'message.html'],
                {'#message': message, '#pooltoken': rmx.params.pooltoken, '#email': rmx.params.email},
                rmx.res
            )
        }
        else if ( 0 < poolinfo.length ) {
            var poolargs = {pooltoken:rmx.params.pooltoken, email:rmx.params.email}
            db.request(poolargs, function (err, request) {
                if ( 0 === request.length ) {
                    //console.log('no record found')
                    message = 'Okay to make request.'
                    db.requestinsert({post:rmx.params}, function (err, requestinsertobj) {
                        //console.log('request inserted')
                        message = 'Request accepted.'
                        templates(
                            ['layout.html', 'message.html'],
                            {'#message': message, '#pooltoken': rmx.params.pooltoken, '#email': rmx.params.email},
                            rmx.res
                        )
                    })
                }
                else if ( 0 < request.length ) {
                    //console.log('record found')
                    message = 'Request NOT accepted. Only one request per day allowed.'
                    templates(
                        ['layout.html', 'message.html'],
                        {'#message': message, '#pooltoken': rmx.params.pooltoken, '#email': rm.params.email},
                        rmx.res
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

