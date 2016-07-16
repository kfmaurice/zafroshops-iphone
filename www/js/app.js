/*
 * Copyright 2016 Maurice Kenmeue Fonwe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

angular.module('starter', ['ionic', 'starter.keys', 'starter.tools', 'starter.controllers', 'starter.addins', 'starter.services', 'ngCordova.plugins.file'])

.run(function($ionicPlatform, $rootScope, $ionicLoading, $state, $cordovaFile, Constants, Common, Globals, Ads, InApp) {
  $rootScope.$on('loading:show', function() {
    $ionicLoading.show({template: 'loading...'})
  });

  $rootScope.$on('loading:hide', function() {
    $ionicLoading.hide()
  });
	
	$ionicLoading.show({ template: Constants.load_loading });
	
  $ionicPlatform.ready(function() {
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      // cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }

		Globals.latitude = 49.051442;
		Globals.longitude = 8.257338;

		// advertising - interstitial dismissal
		document.addEventListener('onAdDismiss',function(data){
			Ads.showBanner();
		});
		document.addEventListener("deviceready", onDeviceReady, false);

		function onDeviceReady() {
			// location popup
			Common.initLocation($cordovaFile);

			// push notifications
			var push = PushNotification.init({
				"ios": {
					"alert": true,
					"sound": true,
					"badge": true,
					"clearBadge": true
				}
			});
			var toast = {
				message: Constants.push_message,
				duration: "long",
				position: "center"
			};
			var notified = false;
			
			// iap
			InApp.registerAds();
						
			// push notifications
			push.getApplicationIconBadgeNumber(function(count) {
				if(count) {
					notified = true;
					window.plugins.toast.showWithOptions(toast);
				}
			});
			push.setApplicationIconBadgeNumber(function() {}, function() {}, 0);
			
			push.on('registration', function(data) {
				Common.service().push.apns.registerNative(data.registrationId, []);
			});

			push.on('notification', function(data) {
				if(data.additionalData.foreground) {
					toast.message = data.message + ':\n\n' + data.additionalData.message.replace(/\+/g, '\n');
					window.plugins.toast.showWithOptions(toast);
				}
				else if(!notified) {
					window.plugins.toast.showWithOptions(toast);
				}
				
				// call finish to tell the OS know we are done
				push.finish(function() {
				});
			});
			
			push.on('error', function(e) {
			});
			
			// advertising
			Ads.showBanner();
		}
  });
})

.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

	$httpProvider.interceptors.push(function($rootScope) {
    return {
      request: function(config) {
        $rootScope.$broadcast('loading:show');
        return config;
      },
      response: function(response) {
        $rootScope.$broadcast('loading:hide');
        return response;
      }
    };
  });
	
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
	.state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.all', {
    url: '/all',
    views: {
      'tab-all': {
        templateUrl: 'templates/tab-all.html',
        controller: 'AllCtrl'
      }
    }
  })

  .state('tab.all-group', {
		url: '/all/:typeName',
		views: {
			'tab-all': {
				templateUrl: 'templates/tab-typed.html',
				controller: 'TypedCtrl'
			}
		}
	})
	
  .state('tab.all-group-detail', {
		url: '/all/detail/:zopId',
		views: {
			'tab-all': {
				templateUrl: 'templates/tab-detail.html',
				controller: 'DetailCtrl'
			}
		}
	})
	
	.state('settings', {
    url: '/settings/:back',
//    views: {
//      'settings': {
			templateUrl: 'templates/settings.html',
			controller: 'SettingsCtrl'
//      }
//    }
  })

  .state('tab.nearest', {
		url: '/nearest',
		views: {
			'tab-nearest': {
				templateUrl: 'templates/tab-nearest.html',
				controller: 'NearestCtrl'
			}
		}
	})
	
	.state('tab.nearest-detail', {
		url: '/nearest/detail/:zopId',
		views: {
			'tab-nearest': {
				templateUrl: 'templates/tab-detail.html',
				controller: 'DetailCtrl'
			}
		}
	})

  .state('tab.new', {
    url: '/new',
    views: {
      'tab-new': {
        templateUrl: 'templates/tab-new.html',
        controller: 'NewCtrl'
      }
    }
	});

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/all');

});
