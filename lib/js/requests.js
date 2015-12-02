var parentNodeSelector = require('parent-node-selector')

var requestdeletes = document.querySelectorAll('td div.actions a.requestdelete')
var moredeleteactions = '<a class="undelete" href="#">Undelete</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a class="deleteperm" href="#">Delete Permanently</a>'

Object.keys(requestdeletes).forEach(function (idx) {
    var actionsdiv = parentNodeSelector(requestdeletes[idx], 'div.actions')
    if ( parentNodeSelector(actionsdiv, 'td').className.match(/\bstrikeme\b/) ) {
        actionsdiv.innerHTML = moredeleteactions
        actionsdiv.querySelector('.undelete'  ).addEventListener('click', deleteAction('reactivate'))
        actionsdiv.querySelector('.deleteperm').addEventListener('click', deleteAction('delete'))
    }
    else {
        requestdeletes[idx].addEventListener('click', deleteAction('deactivate'))
    }
})

var provs = document.querySelectorAll('input.provisional')
Object.keys(provs).forEach(function (idx) {
    provs[idx].addEventListener('click', function (evt) {
        evt.stopPropagation()
        console.log('prov clicked')
    })
})

showCollege(document.querySelectorAll('a.showcollege'))
showCollege(document.querySelectorAll('tr.showme'))

function showCollege (elems) {
    Object.keys(elems).forEach(function (idx) {
        elems[idx].addEventListener('click', function (evt) {
            evt.stopPropagation()
            var requestinfo = parentNodeSelector(evt.target, 'tbody.rowrequest').querySelectorAll('tr')
            var showcollegelink = requestinfo[0].querySelector('a.showcollege')
            showcollegelink.innerHTML = '+' === showcollegelink.innerHTML? '&ndash;': '+'
            requestinfo[1].classList.toggle('hideme')
        })
    })
}

function deleteAction (action) {
    return function (evt) {
        evt.stopPropagation()
        var requestrow = parentNodeSelector(evt.target,'tr.showme').cells
            email    = requestrow[1].textContent,
            datetime = requestrow[3].textContent,
            form     = document.getElementById('requestdeleteform')
        form.email.value = email, form.datetime.value = datetime
        form.action = form.action.replace(/\/request\/.+$/, '/request/' + action)
        form.submit()
    }
}

