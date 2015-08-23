/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

var load = require('./load');
var input = require('./input');
var param = require('./param');
var weapon = require('./weapon');
var util = require('./util');

var STATS = {
	scale: 0.5,
	weaponHeight: 4.4,
	weaponRadius: 1.0,
};

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
	this.stats = STATS;
	this.obj = new THREE.Group();
	this.obj.scale.set(STATS.scale, STATS.scale, STATS.scale);
	this.mArms = [createPart('arm'), createPart('arm', true)];
	this.mLegs = [createPart('leg'), createPart('leg', true)];
	this.mHead = createPart('head');
	this.mTorso = createPart('torso');
	_.forEach(
		[this.mArms[0], this.mArms[1], this.mLegs[0], this.mLegs[1],
		 this.mHead, this.mTorso],
		function(part) { this.obj.add(part); }, this);

	this.x0 = this.x1 = 0;
	this.y0 = this.y1 = 0;
	this.a0 = this.a1 = Math.PI / 2;
	this.speed = 0;
	this.weapon = new weapon.WeaponState();
	this.obj.add(this.weapon.obj);
	// Used by the camera.
	this.velocity = new THREE.Vector3();
}

// Advance world by one frame.
Robot.prototype.update = function(game, allowInput) {
	this.x0 = this.x1;
	this.y0 = this.y1;
	this.a0 = this.a1;

	var ctl = input.gameInput();
	if (!allowInput) {
		ctl.x = 0;
		ctl.y = 0;
		ctl.action = false;
	}
	var stat = param.ROBOT;

	// Update angle and speed from controls.
	(function() {
		// Whether the player is trying brake or stop, and the target speed.
		var doBrake, doStop, targetSpeed;
		// Control magnitude, and whether it is large enough to be considered
		// "active".
		var ctlMag = Math.sqrt(ctl.x * ctl.x + ctl.y * ctl.y);
		var activeMove = ctlMag > 0.25;
		if (activeMove) {
			// Player is trying to move us.

			// Control angle.
			var ctlAngle = Math.atan2(ctl.y, ctl.x);

			// Magnitude of difference between facing and control angles.
			var relAngleMag = util.angleDiff(this.a1, ctlAngle);

			// Range of angles considered "forward" and "backward".
			var fwdAngle = stat.forwardAngle;
			var backAngle = stat.backwardAngle;
			var latchFrac = Math.min(Math.abs(this.speed) / stat.latchSpeed, 1.0);
			if (this.speed > 0) {
				fwdAngle += (stat.latchAngle - fwdAngle) * latchFrac;
			} else {
				backAngle += (stat.latchAngle - backAngle) * latchFrac;
			}

			// Set target speed and angle.
			var targetAngle;
			if (relAngleMag <= fwdAngle) {
				// Move forward
				targetAngle = ctlAngle;
				targetSpeed = ctlMag * stat.runSpeed;
			} else if (relAngleMag <= backAngle) {
				// Turn
				targetAngle = ctlAngle;
				targetSpeed = 0;
			} else {
				// Move backward
				targetAngle = util.angleAdd(ctlAngle, Math.PI);
				targetSpeed = -ctlMag * stat.backSpeed;
			}

			// Update the angle.
			var deltaAngle = util.angleSub(targetAngle, this.a1);
			var smallAngle = stat.angSpeed * param.DT;
			if (Math.abs(deltaAngle) <= smallAngle) {
				this.a1 = targetAngle;
			} else {
				this.a1 = util.angleAdd(
					this.a1, deltaAngle > 0 ? smallAngle : -smallAngle);
			}

			// Calculate acceleration.
			doBrake = Math.abs(this.speed) > stat.brakeSpeed &&
					this.speed * targetSpeed < 0;
			doStop = Math.abs(targetSpeed) < Math.abs(this.speed);
		} else {
			// Player is not trying to move us.
			targetSpeed = 0;
			doBrake = false;
			doStop = true;
		}

		// Acceleration.
		var accel;
		if (this.speed > stat.runSpeed) {
			accel = doBrake ? stat.runBrake :
				(doStop ? stat.runStop : stat.runAccel);
		} else {
			accel = doBrake ? stat.walkBrake :
				(doStop ? stat.walkStop : stat.walkAccel);
		}

		// Update the speed.
		var deltaSpeed = targetSpeed - this.speed;
		var smallSpeed = accel * param.DT;
		if (Math.abs(deltaSpeed) < smallSpeed) {
			this.speed = targetSpeed;
		} else {
			if (deltaSpeed > 0) {
				this.speed += smallSpeed;
			} else {
				this.speed -= smallSpeed;
			}
		}
	}).call(this);

	// Update position from angle and speed.
	(function() {
		if (Math.abs(this.a1 - this.a0) > Math.PI) {
			if (this.a1 > this.a0) {
				this.a0 += 2 * Math.PI;
			} else {
				this.a0 -= 2 * Math.PI;
			}
		}
		var dirx = Math.cos(this.a1), diry = Math.sin(this.a1);
		this.velocity.set(
			this.speed * dirx,
			this.speed * diry,
			0);
		this.x1 += this.speed * param.DT * dirx;
		this.y1 += this.speed * param.DT * diry;
	}).call(this);

	this.weapon.update(game, this, ctl.action);
};

// Update graphics.
Robot.prototype.draw = function(frac) {
	this.obj.position.set(
		this.x0 + (this.x1 - this.x0) * frac,
		this.y0 + (this.y1 - this.y0) * frac,
		0);
	this.obj.rotation.set(
		0,
		0,
		this.a0 + (this.a1 - this.a0) * frac - 0.5 * Math.PI,
		'XYZ');
};

module.exports = {
	Robot: Robot,
};
