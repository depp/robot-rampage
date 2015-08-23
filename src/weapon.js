/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var param = require('./param');
var load = require('./load');
var particles = require('./particles');

// Fire a laser beam from the robot.
function fireLaser(game, robot) {
	game.particles.add(new particles.Beam(
		new THREE.Vector3(-3, 0, 4),
		new THREE.Vector3(+3, 0, 4),
		{}));
}

function WeaponState() {
	this.cooldown = 0;
	this.warmup = 0;
	this.latched = false;
	this.update = this.updateLaser;
}

// Common update function.
WeaponState.prototype.updateCommon = function(action) {
	this.cooldown = Math.max(0, this.cooldown - param.DT);
	if (action) {
		this.warmup += param.DT;
	} else {
		this.latched = false;
		this.warmup = 0;
	}
};

// Update the weapon.
WeaponState.prototype.updateLaser = function(game, robot, action) {
	this.updateCommon(action);
	if (action && !this.latched && !this.cooldown) {
		this.latched = true;
		this.cooldown = param.WEAPON.baseCooldown;
		load.getSfx('shoot').play();
		fireLaser(game, robot);
	}
};

module.exports = {
	WeaponState: WeaponState,
};
