var path = require('path')
var fs = require('fs')
var xtend = require('xtend')
var templates = require('templateking')({directory:'public'})
var hscript = require('virtual-dom/h')
var queryObject = require('urlquery-to-object')
var nodemailer = require('nodemailer')
var sgTransport = require('nodemailer-sendgrid-transport')
var bcrypt = require('bcrypt')

var Routes = require('routes')
var router = Routes()

var db = require('./dbpools.js')
var idpattern = '[a-z0-9]{32}'
var statedidpattern = '[a-zA-Z]{2}[0-9]{3}'

module.exports = router

// home page
router.addRoute('/', function (req, res, rmx) {
  templates(
    ['layout.html', 'home.html', hscript('span', 'Welcome!')],
    { '#header': 'Tuition Pool' },
    res
  )
})


// pools auth 
router.addRoute('/pools*', function (req, res, rmx) {
  if ( true === req.session.has('usertoken') ) {
    db.usertokenvalid({usertoken:req.session.get('usertoken')}, function (err, usertokenobj) {
      //console.log('usertoken validation', err)
      if ( !usertokenobj || undefined === usertokenobj.usertoken ) {
        redirect(res, '/login')
      }
      else {
        var rm 
        if ( rm = rmx.next() ) {
          rmx = xtend(rm, { state: { url: req.url } }, { params: xtend(rm.params, rmx.params) })
          rm.fn(req, res, rmx)
        }
        else {
          res.end('Page not found.')
        }
      }
    })
    //return
  }
  else { // alternative to return
    redirect(res, '/login')
  }
})

// pools list
router.addRoute('/pools', function (req, res, rmx) {
  //console.log(req.method, req.url, req.headers.host, req.socket.remotePort, req.socket.localPort, req.headers)
  var queryobj = queryObject(rmx.state.url.split('?')[1])
  var message = 'Starting...',
  active = queryobj && 'false' === queryobj.active? [true,false]: true
  db.pools({usertoken:req.session.get('usertoken'), active:active}, function (err, pools) {
    if ( 0 === pools.length ) {
      //console.log('no pools found')
      message = 'No pools found.'
      poolsList(pools)
    }
    else if ( 0 < pools.length ) {
      //console.log('pools found')
      db.poolsinactive({usertoken:req.session.get('usertoken')}, function (err, poolsinactive) {
        pools = pools.map(function (poolinfo) {
          message = 'Pools found: '
          return {
            'td': {class:{append: poolinfo.active? '': ' strikeme'}},
            'a.poolname': {
              _text: poolinfo.poolname, 'href': '/pools/' + poolinfo.pooltoken
            },
            '.datetime_start': poolinfo.datetime_start,
            '.datetime_end': poolinfo.datetime_end,
            '.requestscount': poolinfo.requestscount,
            '.pooltoken': poolinfo.pooltoken,
            '.requestlink': {href: '/' + poolinfo.pooltoken, _text: 'https://tuitionpool.org/' + poolinfo.pooltoken}
          }
        })
        poolsList(pools, poolsinactive.cnt)
      })
    }
  })

  function poolsList (pools, poolsinactive) {
    var querystr = queryObject.queryString(queryobj, (true !== active? {active:false}: {active:undefined}))
    if ( '' !== querystr ) { querystr = '?' + querystr }
    var activequerystr = queryObject.queryString(queryobj, (true === active? {active:false}: {active:undefined}))
    if ( '' !== activequerystr ) { activequerystr = '?' + activequerystr }

    templates(
      ['layout.html', 'poolslist.html'],
      {
        'head': {_mapappend: {
          'link': [{'link':{href:'/css/list.css'}}]
        }},
        '#pagetitle': message, '#countitems': pools.length,
        '#listitems': {_map: {'.rowinfo': pools}},
        '#actionform': {action: '/pools/pooltoken/deactivate'},
        '#returnto': {value: '/pools' + querystr},
        '#includeactive': {
          class: { append: 0 === poolsinactive? ' hideme': ''},
          href: '/pools' + activequerystr,
          _text: (true === active? 'Include': 'Hide') + ' deleted pools' 
        },
        '#scripts': {_mapprepend: {
          'script': [
            {'script':{src:undefined, _html:'var test = "fun"'}},
            {'script':{src:'/js/poolswrap.js'}},
            {'script':{src:'/js/pools.js'}}
          ]
        }}
      },
      res
    )
  }
})

