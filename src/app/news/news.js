angular.module( 'orderCloud' )
    .config(NewsConfig)
    .factory('NewsService', NewsService)
    .controller('NewsListCtrl', NewsListController)
    .controller('NewsDetailCtrl', NewsDetailController)
    .controller('NewsCreateCtrl', NewsCreateController)
    .filter('newspreview', newspreview)
;

function NewsConfig($stateProvider) {
    $stateProvider
        .state('news', {
            parent: 'base',
            url: '/news',
            templateUrl: 'news/templates/news.list.tpl.html',
            controller: 'NewsListCtrl',
            controllerAs: 'news',
            resolve: {
                NewsArticles: function(NewsService) {
                    return NewsService.List();
                }
            }
        })
        .state('news.create', {
            url: '/create',
            templateUrl:'news/templates/news.create.tpl.html',
            controller: 'NewsCreateCtrl',
            controllerAs: 'newsCreate'
        })
        .state('news.detail', {
            url: '/:id',
            templateUrl: 'news/templates/news.detail.tpl.html',
            controller: 'NewsDetailCtrl',
            controllerAs: 'newsDetail',
            resolve: {
                NewsArticle: function($stateParams, NewsService) {
                    return NewsService.Get($stateParams.id);
                }
            }
        })
    ;
}

function NewsService($q, $firebaseObject, firebaseurl) {
    var service = {
        Get: _get,
        List: _list,
        Create: _create,
        Update: _update,
        Delete: _delete
    };

    function _get(id) {
        var deferred = $q.defer();

        var ref = new Firebase(firebaseurl + '/News/').child(id);
        var article = $firebaseObject(ref);
        article.$loaded()
            .then(function() {
                deferred.resolve(article);
            })
            .catch(function(error) {
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function _list() {
        var deferred = $q.defer();

        var ref = new Firebase(firebaseurl + '/News');
        ref.on('value', function(data) {
            deferred.resolve(data.val());
        });

        return deferred.promise;
    }

    function _create(article) {
        var deferred = $q.defer();

        article.ID = article.$id;
        article.Timestamp = new Date().toISOString();

        article.$save()
            .then(function(ref) {
                deferred.resolve(ref.key());
            })
            .catch(function(error) {
                deferred.reject(error);
            });

        return deferred.promise;
    }

    function _update(fireBaseArticle) {
        var deferred = $q.defer();

        fireBaseArticle.$save()
            .then(function() {
                deferred.resolve(fireBaseArticle);
            })
            .catch(function() {
                deferred.reject();
            });

        return deferred.promise;
    }

    function _delete(fireBaseArticle) {
        return fireBaseArticle.$remove();
    }

    return service;
}

function NewsListController($state, NewsArticles) {
    var vm = this;
    vm.newsArticles = NewsArticles;

    vm.goToArticle = function(article) {
        $state.go('news.detail', {id: article.ID});
    }
}

function NewsDetailController($state, NewsService, NewsArticle) {
    var vm = this;
    vm.newsArticle = NewsArticle;

    vm.deleteArticle = function() {
        NewsService.Delete(vm.newsArticle)
            .then(function() {
                $state.go('news', {}, {reload:true});
            });
    };

    vm.editing = false;
    vm.editArticle = function() {
        vm.editing = true;
    };

    vm.submit = function() {
        NewsService.Update(vm.newsArticle)
            .then(function() {
                vm.editing = false;
            });
    };
}

function NewsCreateController($state, $firebaseObject, NewsService, firebaseurl) {
    var vm = this;
    var ref = new Firebase(firebaseurl + '/News/' + randomString());
    vm.article = $firebaseObject(ref);

    vm.submit = function() {
        NewsService.Create(vm.article)
            .then(function(id) {
                $state.go('news.detail', {id: vm.article.$id});
            });
    };

    function randomString() {
        var chars = '0123456789';
        var string_length = 15;
        var randomstring = '';
        for (var i = 0; i < string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
        }
        return randomstring;
    }
}

function newspreview() {
    return function(text) {
        var result = '';

        if (text) {
            var plainText = String(text).replace(/<[^>]+>/gm, '');
            if (plainText.length > 300) {
                result = plainText.substr(0, 300) + '...';
            }
            else {
                result = plainText;
            }
        }

        return result;
    };
}