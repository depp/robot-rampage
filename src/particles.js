/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');
var param = require('./param');

function ParticleSystem() {
	this.obj = new THREE.Group();
	this.clouds = [];
}

// Add a particle cloud to the system.
ParticleSystem.prototype.add = function(obj) {
	if (obj.dead) {
		return;
	}
	this.clouds.push(obj);
	this.obj.add(obj.obj);
};

// Beam particle cloud class.
function Beam(v1, v2, param) {
	var density = param.density || 100;
	var count = Math.max(Math.round(density * v1.distanceTo(v2)), 1);
	var spread = param.spread || 0.5;
	var velocity = param.velocity || 1.0;
	var texture = param.texture || 'read-pulse';
	this.geometry = new THREE.Geometry();
	var material = new THREE.PointCloudMaterial({
		color: 0xffffffff,
		size: 1.5,
		map: load.getTexture('red-pulse'),
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	});
	var i;
	for (i = 0; i < count; i++) {
		var frac = Math.random();
		this.geometry.vertices.push(
			new THREE.Vector3(
				v1.x + (v2.x - v1.x) * frac + (Math.random() * 2 - 1) * spread,
				v1.y + (v2.y - v1.y) * frac + (Math.random() * 2 - 1) * spread,
				v1.z + (v2.z - v1.z) * frac + (Math.random() * 2 - 1) * spread));
	}
	this.time = 1.0;
	this.dead = false;
	this.obj = new THREE.PointCloud(this.geometry, material);
}

Beam.prototype.draw = function(dt) {
};

// Advance world by one frame.
ParticleSystem.prototype.update = function() {
	var anyDead = false;
	_.forEach(this.clouds, function(cloud) {
		if (cloud.time) {
			cloud.time -= param.DT;
			if (cloud.time < 0) {
				cloud.dead = true;
			}
		}
		if (cloud.dead) {
			anyDead = true;
		}
	});
	if (anyDead) {
		var end = this.clouds.length;
		for (var i = end - 1; i >= 0; i--) {
			var cloud = this.clouds[i];
			if (cloud.dead) {
				this.obj.remove(cloud.obj);
				cloud.geometry.dispose();
				end--;
				this.clouds[i] = this.clouds[end];
			}
		}
		this.clouds.splice(end, this.clouds.length - end);
	}
};

// Update graphics.
ParticleSystem.prototype.draw = function(frac) {
	var dt = frac * param.DT;
	if (dt < 1e-3) {
		return;
	}
	_.forEach(this.clouds, function(cloud) {
		cloud.draw(dt);
	});
};

module.exports = {
	ParticleSystem: ParticleSystem,
	Beam: Beam,
};
