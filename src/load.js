/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

// =====================================================================
// Models
// =====================================================================

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
function initModels(path_map, func) {
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

// =====================================================================
// Textures
// =====================================================================

var textures = {};

// Preload all textures, call func when finished.
function initTextures(path_map, func) {
	var loader = new THREE.TextureLoader();
	var imageCount = _.size(path_map.images);
	var imageLoaded = 0;
	_.forOwn(path_map.images, function(path, name) {
		loader.load(
			'assets/images/' + path,
			function(texture) {
				textures[name] = texture;
				imageLoaded++;
				if (imageLoaded == imageCount) {
					func();
				}
			});
	});
}

// Get a texture by name.
function getTexture(name) {
	return textures[name];
}

// =====================================================================
// HUD images
// =====================================================================

var hudImages = {};

// Preload all textures, call func when finished.
function initHud(path_map, func) {
	var imageCount = _.size(path_map.hud);
	var imageLoaded = 0;
	_.forOwn(path_map.hud, function(path, name) {
		var img = new Image();
		img.addEventListener('load', function() {
			imageLoaded++;
			if (imageLoaded == imageCount) {
				func();
			}
		}, false);
		img.src = 'assets/hud/' + path;
		hudImages[name] = img;
	});
}

// Get a HUD image by name.
function getHudImage(name) {
	return hudImages[name];
}

// =====================================================================
// Sound effects
// =====================================================================

// Sound effects
var sfx = {};

function initSfx(path_map, func) {
	_.forOwn(path_map.sfx, function(paths, name) {
		var npaths = _.collect(paths, function(path) {
			return 'assets/sfx/' + path;
		});
		sfx[name] = new Howl({urls: npaths});
	});
	func();
}

function getSfx(name) {
	return sfx[name];
}

// =====================================================================
// Sound effects
// =====================================================================

// Sound effects
var music = {};

function initMusic(path_map, func) {
	_.forOwn(path_map.music, function(paths, name) {
		music[name] = _.collect(paths, function(path) {
			return 'assets/music/' + path;
		});
	});
	func();
}

function getMusic(name) {
	return new Howl({urls: music[name]});
}

// =====================================================================
// Video
// =====================================================================

// Videos
var video = {};

function videoType(path) {
	var re = /(?:\.([^.]+))?$/;
	var ext = re.exec(path)[1];
	switch (ext) {
	case 'mp4': return 'video/mp4';
	case 'webm': return 'video/webm';
	}
}

function initVideo(path_map, func) {
	_.forOwn(path_map.video, function(paths, name) {
		video[name] = _.collect(paths, function(path) {
			return {
				uri: 'assets/video/' + path,
				type: videoType(path),
			};
		});
	});
	func();
}

function getVideo(name) {
	return video[name];
}

// =====================================================================
// Common
// =====================================================================

// Preload all resources, call func when finished.
function init(path_map, func) {
	var rem = 6;
	function finish() {
		rem--;
		if (!rem) {
			func();
		}
	}
	initModels(path_map, finish);
	initTextures(path_map, finish);
	initHud(path_map, finish);
	initSfx(path_map, finish);
	initMusic(path_map, finish);
	initVideo(path_map, finish);
}

module.exports = {
	init: init,
	getModel: getModel,
	forModels: forModels,
	getTexture: getTexture,
	getHudImage: getHudImage,
	getSfx: getSfx,
	getMusic: getMusic,
	getVideo: getVideo,
};
