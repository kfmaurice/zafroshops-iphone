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

angular.module('starter.addins', [])

.directive('rating', function($compile, Constants) {

	return {
		restrict: 'E',
		scope: {
			stars: '=?'
		},

		link: function (scope, element, attrs, controller) {
			scope.change = function(value, current) {
				scope.stars = value == current ? 0 : value;
			};

			scope.$watch('stars', function() {
				var value = 0 || parseInt(scope.stars);
				
				element.empty();
				for(var i = 0; i < value; i++) {
					var ev = attrs.editable ? 'ng-click="change(' + (i + 1)  + ', ' + value + ')"' : '';
					element.append($compile('<i class="ion-ios-star" ' + ev + '></i>')(scope));
				}
				for(var i = 0; i < Constants.maxRating - value; i++) {
					var ev = attrs.editable ? 'ng-click="change(' + (value + i + 1) + ', ' + value + ')"' : '';
					element.append($compile('<i class="ion-ios-star-outline" ' + ev + '></i>')(scope));
				}
			});
		}
	}
});