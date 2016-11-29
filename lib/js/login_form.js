var loginform = document.forms.loginform

loginform.elements['username'].addEventListener('blur', function (evt) {
  var errmsg = document.querySelector('#usernameerr')
  if ( '' === evt.target.value ) {
    errmsg.className = errmsg.className.replace('reward', 'warning')
    errmsg.textContent = 'Blank. :('
  }
  else if ( '' !== errmsg.textContent ) {
    errmsg.className = errmsg.className.replace('warning', 'reward')
    errmsg.textContent = ':)'
  }
})

loginform.elements['password'].addEventListener('blur', function (evt) {
  var errmsg = document.querySelector('#passworderr')
  if ( '' === evt.target.value ) {
    errmsg.className = errmsg.className.replace('reward', 'warning')
    errmsg.textContent = 'Blank. :('
  }
  else if ( '' !== errmsg.textContent ) {
    errmsg.className = errmsg.className.replace('warning', 'reward')
    errmsg.textContent = ':)'
  }
})

loginform.addEventListener('submit', function (evt) {
  evt.preventDefault()
  var message = '', delimiter = ''
  if ( '' === evt.target.elements['username'].value ) {
    message += delimiter + 'Username blank.'
    delimiter = '\n'
  }
  if ( '' === evt.target.elements['password'].value ) {
    message += delimiter + 'Password blank.'
    delimiter = '\n'
  }
  if ( '' === message ) { evt.target.submit() }
  else { alert(message) }
})
