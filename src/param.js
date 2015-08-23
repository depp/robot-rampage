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
		// Maximum walking, backward speed, and running speed.
		walkSpeed: 5,
		runSpeed: 10,
		backSpeed: 3,
		// Minimum speed at which braking occurs.
		brakeSpeed: 1,
		// Movement acceleration, stop acceleration, and brake acceleration.
		walkAccel: 2.5,
		walkStop: 2.5,
		walkBrake: 5.0,
		runAccel: 1.0,
		runStop: 2.5,
		runBrake: 3.0,
		// Angular acceleration and maximum angular speed.
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
	// Weapon stats.
	WEAPON: {
		laser: {
			cooldown: 0.25,
			spreadX: 0.1,
			spreadY: 0.1,
			angleY: 0.15,
			light: {
				color: 0x10ff40,
				time: 0.8,
				intensity: 1.0,
				distance: 10,
			},
		},
		triple: {
			cooldown: 0.15,
			spreadX: 0.2,
			spreadY: 0.2,
			angleX: 1.0,
			angleY: 0.2,
			light: {
				color: 0xff4010,
				time: 0.4,
				intensity: 2.0,
				distance: 15,
			},
		},
	},
	// City generation parameters.
	CITY: {
		// City size.
		width: 150,
		height: 150,
		// Range of sizes for city areas subdivided with roads of the given size.
		// Minimum distance between roads of the given size.
		subdivide: [
			{ min:     6, max:   6*5, dist:  0 },
			{ min:   5*5, max: 12*12, dist:  1 },
			{ min: 10*10, max: 64*64, dist:  8 },
			{ min: 30*30, max:     0, dist: 16 },
		],
		// Maximum length of a city block.
		blockLength: 10,
		// Chance to allow a narrow subdivision.
		narrowChance: 0.6,
	},
	// Camera parameters.
	CAMERA: {
		focal: 45,
		targetSmooth: 0.2,
		positionSmooth: 0.15,
		distance0: 16,
		distance1: 20,
		angle0: (Math.PI / 180) * 35,
		angle1: (Math.PI / 180) * 45,
		topSpeed: 8,
		predictTime: 0.8,
	},
};
