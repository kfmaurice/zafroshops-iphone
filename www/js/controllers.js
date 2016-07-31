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

angular.module('starter.controllers', [])

.controller('AllCtrl', function($scope, $http, $stateParams, $ionicLoading, $state, Constants, Common, Globals, Zops, $cordovaFile) {
	$scope.all = [];
	$scope.title = 'All zops';
	$scope.formatType = Common.formatType;
	$scope.img = Common.img;
	$scope.loading = Constants.load_loading;
	$scope.groupSize = 4;
	
	$scope.init = function(){
		$http.get('json/zops.json').success(function(data){
			var temp = {};
			var types = [];
				
			for(var i = 0; i < data.length; i++) {
				var zop = data[i];
			
				if(!temp[zop.type]) {
					temp[zop.type] = zop;
					types.push(zop);
				}
			}
			$scope.all = Common.reform(types, $scope.groupSize);
			Common.cache.save($cordovaFile, Common.cache.categories, $scope.all);
		});
	}
	$scope.load = function(callback) {
		Zops.getGroups().done(function(data) {
				$scope.$apply(function() {
				$scope.all = Common.reform(data.result, $scope.groupSize);
				
				if(callback) {
					callback.call(this, $scope.all);
				}
			});
		},
		function(error) {
			$ionicLoading.hide();
			$scope.$apply(function() {
				$scope.error = error.message;
			});
		});
	};

	// cache and local logic
	document.addEventListener('deviceready', function () {
		Common.cache.load($cordovaFile, Common.cache.location, function(data) {
			Globals.useLocation = data.useLocation;
			$scope.useLocation = data.useLocation;
			$scope.$apply();
		});

    $cordovaFile.checkFile(cordova.file.dataDirectory, Common.cache.categories)
      .then(function (success) {
				Common.cache.load($cordovaFile, Common.cache.categories, function(data) {
					if(data && data.length > 0) {
						$scope.all = data;
					}
				});
				
				$scope.load(function(data) {
					Common.cache.save($cordovaFile, Common.cache.categories, data);
				});
      },
			
			function (error) {
				$scope.init();
				$scope.load(function(data) {
					Common.cache.save($cordovaFile, Common.cache.categories, data);
				});
			});
	});
	
	var toggle = false;
	
	$scope.more = function() {
		window.plugins.socialsharing.share(Constants.share_message, Constants.share_title, 'www/img/icon.png', Constants.share_url);
	};
	
	$scope.showSettings = function() {
		$state.go('settings', { back: 'tab.all' });
	};
})

.controller('TypedCtrl', function($scope, $state, $http, $stateParams, $ionicLoading, $cordovaFile, Constants, Common, Globals, Zops) {
	var filename = Common.cache.fromBase($stateParams.typeName);
	
	$scope.getRnd = Common.getRnd;
	$scope.prefix = 'all';
	$scope.groups = true;
	$scope.title = Common.formatType($stateParams.typeName) + 's';
	$scope.useLocation = Globals.useLocation;
	$scope.noZopsMessage = Constants.no_zops_message;
	$scope.noZopsAdd = Constants.no_zops_add;
	
	$scope.goAddZop = function() {
		$state.go('tab.new');
	};
	
	$scope.load = function(callback) {
		$ionicLoading.hide();
		$ionicLoading.show({ template: Constants.load_loading });
		Zops.getTyped($stateParams.typeName).done(function(data) {
			$scope.$apply(function() {
				
				$scope.typedZops = data.result;
				Common.decorate($scope.typedZops, Globals.useLocation);
				if(callback) {
					callback.call(this, $scope.typedZops);
				}
				$ionicLoading.hide();
			});
		},
		function(error) {
			$ionicLoading.hide();
			$scope.$apply(function() {
				$scope.error = error.message;
			});
		});
	};
	
	$scope.refresh = function(force) {
		$ionicLoading.show({ template: Constants.load_loading });

		if(force) {
			$ionicLoading.show({ template: Constants.load_refreshing_location })
			Common.updateLocation(Globals.useLocation, function() {
				$ionicLoading.hide();
				$scope.load(function(data) {
					Common.cache.save($cordovaFile, filename, data);
				});
			},
			function(error) {
				$ionicLoading.hide();
			});
		}
		else {
			$scope.load(function(data) {
				Common.cache.save($cordovaFile, filename, data);
			});
		}
	};
	
	// cache and local logic
	document.addEventListener('deviceready', function () {
    $cordovaFile.checkFile(cordova.file.dataDirectory, filename)
      .then(function (success) { // if cache file
				// load file
				$ionicLoading.show({ template: Constants.load_loading });
				Common.cache.load($cordovaFile, filename, function(data) {
					if(data && data.length > 0) {
						$scope.typedZops = data.filter(function(zop) {
							return zop.type == $stateParams.typeName && (Globals.countryId ? Globals.countryId === zop.countryID : true);
						});
						Common.decorate($scope.typedZops, Globals.useLocation);
					} else {
						$scope.noZops = true;
					}
					
					// refresh file with new data
					$scope.load(function(response) {
						Common.cache.save($cordovaFile, filename, response);
					});
					$ionicLoading.hide();
				});
      },
			
			function (error) { // else
				// load local file
				$ionicLoading.show({ template: Constants.load_loading });
				$http.get('json/zops.json').success(function(data){
					var temp = data.filter(function(zop) {
						return zop.type == $stateParams.typeName && (Globals.countryId ? Globals.countryId === zop.countryID : true);
					});
					
					if(temp && temp.length > 0) {
						$scope.typedZops = temp;
						Common.decorate($scope.typedZops, Globals.useLocation);
					} else {
						$scope.noZops = true;
					}
					
					// create cache file
					$scope.load(function(response) {
						Common.cache.save($cordovaFile, filename, response);
					});
					$ionicLoading.hide();
				});
			});
	});
})

