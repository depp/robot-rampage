/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var param = require('./param');
var load = require('./load');
var particles = require('./particles');
var util = require('./util');

var LASER_BEAM = {
	spread: 0.1,
	speed: 0.25,
	density: 74,
	time: 0.75,
};

// Calculate a laser trace {v1, v2}.
function laserTrace(robot, angleX, angleY, wstat) {
	var rstat = robot.stats;
	var euler = new THREE.Euler(
		0,
		angleY + (Math.random() * 2 - 1) * wstat.spreadY,
		robot.a1 + angleX + (Math.random() * 2 - 1) * wstat.spreadX,
		'ZYX');
	var dir = (new THREE.Vector3(1, 0, 0)).applyEuler(euler);
	euler.y = 0;
	var v1 = (new THREE.Vector3(0, 0, rstat.weaponHeight))
			.add(new THREE.Vector3(wstat.weaponRadius, 0, 0)
					 .applyEuler(euler))
			.multiplyScalar(rstat.scale)
			.add(new THREE.Vector3(robot.x1, robot.y1, 0));
	var v2 = dir.multiplyScalar(10).add(v1);
	return {v1: v1, v2: v2};
}

function WeaponState() {
	this.cooldown = 0;
	this.warmup = 0;
	this.latched = false;
	this.update = false ? this.updateLaser : this.updateTriple;
	this.light = new THREE.PointLight(0xffffff);
	this.light.position.set(0, 4, 2.5);
	this.light.distance = 15;
	this.light.intensity = 0;
	this.lightTime = 0;
	this.lightScale = 0;
	this.obj = this.light;
}

// Flash the light.
WeaponState.prototype.flashLight = function(light) {
	this.light.color.setHex(light.color);
	this.lightTime = light.time;
	this.lightScale = light.intensity / light.time;
	// this.light.distance = light.distance;
};

// Fire a laser beam from the robot.
WeaponState.prototype.fireLaser = function(game, robot, traces) {
	game.particles.add(new particles.Beam(traces, LASER_BEAM));
};

// Common update function.
WeaponState.prototype.updateCommon = function(action) {
	this.cooldown = Math.max(0, this.cooldown - param.DT);
	if (action) {
		this.warmup += param.DT;
	} else {
		this.latched = false;
		this.warmup = 0;
	}
	this.lightTime = Math.max(0, this.lightTime - param.DT);
	this.light.intensity = this.lightTime * this.lightScale;
};

// Update the weapon.
WeaponState.prototype.updateLaser = function(game, robot, action) {
	this.updateCommon(action);
	if (action && !this.latched && !this.cooldown) {
		var wstat = param.WEAPON.laser;
		var rstat = robot.stats;
		var trace = laserTrace(robot, 0, wstat.angleY, wstat);
		this.latched = true;
		this.cooldown = wstat.cooldown;
		load.getSfx('shoot').play();
		this.fireLaser(game, robot, [trace]);
		this.flashLight(wstat.light);
	}
};

WeaponState.prototype.updateTriple = function(game, robot, action) {
	this.updateCommon(action);
	if (action && !this.cooldown) {
		var wstat = param.WEAPON.triple;
		var rstat = robot.stats;
		var traces = [
			laserTrace(robot,             0, wstat.angleY, wstat),
			laserTrace(robot, -wstat.angleX, wstat.angleY, wstat),
			laserTrace(robot, +wstat.angleX, wstat.angleY, wstat),
		];
		this.cooldown = wstat.cooldown;
		load.getSfx('shoot').play();
		this.fireLaser(game, robot, traces);
		this.flashLight(wstat.light);
	}
};

module.exports = {
	WeaponState: WeaponState,
};
