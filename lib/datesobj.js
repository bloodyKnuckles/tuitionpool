var dd = new Date(),
  getfullyear  = dd.getFullYear(),
  getmonth     = numpad(dd.getMonth() + 1),
  getdate      = numpad(dd.getDate())

exports.todaydate = getfullyear + '-' + getmonth + '-' + getdate
exports.nowdate   = exports.todaydate + ' ' + dd.toTimeString().split(' ')[0]

exports.dateappendtime = function (dt, time_str) {
  var dt_date = new Date(parseInt(dt, 10))
  return dt_date.getFullYear() +
  '-' + numpad(dt_date.getMonth() + 1) +
  '-' + numpad(dt_date.getDate()) +
  ' ' + time_str
}

function numpad (num) {
  return String('00' + num).slice(-2)
}