.controller('NearestCtrl', function($scope, $ionicLoading, $state, Constants, Common, Globals, Zops) {
	$scope.title = 'Near You';
	$scope.prefix = 'nearest';
	$scope.nearest = true;
	$scope.latitude = Globals.latitude;
	$scope.longitude = Globals.longitude;
	$scope.noZopsMessage = Constants.no_zops_message;
	$scope.noZopsAdd = Constants.no_zops_add;
	
	$scope.goAddZop = function() {
		$state.go('tab.new');
	};
	
	$scope.$on('$ionicView.enter', function(){
		$scope.useLocation = Globals.useLocation;
	});
	
	$scope.get = function() {
		Zops.getNearest().done(function(data) {
			if(data && data.result.length > 0) {
				$scope.$apply(function() {
					$scope.typedZops = data.result;
					Common.decorate($scope.typedZops, Globals.useLocation);
					$ionicLoading.hide();
				});
			} else {
				$scope.noZops = true;
			}
		},
		function(error) {
			$ionicLoading.hide();
			$scope.$apply(function() {
				$scope.error = error.message;
			});
		});
	};
	
	$scope.refresh = function(force) {
		$ionicLoading.show({ template: Constants.load_loading });
		
		if(force) {
			$ionicLoading.show({ template: Constants.load_refreshing_location })
			Common.updateLocation(Globals.useLocation, function() {
				$ionicLoading.hide();
				$scope.get();
			});
		}
		else {
			$scope.get();
		}
	};
	
	$scope.showSettings = function() {
		$state.go('settings', { back: 'tab.nearest' });
	};
	
	$scope.refresh(false);
})

.controller('DetailCtrl', function($scope, $http, $ionicLoading, $stateParams, $ionicScrollDelegate, Constants, Common, Zops, Ads) {
	// advertising
	Ads.hide();
	Ads.showInterstitial();
	
	$scope.format = Common.format;
	$scope.msg = { know: Constants.confirmationKnow, been: Constants.confirmationBeen };
	$scope.post = { zopId: $stateParams.zopId, rating: 0, confirmed: null };
	$scope.rated = false;
	
	$ionicLoading.show({ template: Constants.load_loading });
	// load cache
	$http.get('json/zops.json').success(function(data){
		var temp = data.filter(function(zop) {
			return zop.id == $stateParams.zopId;
		});
			
		if(temp) {
			$scope.zop = temp[0];
			Common.mergeZop($scope.zop);
			$scope.$apply();
			$ionicLoading.hide();
		}
	});
		
	Zops.getZop($stateParams.zopId).done(function(data) {
		$scope.$apply(function() {
		 $scope.zop = data.result;
		 Common.mergeZop($scope.zop);
		 $ionicLoading.hide();
		});
	},
	function(error) {
		$ionicLoading.hide();
		$scope.$apply(function() {
			$scope.error = error.message;
		});
	});
	
	$scope.getDay = Zops.getDay;
	$scope.rate = function() {
		$scope.post.confirmedBy = 'apple';
		Zops.rateZop($scope.post).done(function(data) {
			$ionicScrollDelegate.scrollTop();
			Common.showMessage(Constants.rate_success);
		},
		function(error) {
			$scope.$apply(function() {
				$scope.error = error.message;
			});
		});
	
		$scope.rated = true;
	};
	$scope.goTo = function(location) {
		if(location) {
			launchnavigator.navigate([location.latitude, location.longitude], null, null, null, { preferGoogleMaps: true }); // latitude, longitude
		}
	};
})

