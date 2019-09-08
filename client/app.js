var app = angular.module("drishyam", ['ngResource', 'ngRoute']);

app.controller('mainController', function($scope,$window) {
})

app.controller("loginController", function($scope, $location, $rootScope, $resource,  $http, $window) {
    $window.localStorage["username"] = "";
    $scope.errmessage = " ";
    $scope.page = "Login";
    $window.localStorage["loggedin"] = 0;
    $scope.item = {}
    $scope.login = function(item) {
      $http({
        url: '/login',
        method: 'post',
        data: item
      }).then(function(data){
        if(data.data.success){

        $window.localStorage["loggedin"]=1;
        $window.localStorage["username"]=data.data.username;
        alert(data.data.reason);        
        $location.path('/dashboard').replace();
      }
      else {
        alert(data.data.reason);
      }
      },function(err){
        alert("Login Failed");
      })
    }
  });


  app.controller("signupController", function($scope, $location, $rootScope, $resource,  $http, $window) {
    $scope.errmessage = " ";
    $scope.page = "Signup";
    $window.localStorage["loggedin"] = 0;
    $scope.item = {}
    $scope.signup = function(item) {
      $http({
        url: '/signup',
        method: 'post',
        data: item
      }).then(function(data){
        if(data.data.success){
        $window.localStorage["loggedin"]=1;
        $window.localStorage["username"]=data.data.email;
        alert(data.data.reason);        
        $location.path('/login').replace();
      }
      else {
        alert(data.data.reason);
      }
      },function(err){
        alert("Signup Failed");
      })
    }
  });



  app.controller("dashboardController", function($scope, $location, $rootScope, $resource,  $http, $window) {
    $scope.username = $window.localStorage["username"];
    var un = $scope.username;

    $scope.url = "http://localhost:3000/video?username="+un;
    $scope.url1 = "http://localhost:3000/video?username=branch1@synd.com";
    $scope.url2 = "http://localhost:3000/video?username=branch2@synd.com";


    // $scope.url = "http://206.189.141.49:3000/video?username="+un;
    // $scope.url1 = "http://206.189.141.49:3000/video?username=branch1@synd.com";
    // $scope.url2 = "http://206.189.141.49:3000/video?username=branch2@synd.com";



    var ranks=$resource('/ranks');
    ranks.query(function(result){
      $scope.ranks = result[0].data;
    })

    var incidents=$resource('/incident?username='+un);
    incidents.query(function(result){
      $scope.incidents = result[0].data;
    })

  });

app.config(function($routeProvider) {
    $routeProvider
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'loginController'
    })
    .when('/signup', {
      templateUrl: 'views/signup.html',
      controller: 'signupController'
    })
    .when('/dashboard', {

      templateUrl: 'views/dashboard.html',
      controller: 'dashboardController'
    })
    .when('/archieve', {
      resolve: {
      "check": function($window,$location) {
        if($window.localStorage["loggedin"] != 1) {
          $location.path('/login');
          return;
          }
        }
      },
      templateUrl: 'views/archieve.html',
      controller: 'dashboardController'
    })
    .when('/videofootage', {
      resolve: {
      "check": function($window,$location) {
        if($window.localStorage["loggedin"] != 1) {
          $location.path('/login');
          return;
          }
        }
      },
      templateUrl: 'views/videofootage.html',
      controller: 'dashboardController'
    })
    .otherwise({
      redirectTo: '/login'
    })
  });
  