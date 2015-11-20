var datepickr = require('datepickr')
var dd = new Date()

var poolform = document.forms.pool
var pool = document.getElementById('pool')

var dt_start_cal = document.getElementById('datetime_start_cal')
var dt_end_cal   = document.getElementById('datetime_end_cal')
var dt_start = document.getElementById('datetime_start')
var dt_end   = document.getElementById('datetime_end')
var dt_start_val = parseInt(dt_start.value, 10)
var dt_end_val = parseInt(dt_end.value, 10)
var dt_start_arr, dt_start_year, dt_start_month
var dt_end_arr, dt_end_year, dt_end_month

if ( '' === dt_start.value || '0' === dt_start.value ) {
    dt_start_arr = []
    dt_start_year = dd.getFullYear()
    dt_start_month = dd.getMonth()
}
else {
    dt_start_arr = [[dt_start_val,1]]
    dt_start_year = (new Date(dt_start_val)).getFullYear()
    dt_start_month = (new Date(dt_start_val)).getMonth()
}
if ( '' === dt_end.value || '0' === dt_end.value) {
    dt_end_arr = []
    dt_end_year = dd.getFullYear()
    dt_end_month = dd.getMonth()
}
else {
    dt_end_arr = [[dt_end_val,1]]
    dt_end_year = (new Date(dt_end_val)).getFullYear()
    dt_end_month = (new Date(dt_end_val)).getMonth()
}
poolform.action = '/pools/' + (('' !== pool.innerText)? pool.innerText + '/post': 'post')
poolform.botblock.value = 'imbotblocked'
//poolform.addEventListener('submit', function(evt){
//    if ( 0 ) { evt.preventDefault() }
//})

new datepickr(dt_start_cal, function (res) {
    dt_start.value = res.length? res[0][0]: ''
}, {
    singleSelection: true,
    activeDays: dt_start_arr,
    startYear:  dt_start_year,
    startMonth: dt_start_month
})

new datepickr(dt_end_cal, function (res) {
    dt_end.value = res.length? res[0][0]: ''
}, {
    singleSelection: true,
    activeDays: dt_end_arr,
    startYear:  dt_end_year,
    startMonth: dt_end_month
})

