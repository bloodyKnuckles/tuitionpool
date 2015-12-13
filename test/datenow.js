var datesobj = require('../lib/datesobj')
var test = require('tape')

var dd = new Date(),
  getfullyear = dd.getFullYear(),
  getmonth = String('00' + (dd.getMonth() + 1)).slice(-2),
  getdate = String('00' + dd.getDate()).slice(-2),

  todaydate = getfullyear + getmonth + getdate
  nowdate = todaydate + ' ' + dd.toTimeString().split(' ')[0]

test('nowdate', function (tt) {
  tt.plan(1)
  tt.equal(datesobj.nowdate, nowdate)
})

