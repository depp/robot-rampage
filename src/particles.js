/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');
var param = require('./param');
var util = require('./util');

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
function Beam(traces, param) {
	var density = param.density || 100;
	var spread = param.spread || 1.0;
	var speed = param.speed || 1.0;
	var texture = param.texture || 'red-pulse';
	var time = param.time || 1.0;

	var counts = _.collect(traces, function(trace) {
		return Math.max(
			Math.round(density * trace.pos1.distanceTo(trace.pos2)), 1);
	});
	var count = _.sum(counts);

	this.material = new THREE.PointCloudMaterial({
		color: 0xffffffff,
		size: param.size || 1.5,
		map: load.getTexture(texture),
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	});
	this.geometry = new THREE.BufferGeometry();
	var vertex = new Float32Array(count * 3);
	var velocity = new Float32Array(count * 3);
	this.velocity = velocity;
	var i = 0;
	_.forEach(traces, function(trace, idx) {
		var p1 = trace.pos1, p2 = trace.pos2;
		var v1 = trace.vel1, v2 = trace.vel2;
		var j = i, e = i + counts[idx];
		for (; j < e; j++) {
			var frac = Math.random();
			vertex.set([
				p1.x + (p2.x - p1.x) * frac + (Math.random() * 2 - 1) * spread,
				p1.y + (p2.y - p1.y) * frac + (Math.random() * 2 - 1) * spread,
				p1.z + (p2.z - p1.z) * frac + (Math.random() * 2 - 1) * spread,
			], j * 3);
			velocity.set([
				(Math.random() * 2 - 1) * speed + v1.x + frac * (v2.x - v1.x),
				(Math.random() * 2 - 1) * speed + v1.y + frac * (v2.y - v1.y),
				(Math.random() * 2 - 1) * speed + v1.z + frac * (v2.z - v1.z),
			], j * 3);
		}
		i = e;
	});
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

// Explosion particle cloud class.
function Explosion(boxes, param) {
	var density = param.density || 10;
	var spread = param.spread || 1.0;
	var speed = param.speed || 2;
	var texture = param.texture || 'fire-poof';
	var time = param.time || 1.0;

	var counts = _.collect(boxes, function(box) {
		return Math.max(
			Math.round(density * util.boxVolume(box)), 1);
	});
	var count = _.sum(counts);

	this.material = new THREE.PointCloudMaterial({
		color: 0xffffff,
		size: param.size || 3.5,
		map: load.getTexture(texture),
		transparent: true,
		depthWrite: false,
	});
	this.geometry = new THREE.BufferGeometry();
	var vertex = new Float32Array(count * 3);
	var velocity = new Float32Array(count * 3);
	this.velocity= velocity;
	var i = 0;
	_.forEach(boxes, function(box, idx) {
		var j = i, e = i + counts[idx];
		var x0 = 0.5 * (box.max.x + box.min.x);
		var y0 = 0.5 * (box.max.y + box.min.y);
		var z0 = box.min.z;
		var xr = 0.5 * (box.max.x - box.min.x);
		var yr = 0.5 * (box.max.y - box.min.y);
		var zr = box.max.z - box.min.z;
		for (; j < e; j++) {
			var xd = (Math.random() * 2 - 1) * xr;
			var yd = (Math.random() * 2 - 1) * yr;
			var zd = Math.random() * zr;
			vertex.set([x0 + xd, y0 + yd, z0 + zd], j * 3);
			velocity.set([
				speed * xd + spread * Math.random(),
				speed * yd + spread * Math.random(),
				speed * zd + spread * Math.random()
			], j * 3);
		}
		i = e;
	});
	this.geometry.addAttribute(
		'position', new THREE.BufferAttribute(vertex, 3));
	this.totalTime = time;
	this.time = time;
	this.dead = false;
	this.obj = new THREE.PointCloud(this.geometry, this.material);
	this.count = count;
	this.rebound = 0.5;
	this.gravity = 10.0;
}

// Update graphics.
Explosion.prototype.draw = function(dt) {
	this.material.opacity = 0.5 * Math.cos(
		0.5 * Math.PI * (1 - this.time / this.totalTime));
	var i, n = this.count;
	var attr = this.geometry.getAttribute('position');
	var pos = attr.array, vel = this.velocity;
	for (i = 0; i < n; i++) {
		pos[i*3+0] += vel[i*3+0] * dt;
		pos[i*3+1] += vel[i*3+1] * dt;
		pos[i*3+2] += vel[i*3+2] * dt;
		if (pos[i*3+2] < 0) {
			pos[i*3+2] = Math.abs(pos[i*3+2]);
			vel[i*3+0] = vel[i*3+0] * this.rebound;
			vel[i*3+1] = vel[i*3+1] * this.rebound;
			vel[i*3+2] = Math.abs(vel[i*3+2] * this.rebound);
		}
		vel[i*3+2] -= this.gravity * dt;
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
	Explosion: Explosion,
};
