// connect to unisia if hcct, otherwise to pontual

var baseRef = new Firebase("https://aguardando.firebaseio.com/")

var authData = baseRef.getAuth();

if(authData) {
  // alert(authData.uid);
  if (authData.uid === 'simplelogin:6') {
    // alert("Welcome hcct");
    var ref = new Firebase("https://aguardando.firebaseio.com/unisia");
  } else {
    // alert("Welcome to Pontual");
    var ref = new Firebase("https://aguardando.firebaseio.com/pontual");
  }
} else {
  // alert("Please log in");
  var ref = baseRef;
}
