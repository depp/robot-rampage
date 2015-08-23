/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');
var input = require('./input');
var param = require('./param');

var robotMaterial = new THREE.MeshPhongMaterial({color: 0x667788});

// Create a part of the robot.
function createPart(name, flipped) {
	var geometry = load.getModel('robot-' + name, flipped);
	if (!geometry) {
		return null;
	}
	var part = new THREE.Mesh(geometry, robotMaterial);
	return part;
}

// Robot class.
function Robot() {
	this.obj = new THREE.Group();
	this.mArms = [createPart('arm'), createPart('arm', true)];
	this.mLegs = [createPart('leg'), createPart('leg', true)];
	this.mHead = createPart('head');
	this.mTorso = createPart('torso');
	_.forEach(
		[this.mArms[0], this.mArms[1], this.mLegs[0], this.mLegs[1],
		 this.mHead, this.mTorso],
		function(part) { this.obj.add(part); }, this);

	this.x0 = 0;
	this.y0 = 0;
	this.x1 = 0;
	this.y1 = 0;
}

Robot.prototype.update = function() {
	var ctl = input.gameInput();
	var stat = param.ROBOT;
	this.x0 = this.x1;
	this.y0 = this.y1;
	this.x1 += stat.speed * param.DT * ctl.x;
	this.y1 += stat.speed * param.DT * ctl.y;
};

Robot.prototype.draw = function(frac) {
	this.obj.position.set(
		this.x0 + (this.x1 - this.x0) * frac,
		this.y0 + (this.y1 - this.y0) * frac,
		0);
};

module.exports = {
	Robot: Robot,
};
