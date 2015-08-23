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
	var i;
	var density = param.density || 75;
	var count = Math.max(Math.round(density * v1.distanceTo(v2)), 1);
	var spread = param.spread || 0.25;
	var velocity = param.velocity || 0.5;
	var texture = param.texture || 'read-pulse';
	var time = param.time || 0.75;

	this.material = new THREE.PointCloudMaterial({
		color: 0xffffffff,
		size: 1.5,
		map: load.getTexture('red-pulse'),
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	});
	this.geometry = new THREE.BufferGeometry();
	var vertex = new Float32Array(count * 3);
	this.velocity = new Float32Array(count * 3);
	for (i = 0; i < count; i++) {
		var frac = Math.random();
		vertex.set([
			v1.x + (v2.x - v1.x) * frac + (Math.random() * 2 - 1) * spread,
			v1.y + (v2.y - v1.y) * frac + (Math.random() * 2 - 1) * spread,
			v1.z + (v2.z - v1.z) * frac + (Math.random() * 2 - 1) * spread,
		], i * 3);
		this.velocity.set([
			(Math.random() * 2 - 1) * velocity,
			(Math.random() * 2 - 1) * velocity,
			(Math.random() * 2 - 1) * velocity,
		], i * 3);
	}
	this.geometry.addAttribute(
		'position', new THREE.BufferAttribute(vertex, 3));
	this.totalTime = time;
	this.time = time;
	this.dead = false;
	this.obj = new THREE.PointCloud(this.geometry, this.material);
}

// Update graphics.
Beam.prototype.draw = function(dt) {
	this.material.opacity = Math.cos(
		0.5 * Math.PI * (1 - this.time / this.totalTime));
	var i, attr = this.geometry.getAttribute('position'), arr = attr.array;
	for (i = 0; i < arr.length; i++) {
		arr[i] += this.velocity[i] * dt;
	}
	attr.needsUpdate = true;
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
