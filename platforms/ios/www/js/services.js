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

angular.module('starter.services', [])

.factory('Zops', function(Common, Globals) {
	var types = [{
		service: "Shop", id: 1, name: "Shop"
	},
	{
		service: "Bar", id: 2, name: "Bar"
	},
	{
		service: "BarberShop", id: 4, name: "Barber Shop"
	},
	{
		service: "Cafe", id: 8, name: "Cafe"
	},
	{
		service: "CallBox", id: 16, name: "Call Box"
	},
	{
		service: "NightClub", id: 32, name: "Night Club"
	},
	{
		service: "Restaurant", id: 64, name: "Restaurant"
	},
	{
		service: "Cosmetics", id: 128, name: "Cosmetics"
	},
	{
		service: "Catering", id: 256, name: "Catering"
	},
	{
		service: "Association", id: 512, name: "Association"
	}];
	
	var services = [{
		service: "Shop", id: 1, name: "Shop"
	},
	{
		service: "Bar", id: 2, name: "Bar"
	},
	{
		service: "BarberShop", id: 4, name: "Barber Shop"
	},
	{
		service: "Cafe", id: 8, name: "Cafe"
	},
	{
		service: "CallBox", id: 16, name: "Call Box"
	},
	{
		service: "NightClub", id: 32, name: "Night Club"
	},
	{
		service: "Cosmetics", id: 128, name: "Cosmetics"
	},
	{
		service: "Catering", id: 256, name: "Catering"
	}];
	
	var days = [{
		name: "Monday", id: 0
	},
	{
		name: "Tuesday", id: 1
	},
	{
		name: "Wednesday", id: 2
	},
	{
		name: "Thursday", id: 3
	},
	{
		name: "Friday", id: 4
	},
	{
		name: "Saturday", id: 5
	},
	{
		name: "Sunday", id: 6
	}];
  
  return {
		getDays: function() {
			return days;
		},
		getDay: function(day){		
			for(var i = 0; i < days.length; i++) {
				if(days[i].id == day) {
					return days[i].name;
				}
			}
		},
		getTypes: function() {
			return types;
		},
		getServices: function() {
			return services;
		},
    getGroups: function() {
			return Common.service().invokeApi('mobileZop', { method: 'GET', parameters: { count: true } });
    },
		getTyped: function(typeName) {
			return Globals.latitude != null && Globals.longitude != null ?
				Common.service().invokeApi('mobileZop', { method: 'GET', parameters: { latitude: Globals.latitude, longitude: Globals.longitude, type: typeName } }) :
				Common.service().invokeApi('mobileZop', { method: 'GET', parameters: { type: typeName } });
		},
		getNearest: function() {
			return Common.service().invokeApi('mobileZop?$top=5', { method: 'GET', parameters: { latitude: Globals.latitude, longitude: Globals.longitude } });
		},
		getZop: function(zopId) {
			return Common.service().invokeApi('mobileZop', { method: 'GET', parameters: { fullId: zopId } });
		},
		getCountries: function() {
			return Common.service().invokeApi('mobileCountry', { method: 'GET' });
		},
		getDataVersion: function() {
			return Common.service().invokeApi('mobileZop', { method: 'POST', version: 0 });
		},
		
		addZop: function(zop) {
			return Common.service().invokeApi('mobileZop', { method: 'POST', body: zop });
		},
		rateZop: function(confirmation) {
			return Common.service().invokeApi('mobileConfirmation', { method: 'POST', body: confirmation });
		}
  }
});
