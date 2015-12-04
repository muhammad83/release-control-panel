var appModule = angular.module("tag-checker", ["ng", "ngRoute"]);

appModule.config(function($locationProvider, $routeProvider)
{
    $locationProvider.html5Mode(false);

    $routeProvider
        .when("/",
        {
            templateUrl: "views/products-list.html",
            controller: "ProjectSelectionController"
        })
        .when("/product/:name",
        {
            templateUrl: "views/product.html",
            controller: "ProductDetailsController"
        })
        .otherwise({ redirectTo: "/" });
});

appModule.directive('convertToNumber', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(val) {
                return parseInt(val, 10);
            });
            ngModel.$formatters.push(function(val) {
                return '' + val;
            });
        }
    };
});

appModule.controller("ProjectSelectionController", function ($scope, $location)
{
    $scope.products =
    [
        { name: "cato-frontend" },
        { name: "cato-filing" },
        { name: "cato-submit" },
        { name: "files" },
        { name: "attachments" }
    ];

    $scope.selectProduct = function (product)
    {
        $location.path("/product/" + product.name);
    };
});

appModule.controller("ProductDetailsController", function ($scope, $http, $location, $routeParams)
{
    $scope.name = $routeParams.name;
    $scope.startingTagIndex = null;
    $scope.endingTagIndex = null;
    $scope.endingTags = [{name : "No start tag selected"}];

    $scope.searchForJiraTickets = function ()
    {
        if (!$scope.startingTagIndex || !$scope.endingTagIndex)
        {
            return;
        }

        $scope.searchingInProgress = true;


        $http.get("/stories?serviceName=" + $scope.name + "&startTag=" + encodeURIComponent(getStartTagName()) + "&endTag=" + encodeURIComponent(getEndTagName()) + "&timestamp=" + (+new Date()))
            .success(function (data)
            {
                $scope.searchingInProgress = false;
                $scope.jiraTickets = data;
            });
    };

    $scope.$watch("startingTagIndex", function ()
    {
        $scope.endingTagIndex = null;

        if (!$scope.tags || $scope.tags.length == 0 || !$scope.startingTagIndex)
        {
            return;
        }

        $scope.endingTags = $scope.tags.slice(0, $scope.startingTagIndex + 1);
    });

    $scope.searchingInProgress = true;

    $http.get("/tags?serviceName=" + $scope.name+ "&timestamp=" + (+new Date()))
        .success(function(data)
        {
            $scope.searchingInProgress = false;
            $scope.tags = data.tags.map(function (tag) { return { name: tag }}).reverse();

            for (var index = 0; index < $scope.tags.length; index++)
            {
                if ($scope.tags[index].name == data.currentVersion)
                {
                    $scope.startingTagIndex = index;
                    break;
                }
            }
        });


    function getStartTagName()
    {
        return $scope.tags[$scope.startingTagIndex].name;
    }

    function getEndTagName()
    {
        return $scope.endingTags[$scope.endingTagIndex].name;
    }
});

$(function ()
{
    angular.bootstrap(document.documentElement, ["tag-checker"]);
});