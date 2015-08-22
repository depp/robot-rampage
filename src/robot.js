/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');

var robotMaterial = new THREE.MeshPhongMaterial({color: 0x667788});

/*
var  = (new THREE.Matrix4()).identity();
mirrorX.elements[0] = -1;
*/

// Create a part of the robot.
function createPart(name, mirrorX) {
	var geometry = load.getModel('robot-' + name);
	if (!geometry) {
		return null;
	}
	var part = new THREE.Mesh(geometry, robotMaterial);
	part.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
	return part;
}

// Robot class.
function Robot() {
	this.obj = new THREE.Group();
	this.mArms = [createPart('arm')];
	this.mLegs = [createPart('leg')];
	this.mHead = createPart('head');
	this.mTorso = createPart('torso');
	_.forEach(
		[this.mArms[0], this.mLegs[0], this.mHead, this.mTorso],
		function(part) { this.obj.add(part); }, this);
}

module.exports = {
	Robot: Robot
};
