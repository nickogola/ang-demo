angular.module('F1FeederApp.controllers', []).

  /* Drivers controller */
  controller('driversController', function ($scope, ergastAPIservice) {
      $scope.nameFilter = null;
      $scope.driversList = [];
      $scope.searchFilter = function (driver) {
          var re = new RegExp($scope.nameFilter, 'i');
          return !$scope.nameFilter || re.test(driver.Driver.givenName) || re.test(driver.Driver.familyName);
      };

      ergastAPIservice.getDrivers().success(function (response) {
          //Digging into the response to get the relevant data
          $scope.driversList = response.MRData.StandingsTable.StandingsLists[0].DriverStandings;
      });
  }).

  /* Driver controller */
  controller('driverController', function ($scope, $routeParams, ergastAPIservice) {
      $scope.id = $routeParams.id;
      $scope.races = [];
      $scope.driver = null;

      ergastAPIservice.getDriverDetails($scope.id).success(function (response) {
          $scope.driver = response.MRData.StandingsTable.StandingsLists[0].DriverStandings[0];
      });

      ergastAPIservice.getDriverRaces($scope.id).success(function (response) {
          $scope.races = response.MRData.RaceTable.Races;
      });
  });

//angular.module('F1FeederApp.controllers', []).
//controller('driversController', function ($scope) {
//    $scope.driversList = [
//      {
//          Driver: {
//              givenName: 'Sebastian',
//              familyName: 'Vettel'
//          },
//          points: 322,
//          nationality: "German",
//          Constructors: [
//              { name: "Red Bull" }
//          ]
//      },
//      {
//          Driver: {
//              givenName: 'Fernando',
//              familyName: 'Alonso'
//          },
//          points: 207,
//          nationality: "Spanish",
//          Constructors: [
//              { name: "Ferrari" }
//          ]
//      }
//    ];
//});