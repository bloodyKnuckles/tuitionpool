var datesobj = require('../lib/datesobj')
var test = require('tape')

var dd = new Date(),
  getfullyear = dd.getFullYear(),
  getmonth = String('00' + (dd.getMonth() + 1)).slice(-2),
  getdate = String('00' + dd.getDate()).slice(-2),

  todaydate = getfullyear + '-' + getmonth + '-' + getdate
  '-' + String('00' + (dd.getMonth() + 1)).slice(-2) +
  '-' + String('00' + dd.getDate()).slice(-2),
  nowdate = todaydate + ' ' + dd.toTimeString().split(' ')[0]

test('todaydate', function (tt) {
  tt.plan(1)
  tt.equal(datesobj.todaydate, todaydate)
})

