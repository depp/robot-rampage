/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');

var robotMaterial = new THREE.MeshPhongMaterial({color: 0x667788});

// Create a part of the robot.
function createPart(name) {
	var geometry = load.getModel('robot-' + name);
	if (!geometry) {
		return null;
	}
	var part = new THREE.Mesh(geometry, robotMaterial);
	return part;
}

// Robot class.
function Robot() {
	this.obj = new THREE.Group();
	this.mArms = [createPart('arm'), createPart('arm-flip', true)];
	this.mLegs = [createPart('leg'), createPart('leg-flip', true)];
	this.mHead = createPart('head');
	this.mTorso = createPart('torso');
	_.forEach(
		[this.mArms[0], this.mArms[1], this.mLegs[0], this.mLegs[1],
		 this.mHead, this.mTorso],
		function(part) { this.obj.add(part); }, this);
}

module.exports = {
	Robot: Robot
};
