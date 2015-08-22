/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

// Geometry mesh for all of the models.
var models = {};

// Preload all models, call func when finished.
function init_models(path_map, func) {
	var loader = new THREE.JSONLoader();
	var modelCount = _.size(path_map.models);
	var modelLoaded = 0;
	_.forOwn(path_map.models, function(path, name) {
		loader.load(
			'assets/models/' + path + '.json',
			function(geometry, materials) {
				models[name] = geometry;
				modelLoaded++;
				if (modelLoaded == modelCount) {
					func();
				}
			});
	});
}

// Preload all resources, call func when finished.
function init(path_map, func) {
	init_models(path_map, func);
}

// Get the named model.
function getModel(name) {
	var value = models[name];
	if (typeof value !== 'object') {
		console.error('Unknown model: ' + name);
		return null;
	}
	return value;
}

module.exports = {
	init: init,
	getModel: getModel
};
