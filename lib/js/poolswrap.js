window.addEventListener('unload', function(event) {
  var dd = new Date()
  dd.setDate(dd.getDate() + 14)
  document.cookie = 'token=' + JSON.stringify({date:Date()}) + '; expires=' + dd.toUTCString() + '; path=/pools; secure;'
})