// pool requests list
router.addRoute('/pools/:pooltoken(' + idpattern + ')', function (req, res, rmx) {
  var queryobj = queryObject(rmx.state.url.split('?')[1]),
    message = 'Starting...',
    active = queryobj && 'false' === queryobj.active? [true,false]: true
  db.poolinfo({pooltoken:rmx.params.pooltoken}, function (err, poolinfo) {
    if ( undefined === poolinfo ) {
      message = 'Pool not found.'
      templates(['layout.html', 'poolswrap.html', hscript('div', message)], {}, res)
    }
    else {
      var poolargs = {usertoken:req.session.get('usertoken'), pooltoken:rmx.params.pooltoken, active:active}
      db.requests(poolargs, function (err, requests) {
        if ( 0 === requests.length ) {
          //console.log('no requests found')
          message = 'No requests found.'
          poolRequests(requests, poolinfo)
        }
        else if ( 0 < requests.length ) {
          db.requestsinactive({usertoken:req.session.get('usertoken'), pooltoken:rmx.params.pooltoken}, function (err, requestsinactive) {
            //message = 'Requests found for Pool ' + rmx.params.pooltoken + ': '
            requests = requests.map(function (request) {
              var retrequest = {
                'td': {class:{
                  append: 
                    (request.active? '': ' strikeme') +
                    (poolinfo.datetime_start <= (new Date(request.datetime).getTime() / 1000)
                      ? '': ' hiliteme')
                }},
                '.name': request.name,
                '.email': request.email,
                '.datetime': request.datetime,
                '.datetime_text': request.datetime_text,
                '.datetime': request.datetime,
                '.coursenumber': request.coursenumber,
                '.coursename': request.coursename,
                '.universityname': ' - ' + request.universityname,
                '.coursetype': request.coursetype,
                '.coursedegree': request.coursedegree? 'degree': '<strike style="color: #999;">degree</strike>'
              }
              retrequest['.provisional'] = 1 === request.provisional
                  ? { checked: 'checked'}: ''
              return retrequest
            })
            poolRequests(requests, poolinfo, requestsinactive.cnt)
          })
        }
      })
    }
  })

  function poolRequests (requests, poolinfo, requestsinactive) {
    var querystr = queryObject.queryString(queryobj, (true !== active && 0 < requestsinactive? {active:false}: {active:undefined}))
    if ( '' !== querystr ) { querystr = '?' + querystr }
    var activequerystr = queryObject.queryString(queryobj, (true === active && 0 < requestsinactive? {active:false}: {active:undefined}))
    if ( '' !== activequerystr ) { activequerystr = '?' + activequerystr }
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
          '#requestlink'   : {href: '/' + rmx.params.pooltoken, _text: 'https://tuitionpool.org/' + rmx.params.pooltoken},
          '#listitems': {_map: {'.rowinfo': requests}},
          '#pooltoken': rmx.params.pooltoken,
          '#actionform': {action:'/pools/'+ rmx.params.pooltoken + '/request/deactivate'},
          '#returnto': {value: '/pools/' + rmx.params.pooltoken + querystr},
          '#includeactive': {
            class: { append: 0 === requestsinactive? ' hideme': ''},
            href: '/pools/' + rmx.params.pooltoken + activequerystr,
            _text: (true === active? 'Include': 'Hide') + ' deleted requests' 
          },
          '#scripts': {_mapappend: {
            'script': [
              {'script':{src:'/js/requests.js'}},
              {'script':{src:'/js/poolswrap.js'}}
            ]
          }},
        },
        res
      )
   } 
})

// pool edit
router.addRoute('/pools/:pooltoken(' + idpattern + ')/edit|/pools/edit', function (req, res, rmx) {
  var message = 'Starting...'
  if ( !rmx.params.pooltoken ) {
    rmx.params.pooltoken = ''
    poolform({poolname: '', datetime_start: '', datetime_end: ''})
  }
  else {
    db.poolinfo({pooltoken:rmx.params.pooltoken}, function (err, poolinfo) {
      if ( undefined === poolinfo ) {
        message = 'Pool not found.'
        poolinfo = {poolname: '', datetime_start: '', datetime_end: ''}
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
          'script': [
            {'script':{src:'/js/pool_form.js'}},
            {'script':{src:'/js/poolswrap.js'}}
          ]
        }}
      },
      res
    )
  }
})

