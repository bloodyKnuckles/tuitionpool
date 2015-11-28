//var requests = document.getElementById('listrequests').querySelectorAll('tr')

//Object.keys(requests).forEach(function (idx) {
//    console.log(requests[idx].cells[0].textContent)
//})

var pool = document.getElementById('pool').textContent
var requestdeletes = document.querySelectorAll('a.actions.requestdelete')

Object.keys(requestdeletes).forEach(function (idx) {
    requestdeletes[idx].addEventListener('click', function (evt) {
        var requestrow = evt.target.parentNode.parentNode.cells,
            email    = requestrow[1].textContent,
            datetime = requestrow[3].textContent
        console.log(pool, email, datetime)
    })
})

