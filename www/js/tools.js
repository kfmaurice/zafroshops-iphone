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

angular.module('starter.tools', [])

.constant('Constants',
{
	appName:'Zafroshops',
	maxRating: 5,
	nopictureyet: 'img/nopictureyet.png',
	apple: 'apple',
	
	load_loading: 'loading...',
	load_refreshing_location: 'refreshing location...',
	load_sending: 'sending data...',
	
	push_message: 'New zops available',
	no_zops_message: 'There seem to be no * listed for your country',
	no_zops_add: 'Add a Zop',
	
	failed: 'Oh, something wrong happened :-(',
	zop_success: 'Thanks for the address :-)',
	rate_success: 'Thanks for the rating :-)',
	share_message: 'Hey,\n\nCheck this website on places with african roots. You can find clubs, restaurants and more there. Do submit your local store if it\'s not already there.\n\n\nCheers,\n',
	share_title: 'Check this site',
	share_url: 'http://zafroshops.com',
	confirmationKnow: 'I have heard of',
	confirmationBeen: 'I\'ve been there once',
	
	iap_ads_pid: 'RemoveAdvertisingProductID',
	iap_ads_alias: 'Remove Ads',
	iap_ads_restored: 'Your purchase has been restored.\nPlease restart the app to see the change.',
	iap_ads_verified: 'Thanks, ads will disappear as soon as your request is verified',
	
	msg_ads_title: 'Get rid of Ads',
	msg_ads_subtitle: 'from the app forever'
})

.factory('InApp', function(Constants, Common, Globals, Ads) {
	return {
		updatedHandler: null,
		adsProduct: null,
		
		registerAds: function() {
			
			store.register({
				id: Constants.iap_ads_pid,
				alias: Constants.iap_ads_alias,
				type: store.NON_CONSUMABLE
			});
			
//			store.validator = ?;
			store.when(Constants.iap_ads_pid).approved(function(product) {
//			product.verify();
//			store.when(Constants.iap_ads_pid).verified(function(product) {
				product.finish();
//			});
			});
			
			store.error(function(error) {
				Common.showMessage(error.message);
			});
			
			store.when(Constants.iap_ads_pid).owned(function(product) {
				this.setFlag(false);
			});
			
			store.when(Constants.iap_ads_pid).updated(function(product) {
				this.setFlag(!product || (product && (product.owned == false)));
				if(this.updatedHandler) {
					this.updatedHandler.call(this);
				}
			});

			this.ownedAdsUI(this.adsOwned);
			
			store.refresh();
			
			this.updateAdsUI(this.adsEvent);
			this.setFlag(!this.adsRemoved());
		},
		
		setFlag: function(val) {
			Globals.adsFlag = val;
			
			if(val == false) {
				Ads.hide();
			}
		},
		
		adsEvent: function(product) {
			// set values for databinding here
			if(product) {
				this.adsProduct = product;
				this.adsOwned(product);
			}
		},
	
		adsOwned: function(product) {
			this.setFlag(product ? !product.owned : true);
		},

		adsRequested: function(product) {
			Common.showMessage(Constants.iap_ads_verified);
		},

		requestedAdsUI: function(callback) {
			store.when(Constants.iap_ads_pid).requested(callback);
		},

		ownedAdsUI: function(callback) {
			store.when(Constants.iap_ads_pid).owned(callback);
		},
		
		updateAdsUI: function(callback) {
			callback.call(this, store.get(Constants.iap_ads_pid));
			store.when(Constants.iap_ads_pid).updated(callback);
		},
		
		removeAds: function() {
			store.order(Constants.iap_ads_pid);
		},
		
		restore: function() {
			store.refresh();
		},
		
		adsRemoved: function() {
			var product = store.get(Constants.iap_ads_pid);

			return product ? product.owned : false;
		},
		
		clear: function(callback) {
			store.off(callback);
		}
	}
})

.factory('Ads', function(Common, Globals) {
	return {
		adMobId: function() {
			if(/(android)/i.test(navigator.userAgent)) {
				return {
					banner: 'ca-app-pub-2514964223223347/1814620110',
					interstitial: 'ca-app-pub-2514964223223347/8475955710'
				};
			}
			else if(/(ipod|iphone|ipad)/i.test(navigator.userAgent)) {
				return {
					banner: 'ca-app-pub-2514964223223347/3117392910',
					interstitial: 'ca-app-pub-2514964223223347/4594126111'
				};
			}
		},
		
		showBanner: function() {
			if(AdMob && Globals.adsFlag) {
				var id = this.adMobId();

				AdMob.createBanner({
					adId: id.banner,
					position: AdMob.AD_POSITION.BOTTOM_CENTER,
					autoShow: true
				});
			}
		},
		
		showInterstitial: function() {
			if(AdMob && Globals.adsFlag) {
				var id = this.adMobId();

				AdMob.prepareInterstitial({
					adId: id.interstitial,
					autoShow: true
				});
			}
		},
		
		hide: function() {
			if(AdMob) {
				AdMob.removeBanner();
			}
		}
	}
})