// pool post
router.addRoute('/pools/:pooltoken(' + idpattern + ')/post|/pools/post', function (req, res, rmx) {
  var message = 'Starting...'
  if ( !rmx.params.pooltoken ) {
    db.poolinsert({usertoken:req.session.get('usertoken'), post:rmx.params}, function (err, poolinsert) {
      //console.log(err, 'pool inserted')
      message = 'Pool inserted.'
      redirect(res, '/pools')
    })
  }
  else {
    db.poolinfo({pooltoken:rmx.params.pooltoken}, function (err, poolinfo) {
      if ( undefined === poolinfo ) {
        //console.log('no pool found')
        message = 'Pool not found.'
        templates(
          ['layout.html', 'poolswrap.html', 'message.html'],
          {
            '#message': message, '#poolname': rmx.params.pooltoken,
            '#scripts': {_mapappend: {
              'script': [
                {'script':{src:'/js/poolswrap.js'}}
              ]
            }}
          },
          res
        )
      }
      else {
        var poolargs = {usertoken:req.session.get('usertoken'), pooltoken:rmx.params.pooltoken, post:rmx.params}
        db.poolupdate(poolargs, function (err, poolupdateobj) {
          //console.log('pool updated')
          message = 'Pool updated.'
          redirect(res, '/pools/' + rmx.params.pooltoken)
        })
      }
    })
  }
})

// pool delete
router.addRoute('/pools/:pooltoken(' + idpattern + ')/:deletetype([dr]eactivate|delete)', deleteOptions)

// request delete
router.addRoute('/pools/:pooltoken(' + idpattern + ')/request/:deletetype([dr]eactivate|delete)', deleteOptions)

function deleteOptions (req, res, rmx) {
  var message = 'Starting...',
  pooltoken = rmx.params.pooltoken, email = rmx.params.email, datetime = rmx.params.datetime
  db[rmx.params.itemtype + rmx.params.deletetype]({
    usertoken:req.session.get('usertoken'), post:rmx.params
  }, function (err, request) {
    if ( err || 0 === request.affectedRows ) {
      console.log(rmx.params, err)
      message = 'Request deactivation failed.'
      templates(
        ['layout.html', 'poolswrap.html', 'requestswrap.html', 'poolrequestmsg.html'],
        {
          '.requests': {href: '/pools/' + rmx.params.pooltoken},
          '#message': message,
          '#poolname': rmx.params.itemtype + ' NOT ' + rmx.params.deletetype + 'd',
          '#scripts': {_mapappend: {
            'script': [
              {'script':{src:'/js/poolswrap.js'}}
            ]
          }}
        },
        res
      )
    }
    else if ( 0 < request.affectedRows ) {
      //console.log(rmx.params.itemtype + ' ' + rmx.params.deletetype) 
      //message = rmx.params.itemtype + ' ' + rmx.params.deletetype
      var returnto = rmx.params.returnto
      var pathparts = returnto.split('?') 
      var queryobj = queryObject(pathparts[1]) 
      if ( false === queryobj.active ) {
        db[rmx.params.itemtype + 'sinactive']({usertoken:req.session.get('usertoken'), pooltoken:pooltoken}, function (err, inactive) {
          if ( 0 === inactive.cnt ) {
            returnto = pathparts[0] + '?' + queryObject.queryString(queryobj, {active:undefined})
          }
          redirect(res, returnto)
        })
      }
      else {
        redirect(res, returnto)
      }
    }
  })
}

// toggle
router.addRoute('/pools/:pooltoken(' + idpattern + ')/:columnname(provisional)/toggle', toggleOptions)