.controller('NewCtrl', function($scope, $ionicLoading, $state, Constants, Common, Globals, Zops) {
	$scope.services = [];
	$scope.openings = [];
	$scope.countries = [];
	$scope.format = Common.format;
	$scope.types = Zops.getTypes();
	$scope.extendedTypes = Zops.getServices();
	$scope.days = Zops.getDays();
	$scope.getDay = Zops.getDay;
	$scope.address = null;
	$scope.excluded = 0;
	
	$scope.$on('$ionicView.enter', function(){
		$scope.useLocation = Globals.useLocation;
	});

	$scope.sortTypes = function(type) {
		if(type.id == 1) {
			return "a";
		}
		else {
			return type.name;
		}
	};
	
	Zops.getCountries().done(function(data) {
		$scope.$apply(function() {
		 $scope.countries = data.result;
		 $scope.setAddress();
		});
	},
	function(error) {
		$scope.$apply(function() {
			$scope.error = error.message;
		});
	});
	
	$scope.refresh = function() {
		$ionicLoading.show({ template: Constants.load_refreshing_location })
		Common.updateLocation(Globals.useLocation, function() {
			$ionicLoading.hide();
			$scope.updateAddress();
		},
		function(error) {
			$ionicLoading.hide();
		});
	};
	
	$scope.updateAddress = function() {
		if(Globals.useLocation) {
			Common.getAddress(Globals.latitude, Globals.longitude)
				.success(function(data, status, headers, config) {
					if(data && data.status == 'OK') {
						$scope.address = Common.getFormattedAddress(data.results[0]);
						$scope.setAddress();
					}
				})
				.error(function(data, status, headers, config) {
				});
		}
	};
	
	$scope.setAddress = function() {
		for(var i = 0; i < $scope.countries.length; i++) {
			if($scope.countries[i].id == $scope.address.country) {
				$scope.country = $scope.countries[i];
				break;
			}
		}
		$scope.post.city = $scope.address.city;
		$scope.post.street = $scope.address.street;
		$scope.post.streetNumber = $scope.address.streetNumber;
	};
	
	$scope.getServices = function() {
		var services = [];
		
		$scope.excluded = 0;
		for(var i = 0; i < $scope.extendedTypes.length; i++) {
			if($scope.extendedTypes[i].id == $scope.post.type) {
				$scope.services[i] = false;
				$scope.excluded = 1;
			}
			if($scope.services[i]) {
				services.push({ service: $scope.extendedTypes[i].service });
			}
		}

		return services;
	}
	
	$scope.addOpeningHour = function(day, sTime, eTime) {
		Common.appendDay($scope.openings, day, sTime, eTime);
	};
	
	$scope.removeOpeningHour = function(day, time) {
		var index = -1;
		
		for(var i = 0; i < $scope.openings.length; i++) {
			if($scope.openings[i].day == day) {
				index = i;
				break;
			}
		}
		
		if(index >= 0) {
			$scope.openings[index].hours.splice(time, 1);
			if($scope.openings[index].hours.length == 0) {
				$scope.openings.splice(index, 1);
			}
		}
	};
	
	$scope.submit = function() {
		$scope.post.openingHours = [];
		for(var i = 0; i < $scope.openings.length; i++) {
			for(var j = 0; j < $scope.openings[i].hours.length; j++) {
				$scope.post.openingHours.push($scope.openings[i].hours[j]);
			}
		}

		$scope.post.services = $scope.getServices();
		$scope.post.origin = Constants.apple;
		$scope.post.countryID = $scope.country.countryID;

		$ionicLoading.show({ template: Constants.load_sending });
		Zops.addZop($scope.post).done(function(data) {
			if(data.result.id > 0) {
				$scope.$apply(function() {
					$scope.post = {};
					$scope.services = [];
					$scope.openings = [];
					$scope.setAddress();
				});
				$ionicLoading.hide();
				Common.showMessage(Constants.zop_success);
			}
			else {
				$scope.failure = data.result.name;
			}
		},
		function(error) {
			$scope.$apply(function() {
				$scope.error = error.message;
			});
			Common.showMessage(Constants.failed);
		});
	};
	
	$scope.showSettings = function() {
		$state.go('settings', { back: 'tab.new' });
	};
	
	// run
	$scope.country = null;
	$scope.post = {};
	$scope.oDay = null;
	$scope.sTime = null;
	$scope.eTime = null;
	$scope.updateAddress();
})

.controller('SettingsCtrl', function($scope, $state, $stateParams, $ionicPopup, $cordovaFile, Globals, Constants, Common, InApp) {
	$scope.title = 'Settings';
	$scope.adsInactive = !Globals.adsFlag;
	$scope.location = { useLocation: Globals.useLocation };
	
	$scope.back = function() {
		$state.go($stateParams.back);
	};
	
	$scope.purchase = function() {
		$scope.adsPopup = $ionicPopup.show({
			templateUrl: 'popup-ads.html',
			title: Constants.msg_ads_title,
			scope: $scope,
			buttons: [
				{
					text: 'No'
				},
				{
					text: '<b>Purchase</b>',
					type: 'button-positive',
					onTap: function(e) {
						InApp.removeAds();
					}
				}
			]});
  };
	
	$scope.restore = function() {
		InApp.updatedHandler = function() {
			Common.showMessage(Constants.iap_ads_restored);
		}
		InApp.restore();
	};
	
	$scope.toggleLocation = function() {
		Common.cache.save($cordovaFile, Common.cache.location, $scope.location, function(data) {
			Globals.useLocation = data.useLocation;
			$scope.updating = false;
		}, function() {
			$scope.updating = false;
		});
	}
	
	document.addEventListener('deviceready', function () {
		$scope.updating = true;
		Common.cache.load($cordovaFile, Common.cache.location, function(data) {
			$scope.location.useLocation = data.useLocation;
			Globals.useLocation = data.useLocation;
			$scope.updating = false;
		}, function() {
			$scope.location.useLocation = true;
			$scope.updating = false;
		});
	});
});