Node.prototype.parentNodeSelector = require('parent-node-selector')

var actiondeletes = document.querySelectorAll('td div.actions a.actiondelete')
var moredeleteactions = '<a class="undelete" href="#">Undelete</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a class="deleteperm" href="#">Delete Permanently</a>'

Object.keys(actiondeletes).forEach(function (idx) {
    var actionsdiv = actiondeletes[idx].parentNodeSelector('div.actions')
    if ( actionsdiv.parentNodeSelector('td').className.match(/\bstrikeme\b/) ) {
        actionsdiv.innerHTML = moredeleteactions
        actionsdiv.querySelector('.undelete'  ).addEventListener('click', handleAction('request', 'reactivate'))
        actionsdiv.querySelector('.deleteperm').addEventListener('click', handleAction('request', 'delete'))
    }
    else {
        actiondeletes[idx].addEventListener('click', handleAction('request', 'deactivate'))
    }
})

var provs = document.querySelectorAll('input.provisional')
Object.keys(provs).forEach(function (idx) {
    provs[idx].addEventListener('click', function (evt) {
        evt.stopPropagation()
        console.log('prov clicked')
    })
})

showExtra(document.querySelectorAll('a.showextra'))
showExtra(document.querySelectorAll('tr.clickme'))

function showExtra (elems) {
    Object.keys(elems).forEach(function (idx) {
        elems[idx].addEventListener('click', function (evt) {
            evt.stopPropagation()
            var requestinfo = evt.target.parentNodeSelector('tbody.rowinfo').querySelectorAll('tr')
            var showextralink = requestinfo[0].querySelector('a.showextra')
            showextralink.innerHTML = '+' === showextralink.innerHTML? '&ndash;': '+'
            requestinfo[1].classList.toggle('hideme')
        })
    })
}

function handleAction (type, action) {
    return function (evt) {
        evt.stopPropagation()
        var requestrow = evt.target.parentNodeSelector('tr.clickme').cells
            email    = requestrow[1].textContent,
            datetime = requestrow[3].textContent,
            form     = document.getElementById('actiondeleteform')
        form.email.value = email, form.datetime.value = datetime
        form.action = form.action.replace(new RegExp('/' + type + '/.+$', 'i'), '/' + type + '/' + action)
        form.submit()
    }
}