function toggleOptions (req, res, rmx) {
  var message = 'Starting...',
    pooltoken = rmx.params.pooltoken, email = rmx.params.email, datetime = rmx.params.datetime
  db[rmx.params.columnname + 'toggle']({
      tokentoken:req.session.get('usertoken'), post:rmx.params
    }, function (err, result) {
      if ( err || 0 === result.affectedRows ) {
        console.log(rmx.params.columnname, pooltoken, email, datetime, err)
        message = 'Toggle ' + rmx.params.columnname + ' failed.'
        templates(
          ['layout.html', 'requestswrap.html', 'poolrequestmsg.html'],
          {
            '.requests': {href: '/pools/' + rmx.params.pooltoken},
            '#message': message, '#poolname': rmx.params.columnname + ' NOT toggled',
            '#scripts': {_mapappend: {
              'script': [
                {'script':{src:'/js/poolswrap.js'}}
              ]
            }}
          },
          res
        )
      }
      else if ( 0 < result.affectedRows ) {
        //console.log(rmx.params.deletetype + ' toggle')
        message = rmx.params.deletetype + ' toggle'
        redirect(res, '/pools/' + rmx.params.pooltoken)
      }
    }
  )
}


// current/next pool
router.addRoute('/:statedid(' + statedidpattern + ')', function (req, res, rmx) {
  db.userinfodid(rmx.params.statedid, function (err, userinfo) {
    if ( !err && undefined !== userinfo ) {
      poolNext(userinfo.usertoken)
      return
    }
    else { message = 'District ID error.' }

    templates(
      ['layout.html', 'message.html'],
      {'#message': message},
      res
    )
  })

  function poolNext (usertoken) {
    db.poolnext(usertoken, function (err, poolnext) {
      if ( poolnext && poolnext.current ) {
        redirect(res, '/' + poolnext.pooltoken)
      }
      else {
        //console.log('pool not active')
        var nowepoch = new Date() / 1000
        var provisionallink = poolnext && poolnext.datetime_start_seconds - 86400 < Math.floor(nowepoch) &&
          poolnext.datetime_end_seconds > nowepoch
          ? '<p>...unless <a href="/' + poolnext.pooltoken + '?provisional">you have a Provisional License.</a></p>'
          : '',
          poolname = poolnext && poolnext.poolname || 'TBA',
          pooldatetime_start = poolnext && poolnext.datetime_start || '',
          pooldatetime_provstart = poolnext && poolnext.datetime_provstart || '',
          pooldatetime_end = poolnext && poolnext.datetime_end || ''

        message = 'No current pool. Next pool:'
        templates(
          ['layout.html', 'poolrequestmsg.html', 'guidelines.html'],
          {
            '#message': message,
            '#poolname': poolname +
              '<p>Starts: ' + pooldatetime_start +
              '&nbsp;&nbsp;<span class="help">(Provisional starts: ' + pooldatetime_provstart + ')</span>' +
              '<br>Ends: '  + pooldatetime_end +
              '</p>' + provisionallink
          },
          res
        )
      }
    })
  }
})

