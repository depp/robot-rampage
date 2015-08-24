/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var param = require('./param');
var load = require('./load');
var particles = require('./particles');
var util = require('./util');
var light = require('./light');

var BEAM_BASE = {
	speed: 0.25,
	density: 75,
};
var LASER_BEAM = _.assign({
	time: 0.75,
	size: 1.5,
	spread: 0.1,
	texture: 'green-pulse',
}, BEAM_BASE);
var TRIPLE_BEAM = _.assign({
	time: 0.3,
	size: 1.0,
	spread: 0.08,
	texture: 'red-pulse',
}, BEAM_BASE);

// Calculate a laser trace {v1, v2}.
function laserTrace(game, robot, angleX, angleY, wstat) {
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
	var ray = new THREE.Ray(v1, dir);
	var hit = game.city.raycast(ray);
	if (hit.hit) {
		game.city.damage(hit.end, 0, 1);
	}
	// console.log(hit);
	// var v2 = dir.multiplyScalar(20).add(v1);
	return {
		pos1: v1, pos2: hit.end,
		vel1: robot.velocity,
		vel2: new THREE.Vector3(0, 0, 0)
	};
}

function WeaponState() {
	this.cooldown = 0;
	this.warmup = 0;
	this.latched = false;
	this.light = new light.Light();
	this.light.obj.position.set(0, 4, 2.5);
	this.obj = this.light.obj;
	this.setWeapon('laser');
}

WeaponState.prototype.setWeapon = function(name) {
	switch (name) {
	case 'laser': this.update = this.updateLaser; break;
	case 'triple': this.update = this.updateTriple; break;
	case 'wave': this.update = this.updateWave; break;
	case 'bomb': this.update = this.updateBomb; break;
	default:
		return;
	}
	this.weapon = name;
	this.time = param.WEAPON[name].time;
};

// Common update function.
WeaponState.prototype.updateCommon = function(action) {
	this.cooldown = Math.max(0, this.cooldown - param.DT);
	if (this.time !== null) {
		this.time -= param.DT;
		if (this.time < 0) {
			this.setWeapon('laser');
		}
	}
	if (action) {
		this.warmup += param.DT;
	} else {
		this.latched = false;
		this.warmup = 0;
	}
	this.light.update();
};

// Update the weapon.
WeaponState.prototype.updateLaser = function(game, robot, action) {
	this.updateCommon(action);
	if (action && !this.latched && !this.cooldown) {
		var wstat = param.WEAPON.laser;
		var rstat = robot.stats;
		var trace = laserTrace(game, robot, 0, wstat.angleY, wstat);
		this.latched = true;
		this.cooldown = wstat.cooldown;
		load.getSfx('shoot').play();
		game.particles.add(new particles.Beam([trace], LASER_BEAM));
		this.light.flash(wstat.light);
	}
};

WeaponState.prototype.updateTriple = function(game, robot, action) {
	this.updateCommon(action);
	if (action && !this.cooldown) {
		var wstat = param.WEAPON.triple;
		var rstat = robot.stats;
		var traces = [
			laserTrace(game, robot,             0, wstat.angleY, wstat),
			laserTrace(game, robot, -wstat.angleX, wstat.angleY, wstat),
			laserTrace(game, robot, +wstat.angleX, wstat.angleY, wstat),
		];
		this.cooldown = wstat.cooldown;
		load.getSfx('shoot').play();
		game.particles.add(new particles.Beam(traces, TRIPLE_BEAM));
		this.light.flash(wstat.light);
	}
};

WeaponState.prototype.updateWave = function(game, robot, action) {
	this.updateCommon(action);
};

WeaponState.prototype.updateBomb = function(game, robot, action) {
	this.updateCommon(action);
};

module.exports = {
	WeaponState: WeaponState,
};
