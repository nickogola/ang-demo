var app = angular.module('myApp', []).factory('githubService', ['$http', function ($http) {
    var githubUsername;
    var doRequest = function (path) {
        return $http({
            method: 'JSONP',
            url: 'https://api.github.com/users/' + githubUsername + '/' + path + '?callback=JSON_CALLBACK'
        });
    }
    return {
        events: function () { return doRequest('events'); },
        setUsername: function (newUsername) { githubUsername = newUsername; }
    };
}]).factory('audio', ['$document', function ($document) {
    var audio = $document[0].createElement('audio');
    return audio;
}]);

app.factory('player', ['audio', '$rootScope', function (audio, $rootscope) {
    var player = {
        playing: false,
        current: null,
        ready: false,

        play: function (program) {
            // If we are playing, stop the current playback
            if (player.playing) player.stop();
            var url = program.audio[0].format.mp4.$text; // from the npr API
            player.current = program; // Store the current program
            audio.src = url;
            audio.play(); // Start playback of the url
            player.playing = true
        },

        stop: function () {
            if (player.playing) {
                audio.pause(); // stop playback
                // Clear the state of the player
                player.ready = player.playing = false;
                player.current = null;
            }
        },
        currentTime: function () {
            return audio.currentTime;
        },
        currentDuration: function () {
            return parseInt(audio.duration);
        }

    };

    audio.addEventListener('ended', function () {
        $rootScope.$apply(player.stop());
    });

    audio.addEventListener('timeupdate', function (evt) {
        $rootScope.$apply(function () {
            player.progress = player.currentTime();
            player.progress_percent = player.progress / player.currentDuration();
        });
    });

    audio.addEventListener('canplay', function (evt) {
        $rootScope.$apply(function () {
            player.ready = true;
        });
    });
    return player;
}]); //An Angular module is simply a collection of functions that are run when the application is “booted.”

app.factory('nprService', ['$http', function ($http) {
    var doRequest = function (apiKey) {
        return $http({
            method: 'JSONP',
            url: nprUrl + '&apiKey=' + apiKey + '&callback=JSON_CALLBACK'
        });
    }

    return {
        programs: function (apiKey) { return doRequest(apiKey); }
    };
}]);

app.run(function ($rootScope) {
    $rootScope.name = "Ari Lerner";
});

//In Angular, it’s considered a bad idea to try to manipulate the DOM from within a controller. Doing so results in dirty controller code and potential unexpected behavior.

app.controller('MyController', function ($scope) {  // scope it
    $scope.person = { name: "Ari Lerner" };
    var updateClock = function () {
        $scope.clock = new Date();
    };
    var timer = setInterval(function () {
        $scope.$apply(updateClock);
    }, 1000);
    updateClock();

    $scope.roommates = [
{ name: 'Ari' },
{ name: 'Q' },
{ name: 'Sean' },
{ name: 'Anand' }
    ];

    $scope.people = {
        'Ari': 'orange',
        'Q': 'purple',
        'Sean': 'green'
    }
});

// A directive is a fancy name for a function that's attached to a DOM element.

//The ng-init directive is a function that runs at bootstrap time (before runtime). It allows us to set default variables prior to running any other functions during runtime:
//The ng-click directive registers a listener with the DOM element. When the DOM listener fires (when a button or link is clicked), Angular executes the expression and updates the view as normal:
//The ng-show and ng-hide directives show or hide a portion of the DOM depending on whether the expression is truthy.
//The ng-repeat directive loads a template for each item in a collection. The template it clones is the element upon which we call ng-repeat. Each copy of the template gets its own scope.

//Services are singletons, which are objects that are instantiated only once per app (by the $injector). They provide an interface to keep together methods that relate to a specific function.


//$document service gives us a reference to the window.document element

// a filter provides a way to format data to display to the user. 
app.controller('ParentController', function ($scope) {
    $scope.person = { greeted: false };

});

app.controller('ChildController', function ($scope) {
    $scope.sayHello = function () {
        $scope.person.greeted = true;
    }
});

var apiKey = 'MDE5NzMyMTczMDE0MzU2NzI1NjM4ZDBjNA001',
nprUrl = 'http://api.npr.org/query?id=61&fields=relatedLink,title,byline,text,audio,image,pullQuote,all&output=JSON';

app.controller('PlayerController', ['$scope', 'nprService', 'player',
  function ($scope, nprService, player) {
      $scope.player = player;
      nprService.programs(apiKey)
        .success(function (data, status) {
            $scope.programs = data.list.story;
        });
  }]);

app.controller('RelatedController', ['$scope', 'player',
  function ($scope, player) {
      $scope.player = player;

      $scope.$watch('player.current', function (program) {
          if (program) {
              $scope.related = [];
              angular.forEach(program.relatedLink, function (link) {
                  $scope.related.push({
                      link: link.link[0].$text,
                      caption: link.caption.$text
                  });
              });
          }
      });
  }]);

app.controller('DemoController', function ($scope) {
    $scope.counter = 0;
    $scope.add = function (amount) { $scope.counter += amount; };
    $scope.subtract = function (amount) { $scope.counter -= amount; };
});

app.directive('nprLink', function () {
    return {
        restrict: 'EA',
        require: ['^ngModel'],
        replace: true,
        scope: {
            ngModel: '=',
            player: '='
        },
        templateUrl: '/template/nprListItem',
        link: function (scope, ele, attr) {
            scope.duration = scope.ngModel.audio[0].duration.$text;
        }
    }
});

app.directive('playerView', [function () {

    return {
        restrict: 'EA',
        require: ['^ngModel'],
        scope: {
            ngModel: '='
        },
        templateUrl: 'template/playerView.html',
        link: function (scope, iElm, iAttrs, controller) {
            scope.$watch('ngModel.current', function (newVal) {
                if (newVal) {
                    scope.playing = true;
                    scope.title = scope.ngModel.current.title.$text;
                    scope.$watch('ngModel.ready', function (newVal) {
                        if (newVal) {
                            scope.duration = scope.ngModel.currentDuration();
                        }
                    });

                    scope.$watch('ngModel.progress', function (newVal) {
                        scope.secondsProgress = scope.ngModel.progress;
                        scope.percentComplete = scope.ngModel.progress_percent;
                    });
                }
            });
            scope.stop = function () {
                scope.ngModel.stop();
                scope.playing = false;
            }
        }
    };
}]);

app.controller('ServiceController', ['$scope', 'githubService',
    function ($scope, githubService) {
        // Watch for changes on the username property.
        // If there is a change, run the function
        $scope.$watch('username', function (newUsername) {
            // uses the $http service to call the GitHub API
            // and returns the resulting promise
            githubService.events(newUsername)
              .success(function (data, status, headers) {
                  // the success function wraps the response in data
                  // so we need to call data.data to fetch the raw data
                  $scope.events = data.data;
              })
        });
    }]);