// request form
router.addRoute('/:pooltoken(' + idpattern + ')', function (req, res, rmx) {
  db.poolinfo({pooltoken:rmx.params.pooltoken}, function (err, poolinfo) {
    if ( undefined === poolinfo ) {
      //console.log('no pool found')
      message = 'Pool not found.'
      templates(
        ['layout.html', 'poolrequestmsg.html'],
        {'#message': message, '#poolname': 'not found'},
        res
      )
    }
    else {
      var queryobj = queryObject(rmx.state.url.split('?')[1])
      var poolcurrobj = {pooltoken:rmx.params.pooltoken}
      if ( -1 < Object.keys(queryobj).indexOf('provisional') ) {
        poolcurrobj.startdate = poolinfo.datetime_start + 86400
      }
      db.poolcurr(poolcurrobj, function (err, poolcurr) {
        if ( undefined === poolcurr ) {
          //console.log('pool not active')
          var nowepoch = new Date() / 1000
          var provisionallink = poolinfo.datetime_start - 86400 < Math.floor(nowepoch) &&
            poolinfo.datetime_end > nowepoch
            ? '<p>...unless <a href="/' + rmx.params.pooltoken + '?provisional">you have a Provisional License.</a></p>'
            : ''
          message = 'Pool not active.'
          templates(
            ['layout.html', 'poolrequestmsg.html'],
            {
              '#message': message,
              '#poolname': poolinfo.poolname +
                '<p>Starts: ' + poolinfo.datetime_start_short +
                '<br>Ends: '  + poolinfo.datetime_end_short +
                '</p>' + provisionallink
            },
            res
          )
        }
        else {
          templates(
            ['layout.html', 'request_form.html', 'guidelines.html'],
            {
              'head': {_mapappend: {'link': [{'link':{href:'/css/form.css'}}]}},
              '#poolname': poolinfo.poolname, '#pooltoken': rmx.params.pooltoken,
              '#startdate': poolinfo.datetime_start,
              '#startend': poolinfo.datetime_start_short + ' - ' + poolinfo.datetime_end_short,
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
router.addRoute('/:pooltoken(' + idpattern + ')/post', function (req, res, rmx) {
  var message = 'Starting...'
  var poolcurrobj = {pooltoken:rmx.params.pooltoken}
  if ( '1' === rmx.params.provisional ) {
    poolcurrobj.startdate = (new Date() /1000) + 86400
  }
  db.poolcurr(poolcurrobj, function (err, poolinfo) {
    if ( undefined === poolinfo ) {
      //console.log('no pool found')
      message = 'Pool not found.'
      templates(
        ['layout.html', 'message.html'],
        {'#message': message, '#poolname': rmx.params.pooltoken, '#email': rmx.params.email},
        res
      )
    }
    else {
      var poolargs = {pooltoken:rmx.params.pooltoken, email:rmx.params.email}
      db.request(poolargs, function (err, request) {
        if ( undefined === request ) {
          //console.log('no record found')
          message = 'Okay to make request.'
          db.requestinsert({post:rmx.params, usertoken: poolinfo.usertoken}, function (err, requestinsertobj) {
            //console.log('request inserted', err)
            if ( !err ) {
              message = 'Request accepted.'

              db.userinfo(poolinfo.usertoken, function (err, userinfo) {
                if ( !err ) {

                  var email = {
                    to: ['treenopie@gmail.com', userinfo.email],
                    //to: 'treenopie@gmail.com',
                    from: 'treenopie@gmail.com',
                    subject: 'Tuition Pool Request Received',
                    text: 'A Tuition Pool request has been received.\n\n' + 
                      'Name: ' + rmx.params.name + '\n' +
                      'Email: ' + rmx.params.email + '\n\n' +
                      'Provisional: ' + rmx.params.provisional + '\n' +
                      'Degree Seeking: ' + rmx.params.coursedegree + '\n' +
                      'Course Type: ' + rmx.params.coursetype + '\n\n' +
                      'Course #: ' + rmx.params.coursenumber + '\n' +
                      'Course Name: ' + rmx.params.coursename + '\n' +
                      'University Name: ' + rmx.params.universityname
                    //html: 'A <b>Tuition Pool</b> request has been received.'
                  }

                  var mailer = nodemailer.createTransport(sgTransport(
                    {auth: {api_key: process.env.SGAPIKEY}}
                  )).sendMail(email, function(err, res) {
                    if (err) { console.log(err) }
                    //console.log(res);
                  })
                }

                else { message = 'Error retrieving user info.' }
              })

            }
            else { message = 'Error inserting pool.' }

            templates(
              ['layout.html', 'message.html'],
              {'#message': message, '#poolname': poolinfo.poolname, '#email': rmx.params.email},
              res
            )
          })
        }
        else {
          //console.log('record found')
          message = '<span class="alert">Request NOT accepted.</span> Only one request per day allowed.'
          templates(
            ['layout.html', 'message.html'],
            {'#message': message, '#poolname': poolinfo.poolname, '#email': rmx.params.email},
            res
          )
        }
      })
    }
  })
})

router.addRoute('/login', function (req, res, rmx) {

  function login () {
    message = 'Login form.'
    templates(
      ['layout.html', 'login_form.html'],
      {
        '#header': 'Tuition Pool Login',
        'head': {_mapappend: {
          'link': [{'link':{href:'/css/form.css'}}]
        }},
      },
      res
    )
  }

  if ( 'POST' === req.method && undefined !== rmx.params && undefined !== rmx.params.username ) {
    db.usercredentials({username:rmx.params.username}, function (err, usercredentialsobj) {
      //console.log('post user credentials', err)
      if ( !err ) {

        bcrypt.compare(rmx.params.password, usercredentialsobj.passhash, function(err, pass) {
          if ( true === pass ) {
            req.session.regenerate()
            req.session.put('usertoken', usercredentialsobj.usertoken)
            redirect(res, '/pools')
          }
          else { login() }
        })

      }
      else {
        message = 'Error requesting user credentials.'
      }
    })
  }
  else { login() }
})

function redirect (res, where) {
  res.writeHead(302, {'Location': where})
  res.end()
}