.factory('Globals', function() {
	return {
		latitude: null,
		longitude: null,
		countryId: null,
		adsFlag: true,
		dataVersion: 0,
		useLocation: true,
		dontShowHelp: false
	};
})

.factory('Common', function($http, $ionicPopup, Globals, Constants, Keys) {
	var client = null;
	var address = {
		country: ['long_name', 'country'],
		locality: ['long_name', 'city'],
		route: ['long_name', 'street'],
		street_number: ['long_name', 'streetNumber']
	};
	var callbacks = {
		onSuccess: function(position) {
			var _this = this;
			
			Globals.latitude = position.coords.latitude;
			Globals.longitude = position.coords.longitude;
			this._getAddress(Globals.latitude, Globals.longitude)
				.success(function(data, status, headers, config) {
					if(data && data.status == 'OK') {
						var address = _this._getFormattedAddress(data.results[0]);
					
						if(address) {
							Globals.countryId = address.country;
						}
					}
				});
		},
		
		onError: function(error) {
			if(Globals.latitude == null) {
				Globals.latitude = 49.051442;
				Globals.longitude =	8.257338;
			}
		},
				
		update: function(success, failure) {
			var _this = this;
					
			navigator.geolocation.getCurrentPosition(function(position) {
				_this.onSuccess(position);
				if(success) {
					success.call();
				}
			},
			function(error) {
				_this.onError(error);
				if(failure) {
					failure.call();
				}
			});
		},
		
		_getAddress: function(latitude, longitude) {
			return $http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + latitude + ',' + longitude + '&language=en' + '&key=' + Keys.googleApiKey);
		},
		_getFormattedAddress: function(place) {
			var addr = { };
			
			if(place.address_components) {
				var l = place.address_components.length;
				
				for(var i = 0; i < l; i++) {
					var component = place.address_components[i];
					var addressType = component.types[0];
					
					if(addressType == 'country') {
						addr.country = component.short_name;
					}
					else if (address[addressType]) {
						var val = component[address[addressType][0]];
						var field = address[addressType][1];
				 
						addr[field] = val;
					}
				}
			}
			
			return addr;
		}
	};
	
	return {
		cache: {
			categories: 'categories.txt',
			base: 'zops_*.txt',
			location: 'location.txt',
			help: 'help.txt',
			
			fromBase: function(type) {
				return this.base.replace('*', type);
			},
			load: function(handle, file, succeed, failed) {
				handle.readAsText(cordova.file.dataDirectory, file)
					.then(function (success) {
						var data = JSON.parse(success);
						
						if(succeed) {
							succeed.call(this, data);
						}
					}, function (error) {
						if(failed) {
							failed.call(this, error);
						}
					});
			},
			save: function(handle, file, data, succeed, failed) {
				var content = JSON.stringify(data);
				
				handle.writeFile(cordova.file.dataDirectory, file, content, true)
					.then(function (success) {
						if(succeed) {
							succeed.call(this, data);
						}
					}, function (error) {
						if(failed) {
							failed.call(this, error);
						}
					});
			}
		},
		
		service: function() {
			if(client == null) {
				client = new WindowsAzure.MobileServiceClient(Keys.azureSite, Keys.azureKey);
			}
			
			return client;
		},
		
		getAddress: function(latitude, longitude) {
			return callbacks._getAddress(latitude, longitude);
		},
		
		getFormattedAddress: function(place) {
			return callbacks._getFormattedAddress(place);
		},
		
		updateLocation: function(force, success, failure) {
			if(force === true) {
				callbacks.update(success, failure);
			}
			else if(force === false) {
				if(success) {
					success.call();
				}
			}
		},
		
		initLocation: function(handle) {
			var _this = this;
			var test = handle == null;
			
			_this.cache.load(handle, this.cache.location, function(data) {
				if(data && data.useLocation) {
					_this.updateLocation(true);
				}
			}, function(error){
				_this.updateLocation(true);
			});
		},
		
		appendDay: function(openings, day, sTime, eTime) {
			if(day != null && sTime && eTime) {
				var index = -1;
				var obj = sTime.getHours;
		
				for(var i = 0; i < openings.length; i++) {
					if(openings[i].day == day) {
						index = i;
						break;
					}
				}
			
				if(index < 0) {
					openings.splice(0, 0, { day: day,
						hours: [{ day: day, startTimeHour: obj ? sTime.getHours() : sTime[0], startTimeMinute: obj ? sTime.getMinutes() : sTime[1],
							endTimeHour: obj ? eTime.getHours() : eTime[0], endTimeMinute: obj ? eTime.getMinutes() : eTime[1] }]
					});
				}
				else {
					openings[index].hours.push({ day: day, startTimeHour: obj ? sTime.getHours() : sTime[0], startTimeMinute: obj ? sTime.getMinutes() : sTime[1],
						endTimeHour: obj ? eTime.getHours() : eTime[0], endTimeMinute: obj ? eTime.getMinutes() : eTime[1] });
					openings[index].hours.sort(function(a, b) {
						return a.startTimeHour - b.startTimeHour;
					});
				}
			}
		},
		
		calculateDistance: function (lat1, lon1, lat2, lon2) {
			var R = 6371; // Radius of the earth in km
			var dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
			var dLon = this.deg2rad(lon2 - lon1);
			var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
		 
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			var d = R * c; // Distance in km
			
			return d;
		},
		
		deg2rad: function (deg) {
			return deg * (Math.PI / 180);
		},
		
		mergeZop: function(zop) {
			if(zop.services) {
				var contained = false;
				var temp = [];
				
				for(var i = 0; i < zop.services.length; i++) {
					if(zop.services[i].service == zop.type) {
						contained = true;
					}
					
					zop.services[i].service = zop.services[i].service.toLowerCase();
				}
				
				if(!contained) {
					zop.services.splice(0, 0, { service: zop.type.toLowerCase() });
				}
				
				if(zop.openingHours && zop.openingHours.length > 0) {
					for(var i = 0; i < zop.openingHours.length; i++) {
						this.appendDay(temp, zop.openingHours[i].day,
							[zop.openingHours[i].startTimeHour, zop.openingHours[i].startTimeMinute], [zop.openingHours[i].endTimeHour, zop.openingHours[i].endTimeMinute]);
					}
					
					zop.openingHours = temp;
				}
			}
		},
		
		decorate: function(zops, useLocation, nearest) {
			for(var i = 0; i < zops.length; i++) {
				zops[i].icon = nearest ? this.img(zops[i].type) : this.getRnd(1, 8);
				
				if(useLocation) {
					var location = zops[i].location;
					if(Globals.latitude != null && Globals.longitude != null && location && location.latitude != null && location.longitude != null) {
						zops[i].distance = this.calculateDistance(Globals.latitude, Globals.longitude, location.latitude, location.longitude).toFixed(2);
					}
				}
			}
		},
	
		format: function(x, y) {
			var txt = 'x' + x + ':x' + y + '#';
			var reg1 = /x(\d):/g;
			var reg2 = /x(\d)#/g;
		
			return txt.replace(reg1, '0$1:').replace(reg2, '0$1').replace(/x|#/g, '');
		},
		
		img: function(type) {
			return type.toLowerCase();
		},
		
		formatType: function(type) {
			if(type) {
				return type[0].toUpperCase() + type.substr(1).replace(/([A-Z])/g, ' $1');
			}
		},
		
		reform: function(data, limit) {
			var result = [];
			
			data.sort(function(a, b) {
				if(a.type == 'shop') {
					return -1;
				}
				else if(b.type == 'shop') {
					return 1;
				}
				else {
					return a.type.localeCompare(b.type);
				}
			});
			
			for(var i = 0; i < data.length; i++) {
				var j = Math.floor(i / limit);
				if(i % limit == 0) {
					result.push(new Array());
				}
      
				result[j].push(data[i]);
			}
    
			return result;
		},
		
		showMessage: function(message) {
			var alertPopup = $ionicPopup.alert({
				title: Constants.appName,
				template: message
			});
			alertPopup.then(function(res) {
				//console.log('');
			});
		},
		
		showHelp: function(scope) {
			var help = $ionicPopup.show({
				title: 'Help',
				templateUrl: 'popup-help.html',
				scope: scope,
				buttons: [{
					text: 'OK',
					type: 'button-positive',
					onTap: function(e) {
					}
				}]
			});
			
			help.then(function() {
			
			});
		},
		
		getRnd: function(x, y) {
			return Math.floor(Math.random() * y + x);
		}
	};
});
