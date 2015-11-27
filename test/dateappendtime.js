var datesobj = require('../lib/datesobj')
var test = require('tape')

test('date append time', function (tt) {
    tt.plan(1)

    var res = '2015-11-26 07:00:00'

    tt.equal(datesobj.dateappendtime(1448554244000, '07:00:00'), res)
})

