exports.todaydate = function () {
  var dd = new Date(),
    getfullyear  = dd.getFullYear(),
    getmonth     = numpad(dd.getMonth() + 1),
    getdate      = numpad(dd.getDate())
  return getfullyear + '-' + getmonth + '-' + getdate
}

exports.nowdate = function () {
  var dd = new Date(),
    getfullyear  = dd.getFullYear(),
    getmonth     = numpad(dd.getMonth() + 1),
    getdate      = numpad(dd.getDate())
  return getfullyear + '-' + getmonth + '-' + getdate + ' ' + dd.toTimeString().split(' ')[0]
}

exports.dateFormatEpoch = function (epoch) {
  var dt_date = new Date(parseInt(epoch * 1000, 10))
  return dt_date.getFullYear() +
  '-' + numpad(dt_date.getMonth() + 1) +
  '-' + numpad(dt_date.getDate()) +
  ' ' + numpad(dt_date.getHours()) +
  ':' + numpad(dt_date.getMinutes()) +
  ':' + numpad(dt_date.getSeconds())
}

exports.dateAppendTime = function (dt, time_str) {
  var dt_date = new Date(parseInt(dt, 10))
  return dt_date.getFullYear() +
  '-' + numpad(dt_date.getMonth() + 1) +
  '-' + numpad(dt_date.getDate()) +
  ' ' + time_str
}

function numpad (num) {
  return String('00' + num).slice(-2)
}

