var parentNodeSelector = require('parent-node-selector')

var requestdeletes = document.querySelectorAll('td div.actions a.requestdelete')

Object.keys(requestdeletes).forEach(function (idx) {
    var actionsdiv = parentNodeSelector(requestdeletes[idx], 'div.actions')
    if ( parentNodeSelector(actionsdiv, 'td').className.match(/\bstrikeme\b/) ) {
        actionsdiv.innerHTML = '<a class="undelete" href="#">Undelete</a>'
        actionsdiv.innerHTML += '&nbsp;&nbsp;|&nbsp;&nbsp;<a class="deleteperm" href="#">Delete Permanently</a>'
        actionsdiv.querySelector('.undelete').addEventListener('click', function (evt) {
            evt.stopPropagation()
            var requestrow = parentNodeSelector(evt.target,'tr.showme').cells //.parentNode.parentNode.parentNode.cells,
                email    = requestrow[1].textContent,
                datetime = requestrow[3].textContent,
                form     = document.getElementById('requestdeleteform')
            form.email.value = email, form.datetime.value = datetime
            form.action = form.action.replace(/\/request\/.+$/, '/request/reactivate')
            form.submit()
        })
        actionsdiv.querySelector('.deleteperm').addEventListener('click', function (evt) {
            evt.stopPropagation()
            var requestrow = parentNodeSelector(evt.target, 'tr.showme').cells,
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
            evt.stopPropagation()
            var requestrow = parentNodeSelector(evt.target, 'tr.showme').cells,
                email    = requestrow[1].textContent,
                datetime = requestrow[3].textContent,
                form     = document.getElementById('requestdeleteform')
            form.email.value = email, form.datetime.value = datetime
            form.action = form.action.replace(/\/request\/.+$/, '/request/deactivate')
            form.submit()
        })
    }
})

var showcollegelinks = document.querySelectorAll('a.showcollege')

Object.keys(showcollegelinks).forEach(function (idx) {
    showcollegelinks[idx].addEventListener('click', function (evt) {
        evt.stopPropagation()
        parentNodeSelector(evt.target, 'tbody.rowrequest').querySelectorAll('tr')[1].classList.toggle('hideme')
    })
})

var provs = document.querySelectorAll('input.provisional')

Object.keys(provs).forEach(function (idx) {
    provs[idx].addEventListener('click', function (evt) {
        evt.stopPropagation()
        console.log('prov clicked')
    })
})

var rowsshown = document.querySelectorAll('tr.showme')

Object.keys(rowsshown).forEach(function (idx) {
    rowsshown[idx].addEventListener('click', function (evt) {
        evt.stopPropagation()
        parentNodeSelector(evt.target, 'tbody').querySelectorAll('tr')[1].classList.toggle('hideme')
    })
})

