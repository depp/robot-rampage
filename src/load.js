/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

// Geometry mesh for all of the models.
var models = {};

var FLIP_MODELS = {'robot-arm':true, 'robot-leg':true};
// Test if a model needs to get flipped.
function modelNeedsFlip(name) {
	return !!FLIP_MODELS[name] || /^bld_/.match(name);
}

// Flatten faces in geometry.
function flattenGeometry(g, name, flip) {
	var xsc = flip ? -1 : +1;
	var ng = new THREE.Geometry();
	var i, vert = g.vertices;
	for (i = 0; i < g.faces.length; i++) {
		var f = g.faces[i];
		var v0 = vert[f.a], v1 = vert[f.b], v2 = vert[f.c];
		ng.vertices.push(
			new THREE.Vector3(v0.x * xsc, -v0.z, v0.y),
			new THREE.Vector3(v1.x * xsc, -v1.z, v1.y),
			new THREE.Vector3(v2.x * xsc, -v2.z, v2.y));
		ng.faces.push(
			flip ?
				new THREE.Face3(i*3+0, i*3+2, i*3+1) :
				new THREE.Face3(i*3+0, i*3+1, i*3+2));
	}
	ng.computeFaceNormals();
	ng.computeVertexNormals();
	var bg = new THREE.BufferGeometry();
	bg.fromGeometry(ng);
	bg.computeBoundingBox();
	bg.name = name;
	return bg;
}

// Preload all models, call func when finished.
function init_models(path_map, func) {
	var matrix = (new THREE.Matrix4()).identity();
	matrix.elements[5]  =  0;
	matrix.elements[6]  = +1;
	matrix.elements[9]  = -1;
	matrix.elements[10] =  0;
	var loader = new THREE.JSONLoader();
	var modelCount = _.size(path_map.models);
	var modelLoaded = 0;
	_.forOwn(path_map.models, function(path, name) {
		loader.load(
			'assets/models/' + path + '.json',
			function(geometry, materials) {
				models[name] = flattenGeometry(geometry, name, false);
				if (modelNeedsFlip) {
					var fname = name + '@flip';
					models[fname] = flattenGeometry(geometry, fname, true);
				}
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
function getModel(name, flipped) {
	var key = name;
	if (flipped) {
		key += '@flip';
	}
	var value = models[key];
	if (typeof value !== 'object') {
		console.error('Unknown model: ' + key);
		return null;
	}
	return value;
}

// Call function for each model, passing the model and its name.
function forModels(func, thisArg) {
	_.forOwn(models, function(model, name) {
		if (/@flip$/.test(name)) {
			return;
		}
		func.call(thisArg, model, name);
	});
}

module.exports = {
	init: init,
	getModel: getModel,
	forModels: forModels,
};
