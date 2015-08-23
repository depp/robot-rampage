/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var param = require('./param');
var load = require('./load');

// Fire a laser beam from the robot.
function fireLaser(game, robot) {
	var i;

	var count = 1000;
	var geom = new THREE.Geometry();
	var material = new THREE.PointCloudMaterial({
		color: 0xffffffff,
		size: 1.5,
		map: load.getTexture('red-pulse'),
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
	});

	for (i = 0; i < count; i++) {
		geom.vertices.push(
			new THREE.Vector3(
				Math.random() * 10 - 5,
				Math.random() * 10 - 5,
				Math.random() * 5));
	}

	var cloud = new THREE.PointCloud(geom, material);
	game.scene.add(cloud);
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
