//var requests = document.getElementById('listrequests').querySelectorAll('tr')

//Object.keys(requests).forEach(function (idx) {
//    console.log(requests[idx].cells[0].textContent)
//})

//var pooltoken = document.getElementById('pooltoken').textContent
var requestdeletes = document.querySelectorAll('td div.actions a.requestdelete')

Object.keys(requestdeletes).forEach(function (idx) {
    var actionsdiv = requestdeletes[idx].parentNode
    if ( actionsdiv.parentNode.className.match(/\bstrikeme\b/) ) {
        actionsdiv.innerHTML = '<a class="undelete" href="#">Undelete</a>'
        actionsdiv.innerHTML += '&nbsp;&nbsp;|&nbsp;&nbsp;<a class="deleteperm" href="#">Delete Permanently</a>'
        actionsdiv.querySelector('.undelete').addEventListener('click', function (evt) {
            var requestrow = evt.target.parentNode.parentNode.parentNode.cells,
                email    = requestrow[1].textContent,
                datetime = requestrow[3].textContent,
                form     = document.getElementById('requestdeleteform')
            form.email.value = email, form.datetime.value = datetime
            form.action = form.action.replace(/\/request\/.+$/, '/request/reactivate')
            form.submit()
        })
        actionsdiv.querySelector('.deleteperm').addEventListener('click', function (evt) {
            var requestrow = evt.target.parentNode.parentNode.parentNode.cells,
                email    = requestrow[1].textContent,
                datetime = requestrow[3].textContent,
                form     = document.getElementById('requestdeleteform')
            form.email.value = email, form.datetime.value = datetime
            form.action = form.action.replace(/\/request\/.+$/, '/request/delete')
            form.submit()
        })
    }
    else {
        requestdeletes[idx].addEventListener('click', function (evt) {
            var requestrow = evt.target.parentNode.parentNode.parentNode.cells,
                email    = requestrow[1].textContent,
                datetime = requestrow[3].textContent,
                form     = document.getElementById('requestdeleteform')
            form.email.value = email, form.datetime.value = datetime
            form.action = form.action.replace(/\/request\/.+$/, '/request/deactivate')
            form.submit()
        })
    }
})

