/* Copyright 2015 Dietrich Epp.

   This file is part of Robot Rampage.  The Robot Rampage source
   code is distributed under the terms of the MIT license.
   See LICENSE.txt for details. */
'use strict';

// Physics update rate, in Hz.
var RATE = 30;

module.exports = {
	// Physics update rate, in Hz.
	RATE: RATE,
	// Physics update interval, in s.
	DT: 1 / RATE,
	// Maximum update interval, in s.
	MAX_UPDATE_INTERVAL: 0.5,

	// Robot stats.
	ROBOT: {
		// Forward acceleration and maximum speed.
		fwdAccel: 2.5,
		fwdSpeed: 5,
		// Backward acceleration and maximum speed.
		bakAccel: 2.5,
		bakSpeed: 5,
		// Angular acceleration and maximum speed.
		angAccel: 10,
		angSpeed: 2.5,
		// Control angles in the "forward" range move the robot forward,
		// angles in the "backward" range move the robot backward.
		// As the speed increases towards the latch speed, the range
		// of angles for the direction of movement get wider, allowing
		// the player to keep momentum and turn if moving, but turn
		// while stating still otherwise.
		forwardAngle: Math.PI * 0.3,
		latchAngle: Math.PI * 0.6,
		backwardAngle: Math.PI * 0.8,
		latchSpeed: 1,
	},
};
