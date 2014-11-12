(function() {
  var app = angular.module("LoginApp", ['firebase']);
  var ref = new Firebase("https://aguardando.firebaseio.com");

  function formSetEditable(state) {
    var form = document.getElementById("loginForm");
    var elements = form.elements;
    for (var i = 0, len = elements.length; i < len; i++) {
      elements[i].disabled = !state;
    }
  }

  app.controller("LoginController", ['$scope', '$firebase', function($scope, $firebase) {
    $scope.firebaseLogin = function(userEmail, userPassword) {
      if ($scope.userEmail.length > 0 && $scope.userPassword.length > 0) {
        formSetEditable(false);
      }
      ref.authWithPassword({
        email: $scope.userEmail,
        password: $scope.userPassword,
      }, function(err, authData) {
        if (err === null) {
          document.location.href = 'index.html';
        } else {
          formSetEditable(true);
          document.getElementById("status").innerHTML = err;
        }
      });
    }
  }]);
})();
